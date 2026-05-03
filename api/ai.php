<?php
session_start();
require_once '../config/database.php';
require_once '../includes/auth_check.php';
require_once '../config/config.php';
apiAuthCheck();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['error'=>'Method not allowed']); exit;
}

$db   = getDB();
$uid  = $_SESSION['user_id'];
$body = json_decode(file_get_contents('php://input'), true);
$type = $body['type'] ?? 'chat';

// Build context about the user's finances
function buildFinancialContext(PDO $db, int $uid): string {
    $month = date('n'); $year = date('Y'); $ym = date('Y-m');

    $s = $db->prepare("SELECT COALESCE(SUM(amount),0) total, COUNT(*) cnt FROM expenses WHERE user_id=? AND strftime('%Y-%m',date)=?");
    $s->execute([$uid, $ym]); $monthRow = $s->fetch();

    $s = $db->prepare("
        SELECT COALESCE(c.name,'Uncategorized') cat, SUM(e.amount) total
        FROM expenses e LEFT JOIN categories c ON e.category_id=c.id
        WHERE e.user_id=? AND strftime('%Y-%m',e.date)=?
        GROUP BY c.id ORDER BY total DESC LIMIT 5
    ");
    $s->execute([$uid, $ym]); $cats = $s->fetchAll();

    $s = $db->prepare("SELECT COALESCE(SUM(amount),0) total FROM budgets WHERE user_id=? AND month=? AND year=?");
    $s->execute([$uid, $month, $year]); $budRow = $s->fetch();

    $s = $db->prepare("SELECT COALESCE(SUM(amount),0) monthly_cost FROM recurring_expenses WHERE user_id=? AND is_active=1");
    $s->execute([$uid]); $recRow = $s->fetch();

    $catStr = implode(', ', array_map(fn($c)=>"{$c['cat']}: P{$c['total']}", $cats));
    $ctx  = "Current month ({$ym}): Total spent = P{$monthRow['total']} across {$monthRow['cnt']} transactions. ";
    $ctx .= "Budget set: P{$budRow['total']}. Recurring monthly expenses: P{$recRow['monthly_cost']}. ";
    $ctx .= "Top categories: {$catStr}. Currency: BWP (Botswana Pula). ";
    return $ctx;
}

$systemPrompt = "You are EcoBudget's AI Financial Advisor, an expert in personal finance tailored for users in Botswana. "
    . "You give practical, specific, and encouraging advice about budgeting, saving, and investing. "
    . "Always reference BWP (Botswana Pula) and local context where relevant. "
    . "Keep responses concise, helpful, and formatted with markdown for readability. "
    . "User's financial context: " . buildFinancialContext($db, $uid);

if ($type === 'monthly_summary') {
    $month = intval($body['month'] ?? date('n'));
    $year  = intval($body['year']  ?? date('Y'));
    $ym    = sprintf('%04d-%02d', $year, $month);

    $s = $db->prepare("SELECT COALESCE(SUM(amount),0) total, COUNT(*) cnt FROM expenses WHERE user_id=? AND strftime('%Y-%m',date)=?");
    $s->execute([$uid, $ym]); $totRow = $s->fetch();

    $s = $db->prepare("
        SELECT COALESCE(c.name,'Uncategorized') cat, SUM(e.amount) total, COUNT(*) cnt
        FROM expenses e LEFT JOIN categories c ON e.category_id=c.id
        WHERE e.user_id=? AND strftime('%Y-%m',e.date)=?
        GROUP BY c.id ORDER BY total DESC
    ");
    $s->execute([$uid, $ym]); $cats = $s->fetchAll();
    $catStr = implode("\n", array_map(fn($c)=> "- {$c['cat']}: P{$c['total']} ({$c['cnt']} transactions)", $cats));

    $s = $db->prepare("SELECT COALESCE(SUM(amount),0) bud FROM budgets WHERE user_id=? AND month=? AND year=?");
    $s->execute([$uid, $month, $year]); $budRow = $s->fetch();

    $prompt = "Generate a friendly end-of-month financial summary for " . date('F Y', mktime(0,0,0,$month,1,$year)) . ". "
        . "Total spent: P{$totRow['total']} across {$totRow['cnt']} transactions. "
        . "Budget: P{$budRow['bud']}. "
        . "Spending by category:\n{$catStr}\n\n"
        . "Provide: (1) A brief overview (2) Key insights (3) 3 specific tips to improve next month. "
        . "Be encouraging and practical.";

    $messages = [['role' => 'user', 'content' => $prompt]];
} else {
    // Chat
    $messages = $body['messages'] ?? [];
    if (empty($messages)) { http_response_code(400); echo json_encode(['error'=>'No messages']); exit; }
}

// Call OpenAI
$apiKey = OPENAI_API_KEY;
if ($apiKey === 'YOUR_OPENAI_API_KEY_HERE' || empty($apiKey)) {
    // Fallback: rule-based responses
    $lastMsg = strtolower(end($messages)['content'] ?? '');
    $resp    = getFallbackResponse($lastMsg);
    echo json_encode(['content' => $resp]); exit;
}

$payload = [
    'model'       => OPENAI_MODEL,
    'messages'    => array_merge([['role'=>'system','content'=>$systemPrompt]], $messages),
    'max_tokens'  => 800,
    'temperature' => 0.7,
];

$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ["Authorization: Bearer $apiKey", "Content-Type: application/json"],
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_TIMEOUT        => 30,
]);
$res     = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    $err = json_decode($res, true)['error']['message'] ?? 'OpenAI request failed';
    http_response_code(500); echo json_encode(['error' => $err]); exit;
}

$aiData  = json_decode($res, true);
$content = $aiData['choices'][0]['message']['content'] ?? 'Sorry, I could not generate a response.';
echo json_encode(['content' => $content]);

// ── Fallback responses when no API key ──────────────────
function getFallbackResponse(string $msg): string {
    if (str_contains($msg, 'tip') || str_contains($msg, 'save')) {
        return "**5 Practical Saving Tips for Botswana:**\n\n- Set a monthly budget for each category and track it weekly\n- Reduce eating out — preparing meals at home can save P500–P1,500/month\n- Review your recurring subscriptions quarterly\n- Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings\n- Open a savings account at a local bank (Stanbic, FNB, or BancABC offer competitive rates)";
    }
    if (str_contains($msg, 'invest')) {
        return "**Getting Started with Investing in Botswana:**\n\n- **Start with an emergency fund** — 3–6 months of expenses in a savings account\n- **BSE (Botswana Stock Exchange)** — consider investing in local listed companies\n- **Unit Trusts** — offered by Bifm, Allan Gray, and other fund managers\n- **Pension contributions** — maximise your employer scheme if available\n- Start small: even P200/month compounded over 10 years makes a significant difference";
    }
    if (str_contains($msg, 'budget') || str_contains($msg, 'over')) {
        return "**Budget Optimisation Tips:**\n\n- Categorise all your expenses so you can see where money goes\n- Set realistic limits — review your last 3 months of spending as a baseline\n- Prioritise essential categories: housing, food, transport\n- Cut discretionary spending by 10–15% first before touching essentials\n- Use the budgets page to set per-category limits and get alerts";
    }
    return "I'm your EcoBudget AI Financial Advisor! I can help you with:\n\n- **Saving tips** based on your spending patterns\n- **Budget advice** to optimise your monthly allocations\n- **Investment basics** for Botswana residents\n- **Spending analysis** and where to cut back\n\nWhat would you like to know?";
}
