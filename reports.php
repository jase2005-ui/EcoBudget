<?php
session_start();
require_once 'includes/auth_check.php';
pageAuthCheck();
$pageTitle = 'Reports'; $currentPage = 'reports';
require 'includes/page_head.php';
?>

<div class="page-header">
  <div class="page-header-left">
    <h1>Reports</h1>
    <p>Visualise your spending patterns</p>
  </div>
  <div class="page-header-right">
    <input type="month" class="month-selector" id="report-month">
  </div>
</div>

<!-- Total -->
<div style="margin-bottom:20px">
  <div class="reports-total-label">Total Spending</div>
  <div class="reports-total" id="report-total">P 0.00</div>
  <div class="reports-sub" id="report-sub">Loading…</div>
</div>

<!-- Tabs -->
<div class="tabs">
  <button class="tab-btn active" data-tab="category"><i data-lucide="pie-chart"></i> By Category</button>
  <button class="tab-btn" data-tab="trend"><i data-lucide="bar-chart-2"></i> 6-Month Trend</button>
  <button class="tab-btn" data-tab="payment"><i data-lucide="credit-card"></i> By Payment</button>
  <button class="tab-btn" data-tab="detail"><i data-lucide="table-2"></i> Detailed</button>
</div>

<!-- By Category -->
<div class="tab-content active" id="tab-category">
  <div class="card card-p">
    <div class="section-title" style="margin-bottom:20px">Spending by Category</div>
    <div id="cat-chart-wrap" class="chart-wrap"><canvas id="cat-chart"></canvas></div>
    <div class="chart-legend" id="cat-legend"></div>
  </div>
</div>

<!-- Trend -->
<div class="tab-content" id="tab-trend">
  <div class="card card-p">
    <div class="section-title" style="margin-bottom:20px">6-Month Spending Trend</div>
    <canvas id="trend-chart" height="80"></canvas>
  </div>
</div>

<!-- By Payment -->
<div class="tab-content" id="tab-payment">
  <div class="card card-p">
    <div class="section-title" style="margin-bottom:20px">Spending by Payment Method</div>
    <div class="chart-wrap"><canvas id="pay-chart"></canvas></div>
  </div>
</div>

<!-- Detailed Table -->
<div class="tab-content" id="tab-detail">
  <div class="card card-p">
    <div class="section-title" style="margin-bottom:16px">Category Breakdown</div>
    <table class="detail-table">
      <thead>
        <tr><th>Category</th><th>Amount</th><th>Transactions</th></tr>
      </thead>
      <tbody id="detail-tbody">
        <tr><td colspan="3" style="text-align:center;padding:20px;color:var(--muted)">Loading…</td></tr>
      </tbody>
    </table>
  </div>
</div>

<?php require 'includes/page_foot.php'; ?>
