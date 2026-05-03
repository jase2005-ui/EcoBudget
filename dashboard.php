<?php
session_start();
require_once 'includes/auth_check.php';
pageAuthCheck();
$pageTitle = 'Dashboard'; $currentPage = 'dashboard';
require 'includes/page_head.php';
?>

<div class="page-header">
  <div class="page-header-left">
    <div class="page-date" id="dash-date"></div>
    <h1>Overview</h1>
  </div>
  <div class="page-header-right">
    <a href="add-expense.php" class="btn btn-primary"><i data-lucide="plus"></i> Add Expense</a>
  </div>
</div>

<!-- Hero -->
<div class="hero-card">
  <div class="hero-label" id="hero-month">THIS MONTH</div>
  <div class="hero-amount" id="hero-amount">P 0.00</div>
  <div class="hero-sub">total spent this month</div>
</div>

<!-- Stats -->
<div class="stats-grid" style="margin-bottom:20px">
  <div class="card stat-card">
    <div class="stat-label">Today</div>
    <div class="stat-value" id="stat-today">P 0.00</div>
    <div class="stat-sub" id="stat-today-count">0 transactions</div>
  </div>
  <div class="card stat-card">
    <div class="stat-label">This Week</div>
    <div class="stat-value" id="stat-week">P 0.00</div>
    <div class="stat-sub" id="stat-week-count">0 transactions</div>
  </div>
  <div class="card stat-card">
    <div class="stat-label">This Month</div>
    <div class="stat-value" id="stat-month">P 0.00</div>
    <div class="stat-sub" id="stat-month-count">0 transactions</div>
  </div>
</div>

<!-- Recent + Budget -->
<div class="two-col" style="margin-bottom:16px">
  <div class="card card-p">
    <div class="section-header">
      <div>
        <div class="section-title">Recent Transactions</div>
        <div class="section-sub" id="recent-count">Last 5 entries</div>
      </div>
      <a href="expenses.php" class="section-link">View all →</a>
    </div>
    <div id="recent-list"><div class="loading-overlay"><div class="spinner"></div></div></div>
  </div>
  <div class="card card-p">
    <div class="section-header">
      <div>
        <div class="section-title">Budget Status</div>
        <div class="section-sub">0 categories</div>
      </div>
      <a href="budgets.php" class="section-link">Manage →</a>
    </div>
    <div id="budget-list"><div class="loading-overlay"><div class="spinner"></div></div></div>
  </div>
</div>

<!-- Quick Actions -->
<div class="quick-cards">
  <a href="monthly-summary.php" class="quick-card">
    <div class="quick-card-icon"><i data-lucide="calendar"></i></div>
    <div class="quick-card-text"><h4>Monthly Summary</h4><p>AI-powered review</p></div>
    <div class="quick-card-arrow"><i data-lucide="chevron-right"></i></div>
  </a>
  <a href="ai-advisor.php" class="quick-card">
    <div class="quick-card-icon"><i data-lucide="sparkles"></i></div>
    <div class="quick-card-text"><h4>AI Advisor</h4><p>Saving &amp; Investing tips</p></div>
    <div class="quick-card-arrow"><i data-lucide="chevron-right"></i></div>
  </a>
</div>

<?php require 'includes/page_foot.php'; ?>
