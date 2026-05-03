<?php
session_start();
require_once 'includes/auth_check.php';
pageAuthCheck();
$pageTitle = 'Add Expense'; $currentPage = 'add-expense';
require 'includes/page_head.php';
?>

<div class="page-header">
  <div class="page-header-left">
    <a href="expenses.php" class="btn btn-ghost btn-sm" style="margin-bottom:8px;padding-left:0"><i data-lucide="arrow-left"></i> Back</a>
    <h1>Add Expense</h1>
    <p>Record a new transaction</p>
  </div>
</div>

<div style="max-width:560px">
  <div class="card card-p">
    <div class="auth-error hidden" id="form-error"></div>

    <form id="add-expense-form">
      <div class="form-group">
        <label class="form-label" for="exp-amount">Amount</label>
        <div class="input-group">
          <span class="input-prefix">BWP</span>
          <input class="form-control" type="number" id="exp-amount" step="0.01" min="0.01" placeholder="0.00" required>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="exp-desc">Description</label>
        <input class="form-control" type="text" id="exp-desc" placeholder="e.g. Grocery shopping" required>
      </div>

      <div class="form-row">
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label" for="exp-category">Category</label>
          <select class="form-control" id="exp-category">
            <option value="">Pick one</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label" for="exp-date">Date</label>
          <input class="form-control" type="date" id="exp-date" required>
        </div>
      </div>

      <div class="form-group" style="margin-top:18px">
        <label class="form-label" for="exp-payment">Payment Method</label>
        <select class="form-control" id="exp-payment">
          <option value="cash">Cash</option>
          <option value="debit card">Debit Card</option>
          <option value="credit card">Credit Card</option>
          <option value="bank transfer">Bank Transfer</option>
          <option value="mobile money">Mobile Money</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="exp-notes">Notes <span class="optional">(optional)</span></label>
        <textarea class="form-control" id="exp-notes" placeholder="Additional details…" rows="3"></textarea>
      </div>

      <button type="submit" class="btn btn-primary" id="save-btn" style="width:100%">
        <i data-lucide="circle-check-big"></i> Save Expense
      </button>
    </form>
  </div>
</div>

<?php require 'includes/page_foot.php'; ?>
