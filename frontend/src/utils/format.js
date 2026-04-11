/**
 * Format a number as USD currency — always shows 2 decimal places, uses locale separators.
 * e.g. 1234.5 → "$1,234.50"
 */
export function formatMoney(amount = 0) {
  return new Intl.NumberFormat('en-BW', {
    style: 'currency',
    currency: 'BWP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format as compact money for tight spaces.
 * e.g. 1234.5 → "$1.2K"
 */
export function formatMoneyCompact(amount = 0) {
  if (Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat('en-BW', {
      style: 'currency',
      currency: 'BWP',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return formatMoney(amount);
}

/**
 * Category color map — consistent across all pages.
 */
export const CATEGORY_COLORS = {
  'Food & Dining':   { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', hex: '#059669' },
  'Transportation':  { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500',    hex: '#3b82f6' },
  'Entertainment':   { bg: 'bg-purple-100',  text: 'text-purple-700',  dot: 'bg-purple-500',  hex: '#8b5cf6' },
  'Shopping':        { bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-500',  hex: '#f97316' },
  'Utilities':       { bg: 'bg-cyan-100',    text: 'text-cyan-700',    dot: 'bg-cyan-500',    hex: '#06b6d4' },
  'Health':          { bg: 'bg-pink-100',    text: 'text-pink-700',    dot: 'bg-pink-500',    hex: '#ec4899' },
  'Housing':         { bg: 'bg-yellow-100',  text: 'text-yellow-700',  dot: 'bg-yellow-500',  hex: '#eab308' },
  'Education':       { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500',     hex: '#ef4444' },
};

export const CHART_COLORS = ['#059669','#3b82f6','#8b5cf6','#f97316','#06b6d4','#ec4899','#eab308','#ef4444'];

export function getCategoryStyle(category) {
  return CATEGORY_COLORS[category] || { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground', hex: '#6b7280' };
}