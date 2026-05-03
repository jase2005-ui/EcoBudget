<?php
session_start();
require_once 'includes/auth_check.php';
pageAuthCheck();
$pageTitle = 'Monthly Summary'; $currentPage = 'monthly-summary';
require 'includes/page_head.php';
?>

<div class="page-header">
  <div class="page-header-left">
    <h1>Monthly Summary</h1>
    <p>End-of-month financial review</p>
  </div>
  <div class="page-header-right">
    <input type="month" class="month-selector" id="summary-month">
  </div>
</div>

<!-- Stats -->
<div class="summary-stats">
  <div class="summary-stat">
    <div class="summary-stat-label">Total Spent</div>
    <div class="summary-stat-value mono" id="sum-total">P 0.00</div>
  </div>
  <div class="summary-stat">
    <div class="summary-stat-label">Budget</div>
    <div class="summary-stat-value mono" id="sum-budget">P 0.00</div>
  </div>
  <div class="summary-stat">
    <div class="summary-stat-label">Remaining</div>
    <div class="summary-stat-value mono" id="sum-remaining">P 0.00</div>
  </div>
  <div class="summary-stat">
    <div class="summary-stat-label">Transactions</div>
    <div class="summary-stat-value" id="sum-count">0</div>
  </div>
</div>

<!-- Tabs -->
<div class="tabs">
  <button class="tab-btn active" data-tab="ai"><i data-lucide="sparkles"></i> AI Summary</button>
  <button class="tab-btn" data-tab="pie"><i data-lucide="pie-chart"></i> Pie Chart</button>
  <button class="tab-btn" data-tab="bar"><i data-lucide="bar-chart-2"></i> Bar Chart</button>
  <button class="tab-btn" data-tab="detailed"><i data-lucide="table-2"></i> Detailed</button>
</div>

<!-- AI Summary -->
<div class="tab-content active" id="tab-ai">
  <div class="ai-empty" id="ai-summary-empty">
    <div class="ai-empty-icon"><i data-lucide="sparkles"></i></div>
    <h3>AI-Powered Monthly Summary</h3>
    <p>Get personalised insights about your spending, budgeting, and tips for improvement</p>
    <button class="btn btn-primary" id="generate-summary-btn">
      <i data-lucide="sparkles"></i> Generate Summary
    </button>
  </div>
  <div id="ai-summary-content"></div>
</div>

<!-- Pie -->
<div class="tab-content" id="tab-pie">
  <div class="card card-p">
    <div class="section-title" style="margin-bottom:20px">Spending by Category</div>
    <div class="chart-wrap"><canvas id="sum-pie-chart"></canvas></div>
  </div>
</div>

<!-- Bar -->
<div class="tab-content" id="tab-bar">
  <div class="card card-p">
    <div class="section-title" style="margin-bottom:20px">Category Comparison</div>
    <canvas id="sum-bar-chart" height="80"></canvas>
  </div>
</div>

<!-- Detailed -->
<div class="tab-content" id="tab-detailed">
  <div class="card card-p">
    <div class="section-title" style="margin-bottom:16px">Category Breakdown</div>
    <table class="detail-table">
      <thead><tr><th>Category</th><th>Spent</th><th>Budget</th><th>Transactions</th></tr></thead>
      <tbody id="sum-detail-tbody">
        <tr><td colspan="4" style="text-align:center;padding:20px;color:var(--muted)">Loading…</td></tr>
      </tbody>
    </table>
  </div>
</div>

<?php require 'includes/page_foot.php'; ?>
