<?php
session_start();
require_once 'includes/auth_check.php';
pageAuthCheck();
$pageTitle = 'Expenses'; $currentPage = 'expenses';
require 'includes/page_head.php';
?>

<div class="page-header">
  <div class="page-header-left">
    <h1>Expenses</h1>
    <p id="exp-count" style="color:var(--muted);font-size:.9rem;margin-top:2px">Loading…</p>
  </div>
  <div class="page-header-right">
    <a href="add-expense.php" class="btn btn-primary"><i data-lucide="plus"></i> Add</a>
  </div>
</div>

<!-- Filters -->
<div class="filters-bar">
  <div class="search-input-wrap">
    <i data-lucide="search"></i>
    <input class="form-control" type="text" id="searchInput" placeholder="Search transactions…">
  </div>
  <select class="form-control filter-select" id="filterCategory">
    <option value="">All Categories</option>
  </select>
  <input class="form-control filter-select" type="month" id="filterMonth">
</div>

<!-- Total strip -->
<div style="font-size:.82rem;color:var(--muted);margin-bottom:12px;font-weight:500">
  Total: <span id="exp-total" style="color:var(--text);font-weight:700">P 0.00</span>
</div>

<div id="expenses-list"><div class="loading-overlay"><div class="spinner"></div></div></div>

<?php require 'includes/page_foot.php'; ?>
