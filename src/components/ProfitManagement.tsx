// components/ProfitManagement.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MonthlyReport from './MonthlyReport';
import { 
  Loader2, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Clock,
  Lock,
  FileText,
  Eye,
  EyeOff 
} from 'lucide-react';

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
    expenseType: "Expense Type",
    monthlyReport: "Monthly Financial Report",
    showReport: "Show Report",
    hideReport: "Hide Report",
    generalExpense: "General Expense",
    foodExpense: "Food Expense",
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
    expenseType: "نوع المصروف",
    monthlyReport: "التقرير المالي الشهري",
    showReport: "عرض التقرير",
    hideReport: "إخفاء التقرير",
    generalExpense: "مصروف عام",
    foodExpense: "مصروف غذائي",
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


enum ExpenseType {
  GENERAL = 'GENERAL',
  FOOD = 'FOOD'
}

// Update the Expense interface
interface Expense {
  id: string;
  amount: number;
  description: string;
  type: ExpenseType;  // Add this line
  createdAt: string;
}

interface ProfitManagementProps {
  language: 'en' | 'ar';
}


interface ProfitData {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalRemaining: number;
  expenses: Array<{
    id: string;
    amount: number;
    description: string;
    type: 'FOOD' | 'GENERAL';
    createdAt: string;
  }>;
  payments: Array<{
    id: string;
    childId: string;
    childName: string;
    amount: number;
    paymentDate: string;
    registrationType: 'DAILY' | 'MONTHLY' | 'YEARLY';
  }>;
  installments: Array<{
    id: string;
    childId: string;
    childName: string;
    amount: number;
    paidAmount: number;
    dueDate: string;
    status: 'PAID' | 'PENDING' | 'OVERDUE';
    registrationType: string;
  }>;
  children: Array<{
    registrationType: string;
    paidAmount: number;
  }>;
}



const protectionTranslations = {
  en: {
    protectedPage: "Protected Page",
    enterPassword: "Enter password to access this page",
    password: "Password",
    unlockPage: "Unlock Page",
    lockPage: "Lock Page",
  },
  ar: {
    protectedPage: "صفحة محمية",
    enterPassword: "أدخل كلمة المرور للوصول إلى هذه الصفحة",
    password: "كلمة المرور",
    unlockPage: "فتح الصفحة",
    lockPage: "قفل الصفحة",
  }
};

