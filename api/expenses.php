<?php
session_start();
require_once '../config/database.php';
require_once '../includes/auth_check.php';
apiAuthCheck();
header('Content-Type: application/json');

$db  = getDB();
$uid = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->prepare("
        SELECT e.*, c.name category_name, c.color category_color
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.user_id = ?
        ORDER BY e.date DESC, e.id DESC
    ");
    $stmt->execute([$uid]);
    echo json_encode(['data' => $stmt->fetchAll()]);

} elseif ($method === 'POST') {
    $b = json_decode(file_get_contents('php://input'), true);
    $desc   = trim($b['description'] ?? '');
    $amount = floatval($b['amount'] ?? 0);
    $date   = $b['date'] ?? date('Y-m-d');
    $catId  = $b['category_id'] ?: null;
    $pay    = $b['payment_method'] ?? 'cash';
    $notes  = trim($b['notes'] ?? '');

    if (!$desc || $amount <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Description and a positive amount are required']);
        exit;
    }
    $stmt = $db->prepare("INSERT INTO expenses (user_id,category_id,description,amount,date,payment_method,notes) VALUES (?,?,?,?,?,?,?)");
    $stmt->execute([$uid, $catId, $desc, $amount, $date, $pay, $notes]);
    echo json_encode(['ok' => true, 'id' => $db->lastInsertId()]);

} elseif ($method === 'PUT') {
    $b  = json_decode(file_get_contents('php://input'), true);
    $id = intval($b['id'] ?? 0);
    // verify ownership
    $chk = $db->prepare("SELECT id FROM expenses WHERE id=? AND user_id=?");
    $chk->execute([$id, $uid]);
    if (!$chk->fetch()) { http_response_code(404); echo json_encode(['error'=>'Not found']); exit; }

    $stmt = $db->prepare("UPDATE expenses SET description=?,amount=?,category_id=?,date=?,payment_method=?,notes=? WHERE id=?");
    $stmt->execute([
        trim($b['description']),
        floatval($b['amount']),
        $b['category_id'] ?: null,
        $b['date'],
        $b['payment_method'] ?? 'cash',
        trim($b['notes'] ?? ''),
        $id,
    ]);
    echo json_encode(['ok' => true]);

} elseif ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    $stmt = $db->prepare("DELETE FROM expenses WHERE id=? AND user_id=?");
    $stmt->execute([$id, $uid]);
    if ($stmt->rowCount() === 0) { http_response_code(404); echo json_encode(['error'=>'Not found']); exit; }
    echo json_encode(['ok' => true]);

} else {
    http_response_code(405); echo json_encode(['error' => 'Method not allowed']);
}
