<?php
session_start();
require_once '../config/database.php';
require_once '../includes/auth_check.php';
apiAuthCheck();
header('Content-Type: application/json');

$db    = getDB();
$uid   = $_SESSION['user_id'];
$month = intval($_GET['month'] ?? date('n'));
$year  = intval($_GET['year']  ?? date('Y'));
$ym    = sprintf('%04d-%02d', $year, $month);

// Total & count
$s = $db->prepare("SELECT COALESCE(SUM(amount),0) total, COUNT(*) cnt FROM expenses WHERE user_id=? AND strftime('%Y-%m',date)=?");
$s->execute([$uid, $ym]); $totRow = $s->fetch();

// By category
$s = $db->prepare("
    SELECT c.id category_id, COALESCE(c.name,'Uncategorized') category_name, COALESCE(c.color,'#9ca3af') color,
           SUM(e.amount) total, COUNT(*) count
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.user_id=? AND strftime('%Y-%m',e.date)=?
    GROUP BY c.id
    ORDER BY total DESC
");
$s->execute([$uid, $ym]); $byCategory = $s->fetchAll();

// 6-month trend
$trend = [];
for ($i = 5; $i >= 0; $i--) {
    $ts   = mktime(0,0,0, $month - $i, 1, $year);
    $ymT  = date('Y-m', $ts);
    $lbl  = date('M', $ts);
    $s    = $db->prepare("SELECT COALESCE(SUM(amount),0) total FROM expenses WHERE user_id=? AND strftime('%Y-%m',date)=?");
    $s->execute([$uid, $ymT]); $r = $s->fetch();
    $trend[] = ['label'=>$lbl, 'total'=>floatval($r['total'])];
}

// By payment method
$s = $db->prepare("
    SELECT payment_method method, SUM(amount) total, COUNT(*) cnt
    FROM expenses WHERE user_id=? AND strftime('%Y-%m',date)=?
    GROUP BY payment_method ORDER BY total DESC
");
$s->execute([$uid, $ym]); $byPayment = $s->fetchAll();

// Total budget for the month
$s = $db->prepare("SELECT COALESCE(SUM(amount),0) total FROM budgets WHERE user_id=? AND month=? AND year=?");
$s->execute([$uid, $month, $year]); $budRow = $s->fetch();

// Budgets detail (for monthly summary page)
$s = $db->prepare("SELECT * FROM budgets WHERE user_id=? AND month=? AND year=?");
$s->execute([$uid, $month, $year]); $budgets = $s->fetchAll();

echo json_encode([
    'total'        => floatval($totRow['total']),
    'count'        => intval($totRow['cnt']),
    'total_budget' => floatval($budRow['total']),
    'by_category'  => $byCategory,
    'trend'        => $trend,
    'by_payment'   => $byPayment,
    'budgets'      => $budgets,
]);
