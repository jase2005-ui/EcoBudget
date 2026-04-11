import { Toaster } from "sonner";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';

import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Expenses from '@/pages/Expenses';
import AddExpense from '@/pages/AddExpense';
import Categories from '@/pages/Categories';
import Budgets from '@/pages/Budgets';
import Reports from '@/pages/Reports';
import MonthlySummary from '@/pages/MonthlySummary';
import AIAdvisor from '@/pages/AIAdvisor';
import RecurringExpenses from '@/pages/RecurringExpenses';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

import "@/App.css";

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClientInstance}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route path="/" element={<Dashboard />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/add-expense" element={<AddExpense />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/recurring" element={<RecurringExpenses />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/monthly-summary" element={<MonthlySummary />} />
                <Route path="/ai-advisor" element={<AIAdvisor />} />
              </Route>
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center p-6 bg-background">
                  <div className="max-w-md w-full text-center space-y-6">
                    <h1 className="text-7xl font-light text-muted-foreground/30">404</h1>
                    <h2 className="text-2xl font-medium">Page Not Found</h2>
                    <button onClick={() => window.location.href = '/'} className="inline-flex items-center px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors">
                      Go Home
                    </button>
                  </div>
                </div>
              } />
            </Routes>
          </Router>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
