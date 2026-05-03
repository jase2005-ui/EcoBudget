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
    $month = intval($_GET['month'] ?? date('n'));
    $year  = intval($_GET['year']  ?? date('Y'));

    $stmt = $db->prepare("
        SELECT b.*, c.name category_name, c.color category_color, b.amount budget_amount,
               COALESCE((
                   SELECT SUM(e.amount) FROM expenses e
                   WHERE e.user_id = b.user_id
                     AND e.category_id = b.category_id
                     AND strftime('%Y-%m', e.date) = printf('%04d-%02d', b.year, b.month)
               ), 0) spent
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = ? AND b.month = ? AND b.year = ?
        ORDER BY c.name
    ");
    $stmt->execute([$uid, $month, $year]);
    echo json_encode(['data' => $stmt->fetchAll()]);

} elseif ($method === 'POST') {
    $b      = json_decode(file_get_contents('php://input'), true);
    $catId  = intval($b['category_id'] ?? 0);
    $amount = floatval($b['amount']     ?? 0);
    $month  = intval($b['month']        ?? date('n'));
    $year   = intval($b['year']         ?? date('Y'));

    if (!$catId || $amount <= 0) { http_response_code(400); echo json_encode(['error'=>'Category and amount required']); exit; }

    // Upsert
    $stmt = $db->prepare("
        INSERT INTO budgets (user_id, category_id, amount, month, year)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, category_id, month, year) DO UPDATE SET amount=excluded.amount
    ");
    $stmt->execute([$uid, $catId, $amount, $month, $year]);
    echo json_encode(['ok'=>true]);

} elseif ($method === 'DELETE') {
    $id   = intval($_GET['id'] ?? 0);
    $stmt = $db->prepare("DELETE FROM budgets WHERE id=? AND user_id=?");
    $stmt->execute([$id, $uid]);
    echo json_encode(['ok'=>true]);

} else {
    http_response_code(405); echo json_encode(['error'=>'Method not allowed']);
}
