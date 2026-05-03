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
    $stmt = $db->prepare("SELECT * FROM categories WHERE user_id=? ORDER BY name ASC");
    $stmt->execute([$uid]);
    echo json_encode(['data' => $stmt->fetchAll()]);

} elseif ($method === 'POST') {
    $b     = json_decode(file_get_contents('php://input'), true);
    $name  = trim($b['name']  ?? '');
    $color = trim($b['color'] ?? '#16a34a');
    if (!$name) { http_response_code(400); echo json_encode(['error'=>'Name required']); exit; }

    $stmt = $db->prepare("INSERT INTO categories (user_id,name,color) VALUES (?,?,?)");
    $stmt->execute([$uid, $name, $color]);
    echo json_encode(['ok'=>true, 'id'=>$db->lastInsertId()]);

} elseif ($method === 'DELETE') {
    $id   = intval($_GET['id'] ?? 0);
    $stmt = $db->prepare("DELETE FROM categories WHERE id=? AND user_id=?");
    $stmt->execute([$id, $uid]);
    if ($stmt->rowCount() === 0) { http_response_code(404); echo json_encode(['error'=>'Not found']); exit; }
    echo json_encode(['ok'=>true]);

} else {
    http_response_code(405); echo json_encode(['error'=>'Method not allowed']);
}
