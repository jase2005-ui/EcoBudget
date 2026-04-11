import React, { useState, useRef, useEffect } from 'react';
import { expensesApi, budgetsApi, aiApi } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, Send, TrendingUp, PiggyBank, HelpCircle, Trash2, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { formatMoney } from '@/utils/format';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const quickPrompts = [
  { icon: PiggyBank,    label: 'Saving tips',      prompt: 'Based on my spending data, give me 5 practical tips to save more money this month.' },
  { icon: TrendingUp,   label: 'Investment basics', prompt: 'Explain the basics of investing for beginners in Botswana, including how to start with a small budget in BWP.' },
  { icon: HelpCircle,   label: 'Budget advice',    prompt: 'Review my budget allocation and suggest how I can better distribute my money across categories for a healthier financial life.' },
  { icon: AlertTriangle,label: 'Over budget?',     prompt: 'Am I currently over budget in any category? What should I cut back on?' },
];

export default function AIAdvisor() {
  const [question, setQuestion]     = useState('');
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading]   = useState(false);
  const bottomRef = useRef(null);
  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthStart   = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd     = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.list(100),
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets-all'],
    queryFn: () => budgetsApi.list(),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isLoading]);

  const buildContext = () => {
    const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const monthlyExpenses = expenses.filter(e => e.date >= monthStart && e.date <= monthEnd);
    const monthlyTotal = monthlyExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalBudget = budgets.filter(b => b.month === currentMonth).reduce((s, b) => s + (b.amount || 0), 0);

    const topCategories = Object.entries(
      monthlyExpenses.reduce((acc, e) => {
        acc[e.category || 'Other'] = (acc[e.category || 'Other'] || 0) + (e.amount || 0);
        return acc;
      }, {})
    ).sort(([, a], [, b]) => b - a).slice(0, 5);

    const overBudget = budgets
      .filter(b => b.month === currentMonth)
      .map(b => {
        const spent = monthlyExpenses.filter(e => e.category === b.category).reduce((s, e) => s + (e.amount || 0), 0);
        return { category: b.category, budget: b.amount, spent, over: spent > b.amount };
      })
      .filter(b => b.over);

    return `User's financial context (currency: BWP - Botswana Pula):
- This month's spending: ${formatMoney(monthlyTotal)} of ${formatMoney(totalBudget)} budget (${monthlyExpenses.length} transactions)
- Top spending categories this month: ${topCategories.map(([c, v]) => `${c}: ${formatMoney(v)}`).join(', ') || 'None'}
- Over-budget categories: ${overBudget.map(b => `${b.category} (spent ${formatMoney(b.spent)} vs ${formatMoney(b.budget)} budget)`).join(', ') || 'None'}
- All-time total tracked: ${formatMoney(totalSpent)} across ${expenses.length} transactions`;
  };

  const askQuestion = async (q) => {
    const userQ = q || question;
    if (!userQ.trim() || isLoading) return;

    setConversation(prev => [...prev, { role: 'user', content: userQ }]);
    setQuestion('');
    setIsLoading(true);

    try {
      const prompt = `You are a friendly, knowledgeable personal finance AI advisor helping users in Botswana manage their finances in Botswana Pula (BWP).

${buildContext()}

Previous conversation:
${conversation.map(m => `${m.role}: ${m.content}`).join('\n')}

User's question: ${userQ}

Provide a helpful, clear, and actionable response. Always use BWP for any monetary amounts. Use simple language. Use markdown formatting for readability.`;

      const result = await aiApi.invokeLLM(prompt);
      setConversation(prev => [...prev, { role: 'assistant', content: result }]);
    } catch (err) {
      setConversation(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  const clearChat = () => setConversation([]);

  return (
    <div data-testid="ai-advisor-page" className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 120px)', minHeight: 500 }}>
      <div className="flex items-start justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">AI Financial Advisor</h1>
          <p className="text-muted-foreground text-sm mt-1">Personalised saving, budgeting & investing advice</p>
        </div>
        {conversation.length > 0 && (
          <Button data-testid="clear-chat-btn" variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground hover:text-destructive rounded-xl gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl border border-border bg-card min-h-0">
        {conversation.length === 0 ? (
          <div className="p-6 space-y-4">
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-semibold text-lg">How can I help you today?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ask me anything about saving, investing, or managing your money in BWP
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {quickPrompts.map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  data-testid={`quick-prompt-${label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => askQuestion(prompt)}
                  className="flex items-start gap-3 bg-background border border-border rounded-xl p-4 text-left hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            <AnimatePresence initial={false}>
              {conversation.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 md:p-5 ${msg.role === 'user' ? 'bg-muted/30' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                    }`}>
                      {msg.role === 'user' ? 'You' : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {msg.role === 'user' ? (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      ) : (
                        <div className="prose prose-sm prose-emerald max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <div className="p-4 md:p-5 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">AI is thinking</span>
                  <span className="flex gap-0.5">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="flex gap-2.5 mt-3 flex-shrink-0">
        <Textarea
          data-testid="ai-question-input"
          placeholder="Ask about investing, saving, budgeting in BWP..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          className="rounded-xl resize-none min-h-[44px] max-h-32 text-sm flex-1"
          rows={1}
        />
        <Button
          data-testid="ai-send-btn"
          onClick={() => askQuestion()}
          disabled={isLoading || !question.trim()}
          className="rounded-xl px-4 h-11 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
