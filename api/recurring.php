<?php
session_start();
require_once '../config/database.php';
require_once '../includes/auth_check.php';
apiAuthCheck();
header('Content-Type: application/json');

$db     = getDB();
$uid    = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->prepare("
        SELECT r.*, c.name category_name, c.color category_color
        FROM recurring_expenses r
        LEFT JOIN categories c ON r.category_id = c.id
        WHERE r.user_id = ?
        ORDER BY r.description
    ");
    $stmt->execute([$uid]);
    echo json_encode(['data' => $stmt->fetchAll()]);

} elseif ($method === 'POST') {
    $b = json_decode(file_get_contents('php://input'), true);

    // Handle "generate" action
    if (($b['action'] ?? '') === 'generate') {
        $stmt = $db->prepare("
            SELECT * FROM recurring_expenses
            WHERE user_id = ? AND is_active = 1
        ");
        $stmt->execute([$uid]);
        $items = $stmt->fetchAll();

        $currentMonth = date('Y-m');
        $generated    = 0;

        foreach ($items as $item) {
            // Only generate if not already generated this month
            if ($item['last_generated'] === $currentMonth) continue;

            $day  = intval($item['day_of_month']);
            $date = date('Y-m-') . str_pad($day, 2, '0', STR_PAD_LEFT);
            // Clamp day to last day of month
            $maxDay = intval(date('t'));
            if ($day > $maxDay) $date = date('Y-m-t');

            $ins = $db->prepare("INSERT INTO expenses (user_id,category_id,description,amount,date,payment_method,notes) VALUES (?,?,?,?,?,?,?)");
            $ins->execute([$uid, $item['category_id'], $item['description'], $item['amount'], $date, $item['payment_method'], 'Auto-generated from recurring']);

            $upd = $db->prepare("UPDATE recurring_expenses SET last_generated=? WHERE id=?");
            $upd->execute([$currentMonth, $item['id']]);
            $generated++;
        }
        echo json_encode(['ok'=>true, 'generated'=>$generated, 'message'=>"Generated $generated expense(s) for " . date('F Y')]);
        exit;
    }

    // Create new recurring
    $desc   = trim($b['description'] ?? '');
    $amount = floatval($b['amount'] ?? 0);
    $day    = intval($b['day_of_month'] ?? 1);
    $catId  = $b['category_id'] ?: null;
    $pay    = $b['payment_method'] ?? 'bank transfer';

    if (!$desc || $amount <= 0) { http_response_code(400); echo json_encode(['error'=>'Description and amount required']); exit; }
    if ($day < 1 || $day > 28)  { http_response_code(400); echo json_encode(['error'=>'Day must be between 1 and 28']); exit; }

    $stmt = $db->prepare("INSERT INTO recurring_expenses (user_id,category_id,description,amount,day_of_month,payment_method) VALUES (?,?,?,?,?,?)");
    $stmt->execute([$uid, $catId, $desc, $amount, $day, $pay]);
    echo json_encode(['ok'=>true, 'id'=>$db->lastInsertId()]);

} elseif ($method === 'PUT') {
    $b  = json_decode(file_get_contents('php://input'), true);
    $id = intval($b['id'] ?? 0);

    $chk = $db->prepare("SELECT id FROM recurring_expenses WHERE id=? AND user_id=?");
    $chk->execute([$id, $uid]);
    if (!$chk->fetch()) { http_response_code(404); echo json_encode(['error'=>'Not found']); exit; }

    if (isset($b['is_active'])) {
        $stmt = $db->prepare("UPDATE recurring_expenses SET is_active=? WHERE id=?");
        $stmt->execute([$b['is_active'] ? 1 : 0, $id]);
    }
    echo json_encode(['ok'=>true]);

} elseif ($method === 'DELETE') {
    $id   = intval($_GET['id'] ?? 0);
    $stmt = $db->prepare("DELETE FROM recurring_expenses WHERE id=? AND user_id=?");
    $stmt->execute([$id, $uid]);
    echo json_encode(['ok'=>true]);

} else {
    http_response_code(405); echo json_encode(['error'=>'Method not allowed']);
}
