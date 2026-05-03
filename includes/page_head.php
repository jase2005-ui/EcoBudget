<?php
// Usage: require page_head.php after setting $pageTitle and $currentPage
$pageTitle   = $pageTitle   ?? 'EcoBudget';
$currentPage = $currentPage ?? '';
$theme = $_COOKIE['theme'] ?? 'light';
?><!DOCTYPE html>
<html lang="en" data-theme="<?= $theme ?>">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= htmlspecialchars($pageTitle) ?> — EcoBudget</title>
<link rel="stylesheet" href="assets/css/style.css">
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body data-page="<?= $currentPage ?>">
<?php require 'includes/sidebar.php'; ?>
<main class="main-content">
