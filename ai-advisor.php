<?php
session_start();
require_once 'includes/auth_check.php';
pageAuthCheck();
$pageTitle = 'AI Advisor'; $currentPage = 'ai-advisor';
require 'includes/page_head.php';
?>

<style>
@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }
</style>

<div class="page-header">
  <div class="page-header-left">
    <h1>AI Financial Advisor</h1>
    <p>Personalised saving, budgeting &amp; investing advice</p>
  </div>
</div>

<div class="ai-container">

  <!-- Empty / welcome state -->
  <div id="ai-empty" class="ai-empty">
    <div class="ai-empty-icon"><i data-lucide="sparkles"></i></div>
    <h3>How can I help you today?</h3>
    <p>Ask me anything about saving, investing, or managing your money in BWP</p>

    <div class="suggested-prompts">
      <button class="prompt-card" data-prompt="Based on my spending data, give me 5 practical tips to save more money this month.">
        <div class="prompt-icon"><i data-lucide="piggy-bank"></i></div>
        <div class="prompt-title">Saving tips</div>
        <div class="prompt-desc">Based on my spending data, give me 5 practical tips to save more money this month.</div>
      </button>
      <button class="prompt-card" data-prompt="Explain the basics of investing for beginners in Botswana, including how to start with a small amount.">
        <div class="prompt-icon"><i data-lucide="trending-up"></i></div>
        <div class="prompt-title">Investment basics</div>
        <div class="prompt-desc">Explain the basics of investing for beginners in Botswana, including how to start with a small...</div>
      </button>
      <button class="prompt-card" data-prompt="Review my budget allocation and suggest how I can better distribute my money across categories.">
        <div class="prompt-icon"><i data-lucide="target"></i></div>
        <div class="prompt-title">Budget advice</div>
        <div class="prompt-desc">Review my budget allocation and suggest how I can better distribute my money across...</div>
      </button>
      <button class="prompt-card" data-prompt="Am I currently over budget in any category? What should I cut back on?">
        <div class="prompt-icon"><i data-lucide="triangle-alert"></i></div>
        <div class="prompt-title">Over budget?</div>
        <div class="prompt-desc">Am I currently over budget in any category? What should I cut back on?</div>
      </button>
    </div>
  </div>

  <!-- Chat history -->
  <div id="chat-messages" class="chat-messages hidden"></div>

  <!-- Input -->
  <div class="chat-input-bar">
    <textarea id="chat-input" placeholder="Ask about investing, saving, budgeting in BWP…" rows="1"></textarea>
    <button class="chat-send-btn" id="chat-send" title="Send">
      <i data-lucide="send"></i>
    </button>
  </div>
</div>

<?php require 'includes/page_foot.php'; ?>
