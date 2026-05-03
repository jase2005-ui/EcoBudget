<?php
session_start();
require_once '../config/database.php';
require_once '../includes/auth_check.php';
apiAuthCheck();
header('Content-Type: application/json');

$db     = getDB();
$uid    = $_SESSION['user_id'];
$now    = date('Y-m-d');
$weekStart = date('Y-m-d', strtotime('monday this week'));
$monthStart = date('Y-m-01');
$month  = date('n');
$year   = date('Y');

// Today
$s = $db->prepare("SELECT COALESCE(SUM(amount),0) total, COUNT(*) cnt FROM expenses WHERE user_id=? AND date=?");
$s->execute([$uid, $now]); $todayRow = $s->fetch();

// Week
$s = $db->prepare("SELECT COALESCE(SUM(amount),0) total, COUNT(*) cnt FROM expenses WHERE user_id=? AND date>=?");
$s->execute([$uid, $weekStart]); $weekRow = $s->fetch();

// Month
$s = $db->prepare("SELECT COALESCE(SUM(amount),0) total, COUNT(*) cnt FROM expenses WHERE user_id=? AND strftime('%Y-%m', date)=?");
$s->execute([$uid, date('Y-m')]); $monthRow = $s->fetch();

// Recent 5 expenses
$s = $db->prepare("SELECT e.*, c.name category_name, c.color category_color FROM expenses e LEFT JOIN categories c ON e.category_id=c.id WHERE e.user_id=? ORDER BY e.date DESC, e.id DESC LIMIT 5");
$s->execute([$uid]); $recent = $s->fetchAll();

// Budgets with spending
$s = $db->prepare("
    SELECT b.*, c.name category_name, c.color category_color,
           COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.user_id=b.user_id AND e.category_id=b.category_id AND strftime('%Y-%m',e.date)=printf('%04d-%02d',b.year,b.month)),0) spent,
           b.amount budget_amount
    FROM budgets b JOIN categories c ON b.category_id=c.id
    WHERE b.user_id=? AND b.month=? AND b.year=?
");
$s->execute([$uid, $month, $year]); $budgets = $s->fetchAll();

echo json_encode([
    'today_total'  => $todayRow['total'],
    'today_count'  => (int)$todayRow['cnt'],
    'week_total'   => $weekRow['total'],
    'week_count'   => (int)$weekRow['cnt'],
    'month_total'  => $monthRow['total'],
    'month_count'  => (int)$monthRow['cnt'],
    'recent'       => $recent,
    'budgets'      => $budgets,
]);