const ProfitManagement: React.FC<ProfitManagementProps> = ({ language }) => {
  // Existing states
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [profitData, setProfitData] = useState<ProfitData>({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalRemaining: 0,
    expenses: [],
    payments: [],
    installments: [], // Initialize empty installments array
    children: []
  });
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    type: ExpenseType.GENERAL  // Add default type
  });



  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [protectionError, setProtectionError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const t = profitTranslations[language];
  const pt = protectionTranslations[language];

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
        // Transform the data to include payments
        setProfitData({
          ...data,
          payments: data.children?.map((child: any) => ({
            id: child.id,
            childId: child.id,
            childName: child.name,
            amount: child.paidAmount,
            paymentDate: child.createdAt,
            registrationType: child.registrationType
          })) || [],
          children: data.children || []
        });
      } else {
        setError(t.errorOccurred);
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
    const checkLockStatus = async () => {
      try {
        // Check localStorage first
        const storedLockState = localStorage.getItem('pageLockState');
        if (storedLockState) {
          const { page, isLocked } = JSON.parse(storedLockState);
          // Only unlock if explicitly set to unlocked in localStorage
          if ((page === 'payments' || page === 'profit') && !isLocked) { 
            setIsLocked(false);
            if (!isLocked) {
              fetchProfitData(); // or fetchProfitData() for profit page
            }
            return;
          }
        }
  
        // Default to locked if no valid localStorage state
        setIsLocked(true);
        
      } catch (error) {
        console.error('Failed to check lock status:', error);
        // If any error occurs, default to locked state
        setIsLocked(true);
      }
    };
  
    checkLockStatus();
  }, []);


  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/protection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'profit', password }), // use 'profit' for ProfitManagement
      });
  
      if (!res.ok) {
        const data = await res.json();
        setProtectionError(data.error || (language === 'en' ? 'Failed to unlock page' : 'فشل في فتح الصفحة'));
        return;
      }
  
      setIsLocked(false);
      // Store the unlocked state
      localStorage.setItem('pageLockState', JSON.stringify({ 
        page: 'profit', // use 'profit' for ProfitManagement
        isLocked: false 
      }));
      setPassword('');
      setProtectionError('');
      fetchProfitData(); // use fetchProfitData() for ProfitManagement
    } catch (error) {
      setProtectionError(language === 'en' ? 'Failed to unlock page' : 'فشل في فتح الصفحة');
    }
  };

  const handleLock = async () => {
    try {
      await fetch('/api/admin/protection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'profit' }), // use 'profit' for ProfitManagement
      });
      setIsLocked(true);
      // Remove the stored state when locking
      localStorage.removeItem('pageLockState');
    } catch (error) {
      console.error('Failed to lock page:', error);
    }
  };


  if (isLocked) {
    return (
      <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {t.profitManagement}
          </h2>
        </div>

        <Card className="max-w-md mx-auto bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border-2 border-pink-200">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-6">
              <div className="p-3 bg-pink-50 rounded-full">
                <Lock className="w-12 h-12 text-pink-500" />
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  {pt.protectedPage}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {pt.enterPassword}
                </p>
              </div>

              <form onSubmit={handleUnlock} className="w-full space-y-4">
                {protectionError && (
                  <Alert variant="destructive" className="bg-red-50 border-2 border-red-200 rounded-xl">
                    <AlertDescription>{protectionError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {pt.password}
                  </label>
                  <div className="relative">
  <Input
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="pr-10 bg-white/50 border-2 border-pink-200 focus:border-pink-500 rounded-lg"
    required
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 transition-colors"
  >
    {showPassword ? (
      <EyeOff className="h-4 w-4 text-gray-500" />
    ) : (
      <Eye className="h-4 w-4 text-gray-500" />
    )}
  </button>
</div>
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl px-6 py-3 transform transition-all duration-200 hover:scale-105"
                  disabled={!password}
                >
                  {pt.unlockPage}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Create a properly typed expense object
      const expenseData = {
        amount: Number(newExpense.amount),
        description: newExpense.description,
        type: newExpense.type as ExpenseType // Ensure type is properly cast
      };
  
      const response = await fetch('/api/admin/profit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });
  
      if (response.ok) {
        setNewExpense({ 
          amount: '', 
          description: '', 
          type: ExpenseType.GENERAL
        });
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          {t.profitManagement}
        </h2>
        <Button
          onClick={handleLock}
          size="sm"
          className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl px-4 py-2 transform transition-all duration-200 hover:scale-105 flex items-center gap-2"
        >
          <Lock className="h-4 w-4" />
          {pt.lockPage}
        </Button>
      </div>
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
    <select
      value={newExpense.type}
      onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value as ExpenseType })}
      required
      className="w-full p-2 bg-white/50 border-2 border-pink-200 focus:border-pink-500 rounded-lg"
    >
      <option value={ExpenseType.GENERAL}>{t.generalExpense}</option>
      <option value={ExpenseType.FOOD}>{t.foodExpense}</option>
    </select>
  </div>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl px-6 py-3 transform transition-all duration-200 hover:scale-105 flex items-center gap-2"
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
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    expense.type === ExpenseType.FOOD 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {expense.type === ExpenseType.FOOD ? t.foodExpense : t.generalExpense}
                  </span>
                  <p className="text-sm text-gray-500">{formatDate(expense.createdAt)}</p>
                </div>
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

      {/* Add Monthly Report Card here */}
      <Card className="bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border-2 border-pink-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-medium text-gray-700">
            {language === 'en' ? 'Monthly Financial Report' : 'التقرير المالي الشهري'}
          </CardTitle>
          <Button
            onClick={() => setShowMonthlyReport(!showMonthlyReport)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl px-4 py-2 transform transition-all duration-200 hover:scale-105 flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {language === 'en' 
              ? (showMonthlyReport ? 'Hide Report' : 'Show Report') 
              : (showMonthlyReport ? 'إخفاء التقرير' : 'عرض التقرير')
            }
          </Button>
        </CardHeader>
        {showMonthlyReport && (
          <CardContent>
            <MonthlyReport
              language={language}
              profitData={profitData}
            />
          </CardContent>
        )}
      </Card>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-2 border-red-200 rounded-xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ProfitManagement;