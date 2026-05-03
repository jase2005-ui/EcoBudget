<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['error'=>'Method not allowed']); exit;
}

$body  = json_decode(file_get_contents('php://input'), true);
$name  = trim($body['name']     ?? '');
$email = trim($body['email']    ?? '');
$pass  = trim($body['password'] ?? '');

if (!$name || !$email || !$pass) {
    http_response_code(400); echo json_encode(['error'=>'All fields required']); exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400); echo json_encode(['error'=>'Invalid email address']); exit;
}
if (strlen($pass) < 6) {
    http_response_code(400); echo json_encode(['error'=>'Password must be at least 6 characters']); exit;
}

$db = getDB();

// Check duplicate
$chk = $db->prepare("SELECT id FROM users WHERE email = ?");
$chk->execute([$email]);
if ($chk->fetch()) {
    http_response_code(409); echo json_encode(['error'=>'Email already registered']); exit;
}

$hash = password_hash($pass, PASSWORD_DEFAULT);
$ins  = $db->prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)");
$ins->execute([$name, $email, $hash]);
$userId = $db->lastInsertId();

// Seed default categories
seedDefaultCategories($db, (int)$userId);

session_regenerate_id(true);
$_SESSION['user_id']    = $userId;
$_SESSION['user_name']  = $name;
$_SESSION['user_email'] = $email;

echo json_encode(['ok'=>true]);
