<?php
session_start();
require_once 'includes/auth_check.php';
pageAuthCheck();
$pageTitle = 'Categories'; $currentPage = 'categories';
require 'includes/page_head.php';
?>

<div class="page-header">
  <div class="page-header-left">
    <h1>Categories</h1>
    <p>Organise your expenses by type</p>
  </div>
</div>

<div style="max-width:600px">
  <!-- Add form -->
  <div class="card card-p" style="margin-bottom:16px">
    <div class="card-title" style="margin-bottom:16px">New Category</div>
    <form id="add-cat-form">
      <div class="form-group">
        <input class="form-control" type="text" id="cat-name" placeholder="Category name…" required>
      </div>
      <div class="form-group">
        <label class="form-label">Colour:</label>
        <div class="color-picker-row" id="color-picker"></div>
        <input type="hidden" id="cat-color" value="#16a34a">
      </div>
      <button type="submit" class="btn btn-primary"><i data-lucide="plus"></i> Add Category</button>
    </form>
  </div>

  <!-- List -->
  <div class="card" id="category-list">
    <div class="loading-overlay"><div class="spinner"></div></div>
  </div>
</div>

<?php require 'includes/page_foot.php'; ?>
