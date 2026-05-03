<?php
// For API endpoints: call apiAuthCheck()
// For pages: call pageAuthCheck()

function apiAuthCheck(): void {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (empty($_SESSION['user_id'])) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorised']);
        exit;
    }
}

function pageAuthCheck(): void {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (empty($_SESSION['user_id'])) {
        header('Location: login.php');
        exit;
    }
}
