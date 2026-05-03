<?php
// $currentPage must be set by the including file
$currentPage = $currentPage ?? '';
$userName  = $_SESSION['user_name']  ?? 'User';
$userEmail = $_SESSION['user_email'] ?? '';
$initial   = strtoupper(substr($userName, 0, 1));

$nav = [
    'main' => [
        ['page' => 'dashboard',    'label' => 'Dashboard',       'icon' => 'layout-dashboard'],
        ['page' => 'expenses',     'label' => 'Expenses',        'icon' => 'receipt'],
        ['page' => 'add-expense',  'label' => 'Add Expense',     'icon' => 'circle-plus'],
    ],
    'planning' => [
        ['page' => 'categories',   'label' => 'Categories',      'icon' => 'tag'],
        ['page' => 'budgets',      'label' => 'Budgets',         'icon' => 'wallet'],
        ['page' => 'recurring',    'label' => 'Recurring',       'icon' => 'refresh-cw'],
    ],
    'insights' => [
        ['page' => 'reports',          'label' => 'Reports',         'icon' => 'bar-chart-2'],
        ['page' => 'monthly-summary',  'label' => 'Monthly Summary', 'icon' => 'calendar'],
        ['page' => 'ai-advisor',       'label' => 'AI Advisor',      'icon' => 'sparkles'],
    ],
];
?>
<aside class="sidebar" id="sidebar">
  <div class="sidebar-header">
    <div class="brand">
      <div class="brand-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div class="brand-text">
        <span class="brand-name">EcoBudget</span>
        <span class="brand-sub">Personal Finance</span>
      </div>
    </div>
  </div>

  <nav class="sidebar-nav">
    <?php foreach ($nav as $section => $items): ?>
    <div class="nav-section">
      <span class="nav-section-label"><?= strtoupper($section) ?></span>
      <?php foreach ($items as $item): ?>
        <?php $isActive = $currentPage === $item['page']; ?>
        <a href="<?= $item['page'] ?>.php" class="nav-item <?= $isActive ? 'active' : '' ?>">
          <i data-lucide="<?= $item['icon'] ?>"></i>
          <span><?= $item['label'] ?></span>
        </a>
      <?php endforeach; ?>
    </div>
    <?php endforeach; ?>
  </nav>

  <div class="sidebar-footer">
    <div class="user-info">
      <div class="user-avatar"><?= htmlspecialchars($initial) ?></div>
      <div class="user-details">
        <span class="user-name"><?= htmlspecialchars($userName) ?></span>
        <span class="user-email"><?= htmlspecialchars($userEmail) ?></span>
      </div>
    </div>
    <button class="sidebar-action" id="themeToggle" title="Toggle theme">
      <i data-lucide="moon" id="themeIcon"></i>
      <span id="themeLabel">Dark mode</span>
    </button>
    <a href="api/logout.php" class="sidebar-action">
      <i data-lucide="log-out"></i>
      <span>Sign out</span>
    </a>
    <button class="sidebar-action collapse-btn" id="collapseBtn">
      <i data-lucide="chevron-left" id="collapseIcon"></i>
      <span class="collapse-label">Collapse</span>
    </button>
  </div>
</aside>
