<?php
session_start();
require_once 'includes/auth_check.php';
pageAuthCheck();
$pageTitle = 'Budgets'; $currentPage = 'budgets';
require 'includes/page_head.php';
?>

<div class="page-header">
  <div class="page-header-left">
    <h1>Budgets</h1>
    <p>Spending limits per category</p>
  </div>
  <div class="page-header-right">
    <input type="month" class="month-selector" id="budget-month">
  </div>
</div>

<!-- Summary card -->
<div class="card card-p" style="margin-bottom:16px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
    <div>
      <div style="font-size:.82rem;color:var(--muted)">Total Budget</div>
      <div style="font-size:1.2rem;font-weight:700" id="total-budget">P 0.00</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:.82rem;color:var(--muted)">Total Spent</div>
      <div style="font-size:1.2rem;font-weight:700" id="total-spent">P 0.00</div>
    </div>
  </div>
  <div class="progress-bar" style="height:10px;margin-bottom:8px">
    <div class="progress-fill" id="budget-progress" style="width:0%;background:#16a34a"></div>
  </div>
  <div style="font-size:.8rem" id="budget-diff" class="text-muted"></div>
</div>

<!-- Set budget form -->
<div class="card card-p" style="margin-bottom:16px">
  <div class="card-title" style="margin-bottom:14px">Set Budget</div>
  <form id="set-budget-form">
    <div style="display:flex;gap:10px;align-items:flex-end">
      <div style="flex:1">
        <select class="form-control" id="budget-cat-sel">
          <option value="">Select category</option>
        </select>
      </div>
      <div style="width:160px">
        <div class="input-group">
          <span class="input-prefix">BWP</span>
          <input class="form-control" type="number" id="budget-amount-input" step="0.01" min="1" placeholder="Amount">
        </div>
      </div>
      <button type="submit" class="btn btn-primary"><i data-lucide="plus"></i> Set</button>
    </div>
  </form>
</div>

<!-- List -->
<div class="card card-p" id="budgets-wrap">
  <div id="budgets-list"><div class="loading-overlay"><div class="spinner"></div></div></div>
</div>

<?php require 'includes/page_foot.php'; ?>
