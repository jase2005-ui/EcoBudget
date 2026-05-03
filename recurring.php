<?php
session_start();
require_once 'includes/auth_check.php';
pageAuthCheck();
$pageTitle = 'Recurring'; $currentPage = 'recurring';
require 'includes/page_head.php';
?>

<div class="page-header">
  <div class="page-header-left">
    <h1>Recurring Expenses</h1>
    <p id="rec-header-summary">Loading…</p>
  </div>
  <div class="page-header-right">
    <button class="btn btn-secondary" id="generate-btn"><i data-lucide="refresh-cw"></i> Generate</button>
    <button class="btn btn-primary" id="show-add-btn"><i data-lucide="plus"></i> Add</button>
  </div>
</div>

<!-- Summary stats -->
<div class="stats-grid" style="margin-bottom:16px">
  <div class="card stat-card">
    <div class="stat-label">Total</div>
    <div class="stat-value" id="rec-total">0</div>
  </div>
  <div class="card stat-card">
    <div class="stat-label">Active</div>
    <div class="stat-value" id="rec-active">0</div>
  </div>
  <div class="card stat-card">
    <div class="stat-label">Monthly Cost</div>
    <div class="stat-value" id="rec-monthly">P 0.00</div>
  </div>
</div>

<!-- Add form (hidden by default) -->
<div class="card card-p" id="add-rec-wrap" style="margin-bottom:16px;display:none">
  <div class="card-title" style="margin-bottom:16px">New Recurring Expense</div>
  <form id="add-rec-form">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Description</label>
        <input class="form-control" type="text" id="rec-desc" placeholder="e.g. Netflix" required>
      </div>
      <div class="form-group">
        <label class="form-label">Amount (BWP)</label>
        <div class="input-group">
          <span class="input-prefix">BWP</span>
          <input class="form-control" type="number" id="rec-amount" step="0.01" min="0.01" placeholder="0.00" required>
        </div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-control" id="rec-category">
          <option value="">No category</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Day of month</label>
        <input class="form-control" type="number" id="rec-day" min="1" max="28" value="1">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Payment Method</label>
      <select class="form-control" id="rec-payment">
        <option value="bank transfer">Bank Transfer</option>
        <option value="debit card">Debit Card</option>
        <option value="cash">Cash</option>
        <option value="mobile money">Mobile Money</option>
      </select>
    </div>
    <div style="display:flex;gap:8px">
      <button type="submit" class="btn btn-primary"><i data-lucide="plus"></i> Add Recurring</button>
      <button type="button" class="btn btn-secondary" id="cancel-add-btn">Cancel</button>
    </div>
  </form>
</div>

<!-- List -->
<div class="card" id="recurring-list">
  <div class="loading-overlay"><div class="spinner"></div></div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const showBtn   = document.getElementById('show-add-btn');
  const cancelBtn = document.getElementById('cancel-add-btn');
  const wrap      = document.getElementById('add-rec-wrap');
  showBtn?.addEventListener('click',   () => { wrap.style.display = 'block'; });
  cancelBtn?.addEventListener('click', () => { wrap.style.display = 'none';  });
});
</script>
<?php require 'includes/page_foot.php'; ?>
