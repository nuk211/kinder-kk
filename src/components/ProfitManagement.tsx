// components/ProfitManagement.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Clock } from 'lucide-react';

const profitTranslations = {
  en: {
    profitManagement: "Profit Management",
    totalIncome: "Total Income",
    totalExpenses: "Total Expenses",
    netProfit: "Net Profit",
    addNewExpense: "Add New Expense",
    amount: "Amount",
    description: "Description",
    addExpense: "Add Expense",
    resetExpenses: "Reset All Expenses",
    confirmReset: "Are you sure you want to delete all expenses?",
    errorOccurred: "An error occurred",
    expensesList: "Expenses List",
    noExpenses: "No expenses recorded",
    confirmDeleteExpense: "Are you sure you want to delete this expense?",
    deleteExpense: "Delete expense",
    totalRemaining: "Total Remaining Installments",
    expenseDate: "Date",
    expenseAmount: "Amount",
    expenseDescription: "Description",
    recentExpenses: "Recent Expenses",
    loading: "Loading...",
    currency: "IQD" // Iraqi Dinar
  },
  ar: {
    profitManagement: "إدارة الأرباح",
    totalIncome: "إجمالي الدخل",
    totalExpenses: "إجمالي المصروفات",
    netProfit: "صافي الربح",
    addNewExpense: "إضافة مصروف جديد",
    amount: "المبلغ",
    description: "الوصف",
    addExpense: "إضافة مصروف",
    confirmDeleteExpense: "هل أنت متأكد من حذف هذا المصروف؟",
    deleteExpense: "حذف المصروف",
    resetExpenses: "حذف جميع المصروفات",
    confirmReset: "هل أنت متأكد من حذف جميع المصروفات؟",
    expensesList: "قائمة المصروفات",
    noExpenses: "لا توجد مصروفات مسجلة",
    expenseDate: "التاريخ",
    expenseAmount: "المبلغ",
    expenseDescription: "الوصف",
    totalRemaining: "اجمالي الاقساط غير المدفوعة",
    recentExpenses: "المصروفات الأخيرة",
    errorOccurred: "حدث خطأ",
    loading: "جاري التحميل...",
    currency: "د.ع" // Iraqi Dinar in Arabic
  }
};

interface ProfitManagementProps {
  language: 'en' | 'ar';
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface ProfitData {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalRemaining: number; // Add this line
  expenses: Expense[];
}

const ProfitManagement: React.FC<ProfitManagementProps> = ({ language }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profitData, setProfitData] = useState<ProfitData>({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    expenses: []
  });
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: ''
  });

  const t = profitTranslations[language];

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-IQ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchProfitData = async () => {
    try {
      const response = await fetch('/api/admin/profit');
      const data = await response.json();
      if (response.ok) {
        setProfitData(data);
      } else {
        setError(data.error || t.errorOccurred);
      }
    } catch (err) {
      setError(t.errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm(language === 'en' ? 'Are you sure you want to delete this expense?' : 'هل أنت متأكد من حذف هذا المصروف؟')) {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/profit/${expenseId}`, {
          method: 'DELETE',
        });
  
        if (response.ok) {
          await fetchProfitData(); // Refresh the data
        } else {
          const data = await response.json();
          setError(data.error || t.errorOccurred);
        }
      } catch (err) {
        setError(t.errorOccurred);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProfitData();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/admin/profit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExpense),
      });

      if (response.ok) {
        setNewExpense({ amount: '', description: '' });
        await fetchProfitData();
      } else {
        const data = await response.json();
        setError(data.error || t.errorOccurred);
      }
    } catch (err) {
      setError(t.errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  const handleResetExpenses = async () => {
    if (window.confirm(t.confirmReset)) {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/profit', {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchProfitData();
        } else {
          const data = await response.json();
          setError(data.error || t.errorOccurred);
        }
      } catch (err) {
        setError(t.errorOccurred);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border-2 border-pink-200 transform transition-all duration-200 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-gray-700">{t.totalIncome}</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(profitData.totalIncome)} {t.currency}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border-2 border-pink-200 transform transition-all duration-200 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-gray-700">{t.totalExpenses}</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(profitData.totalExpenses)} {t.currency}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border-2 border-pink-200 transform transition-all duration-200 hover:scale-105">
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-lg font-medium text-gray-700">{t.totalRemaining}</CardTitle>
    <Clock className="h-5 w-5 text-orange-500" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-orange-600">
      {formatCurrency(profitData.totalRemaining)} {t.currency}
    </div>
  </CardContent>
</Card>

        <Card className="bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border-2 border-pink-200 transform transition-all duration-200 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-gray-700">{t.netProfit}</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(profitData.netProfit)} {t.currency}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border-2 border-pink-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-medium text-gray-700">{t.addNewExpense}</CardTitle>
            <Button
              onClick={handleResetExpenses}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-4 py-2 transform transition-all duration-200 hover:scale-105 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t.resetExpenses}
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Input
                  type="number"
                  placeholder={t.amount}
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  step="0.01"
                  min="0"
                  required
                  className="bg-white/50 border-2 border-pink-200 focus:border-pink-500 rounded-lg"
                />
                <Input
                  type="text"
                  placeholder={t.description}
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  required
                  className="bg-white/50 border-2 border-pink-200 focus:border-pink-500 rounded-lg"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-xl px-6 py-3 transform transition-all duration-200 hover:scale-105 flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {t.addExpense}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Expenses List Card */}
        <Card className="bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border-2 border-pink-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-medium text-gray-700">
              {t.recentExpenses}
            </CardTitle>
            <Clock className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {profitData.expenses.length === 0 ? (
                <p className="text-gray-500 text-center py-4">{t.noExpenses}</p>
              ) : (
                profitData.expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="bg-white/50 p-4 rounded-lg border-2 border-pink-100 hover:border-pink-300 transition-all duration-200"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{expense.description}</p>
                        <p className="text-sm text-gray-500">{formatDate(expense.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
        <p className="font-bold text-red-600">
          {formatCurrency(expense.amount)} {t.currency}
        </p>
        <Button
          onClick={() => handleDeleteExpense(expense.id)}
          size="sm"
          variant="ghost"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-2 border-red-200 rounded-xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ProfitManagement;