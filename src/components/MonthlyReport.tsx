// components/MonthlyReport.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronUp, 
  Printer,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Lock,
  CreditCard,
  Calendar,
  Clock
} from 'lucide-react';
import * as AlertDialog from "@/components/ui/alert-dialog";


interface ExpenseRecord {
  id: string;
  amount: number;
  description: string;
  type: 'FOOD' | 'GENERAL';
  createdAt: string;
}

interface InstallmentRecord {
  id: string;
  amount: number;
  dueDate: string;
  paidAmount: number;
  childName: string;
  registrationType: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
}
type ExpenseType = 'FOOD' | 'GENERAL';

interface MonthlyData {
  totalIncome: {
    daily: number;
    monthly: number;
    yearly: number;
    installments: number;
    total: number;
  };
  totalExpenses: number;
  netProfit: number;
  expenses: ExpenseRecord[];
  installments: InstallmentRecord[];
  isClosed?: boolean;  // Add this line
}

interface MonthlyReportProps {
  language: 'en' | 'ar';
  profitData: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    expenses?: ExpenseRecord[];
    installments?: InstallmentRecord[];
    monthlyRecords?: Array<{
      year: number;
      month: number;
      isClosed: boolean;
    }>;
  };
}

type ClosedMonthRecord = {
  id: string;
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  isClosed: boolean;
  paymentRecords: Array<{
    childId: string;
    childName: string;
    amount: number;
    paymentDate: string;
    paymentType: string;
  }>;
  expenseRecords: Array<{
    amount: number;
    description: string;
    expenseType: string;
    expenseDate: string;
  }>;
};

const MonthlyReport: React.FC<MonthlyReportProps> = ({ language, profitData }) => {
  const [selectedMonth, setSelectedMonth] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'income' | 'expenses'>('income');
  const [showCloseAlert, setShowCloseAlert] = React.useState(false);
  const [closedMonths, setClosedMonths] = React.useState<ClosedMonthRecord[]>([]);
  const [monthToClose, setMonthToClose] = React.useState<{ key: string; data: MonthlyData } | null>(null);
  const [monthlyRecords, setMonthlyRecords] = React.useState<Array<{
    year: number;
    month: number;
    isClosed: boolean;
  }>>([]);

  // Fetch monthly records on component mount
  React.useEffect(() => {
    const fetchMonthlyRecords = async () => {
      try {
        const response = await fetch('/api/admin/financial/monthly-records');
        if (!response.ok) throw new Error('Failed to fetch records');
        const data = await response.json();
        
        // Transform the data to match our expected format
        if (data && Array.isArray(data)) {
          const records = data.map(record => ({
            year: record.year,
            month: record.month,
            isClosed: record.isClosed
          }));
          setMonthlyRecords(records);
        }
      } catch (error) {
        console.error('Error fetching monthly records:', error);
      }
    };

    fetchMonthlyRecords();
  }, []);

  React.useEffect(() => {
    const fetchClosedMonths = async () => {
      try {
        const response = await fetch('/api/admin/financial/monthly-records');
        if (!response.ok) throw new Error('Failed to fetch closed months');
        const data = await response.json();
        setClosedMonths(data);
      } catch (error) {
        console.error('Error fetching closed months:', error);
      }
    };
  
    fetchClosedMonths();
  }, []);

  // Debug logging
  React.useEffect(() => {
    console.log('-------DEBUG MONTHLY REPORT-------');
    console.log('Received profitData:', profitData);
    console.log('Installments:', profitData.installments);
    console.log('Monthly Records:', monthlyRecords);
    console.log('------------------------------');
  }, [profitData, monthlyRecords]);

  const isMonthClosed = (monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number);
    return monthlyRecords.some(
      record => record.year === year && 
                record.month === month && 
                record.isClosed
    );
  };


  const t = {
    monthlyFinances: language === 'en' ? "Monthly Finances" : "المالية الشهرية",
    totalIncome: language === 'en' ? "Total Income" : "إجمالي الدخل",
    totalExpenses: language === 'en' ? "Total Expenses" : "إجمالي المصروفات",
    netProfit: language === 'en' ? "Net Profit" : "صافي الربح",
    dailyIncome: language === 'en' ? "Daily Payments" : "المدفوعات اليومية",
    monthlyIncome: language === 'en' ? "Monthly Payments" : "المدفوعات الشهرية",
    yearlyIncome: language === 'en' ? "Yearly Payments" : "المدفوعات السنوية",
    installments: language === 'en' ? "Installments" : "الأقساط",
    payments: language === 'en' ? "Payments" : "المدفوعات",
    expenses: language === 'en' ? "Expenses" : "المصروفات",
    paymentDate: language === 'en' ? "Payment Date" : "تاريخ الدفع",
    childName: language === 'en' ? "Child Name" : "اسم الطفل",
    amount: language === 'en' ? "Amount" : "المبلغ",
    status: language === 'en' ? "Status" : "الحالة",
    dueDate: language === 'en' ? "Due Date" : "تاريخ الاستحقاق",
    paidAmount: language === 'en' ? "Paid Amount" : "المبلغ المدفوع",
    remainingAmount: language === 'en' ? "Remaining" : "المتبقي",
    description: language === 'en' ? "Description" : "الوصف",
    type: language === 'en' ? "Type" : "النوع",
    noRecords: language === 'en' ? "No records found" : "لا توجد سجلات",
    closeMonth: language === 'en' ? "Close Month" : "إغلاق الشهر",
  reopen: language === 'en' ? "Reopen Month" : "إعادة فتح الشهر",
  closeConfirmTitle: language === 'en' ? "Close Month" : "إغلاق الشهر",
  closeConfirmMessage: language === 'en' 
    ? "Are you sure you want to close this month? This will lock all financial records." 
    : "هل أنت متأكد من إغلاق هذا الشهر؟ سيؤدي هذا إلى قفل جميع السجلات المالية.",
  reopenConfirmTitle: language === 'en' ? "Reopen Month" : "إعادة فتح الشهر",
  reopenConfirmMessage: language === 'en'
    ? "Are you sure you want to reopen this month?"
    : "هل أنت متأكد من إعادة فتح هذا الشهر؟",
    printReport: language === 'en' ? "Print Report" : "طباعة التقرير",
    registrationType: language === 'en' ? "Registration Type" : "نوع التسجيل",
    foodExpense: language === 'en' ? "Food" : "طعام",
    generalExpense: language === 'en' ? "General" : "عام",
    currency: language === 'en' ? "IQD" : "د.ع",
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-US')} ${t.currency}`;
  };

  const formatDate = (dateString: string) => {
    console.log('Formatting date string:', dateString); // Debug log
    try {
      const date = new Date(dateString);
      console.log('Parsed date:', date); // Debug log
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return language === 'en' ? 'Invalid Date' : 'تاريخ غير صالح';
      }
      
      return date.toLocaleDateString(
        language === 'ar' ? 'ar-IQ' : 'en-US',
        { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric'
        }
      );
    } catch (error) {
      console.error('Error formatting date:', error);
      return language === 'en' ? 'Invalid Date' : 'تاريخ غير صالح';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRegistrationTypeStyle = (type: string) => {
    switch (type) {
      case 'DAILY':
        return 'bg-blue-100 text-blue-800';
      case 'MONTHLY':
        return 'bg-purple-100 text-purple-800';
      case 'YEARLY':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExpenseTypeStyle = (type: string) => {
    return type === 'FOOD' 
      ? 'bg-orange-100 text-orange-800' 
      : 'bg-blue-100 text-blue-800';
  };

// Group data by month
const monthlyData = React.useMemo(() => {
  const data: { [key: string]: MonthlyData } = {};
  
  const processDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime()) || date.getFullYear() < 2024) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  // First, process closed months
  closedMonths.forEach(record => {
    const monthKey = `${record.year}-${String(record.month).padStart(2, '0')}`;
    data[monthKey] = {
      totalIncome: {
        daily: 0,
        monthly: 0,
        yearly: 0,
        installments: record.totalIncome,
        total: record.totalIncome
      },
      totalExpenses: record.totalExpenses,
      netProfit: record.netProfit,
      expenses: record.expenseRecords.map(e => ({
        id: 'archived',
        amount: e.amount,
        description: e.description,
        type: e.expenseType as ExpenseType, // Cast to match your schema type
        createdAt: e.expenseDate
      })),
      installments: record.paymentRecords.map(p => ({
        id: 'archived',
        amount: p.amount,
        childName: p.childName,
        dueDate: p.paymentDate,
        paidAmount: p.amount,
        registrationType: p.paymentType,
        status: 'PAID'
      })),
      isClosed: true
    };
  });

  const processCurrentMonth = (monthKey: string) => {
    // Skip if this month is already processed as closed
    if (data[monthKey]?.isClosed) return;

    if (!data[monthKey]) {
      data[monthKey] = {
        totalIncome: {
          daily: 0,
          monthly: 0,
          yearly: 0,
          installments: 0,
          total: 0
        },
        totalExpenses: 0,
        netProfit: 0,
        expenses: [],
        installments: [],
        isClosed: false
      };
    }
  };

  // Initialize month data structure
  const initializeMonthData = (monthKey: string, isClosed = false) => {
    if (!data[monthKey]) {
      data[monthKey] = {
        totalIncome: {
          daily: 0,
          monthly: 0,
          yearly: 0,
          installments: 0,
          total: 0
        },
        totalExpenses: 0,
        netProfit: 0,
        expenses: [],
        installments: [],
        isClosed: isClosed
      };
    }
  };

  if (profitData.monthlyRecords) {
    profitData.monthlyRecords.forEach(record => {
      const monthKey = `${record.year}-${String(record.month).padStart(2, '0')}`;
      initializeMonthData(monthKey, record.isClosed);
    });
  }

  

  // Process installments with null check
  if (profitData.installments) {
    profitData.installments.forEach(installment => {
      const monthKey = processDate(installment.dueDate);
      if (data[monthKey]?.isClosed) return;
      
      processCurrentMonth(monthKey);
      data[monthKey].installments.push(installment);
      if (installment.status === 'PAID') {
        data[monthKey].totalIncome.installments += installment.paidAmount;
        data[monthKey].totalIncome.total += installment.paidAmount;
      }
    });
  }

  // Process expenses with null check
  if (profitData.expenses) {
    profitData.expenses.forEach(expense => {
      const monthKey = processDate(expense.createdAt);
      if (data[monthKey]?.isClosed) return;
      
      processCurrentMonth(monthKey);
      data[monthKey].expenses.push(expense);
      data[monthKey].totalExpenses += expense.amount;
    });
  }

  // Calculate net profit for each month
  Object.keys(data).forEach(monthKey => {
    if (!data[monthKey].isClosed) {
      data[monthKey].netProfit = data[monthKey].totalIncome.total - data[monthKey].totalExpenses;
    }
  });


  // If no data exists, create at least one month
  if (Object.keys(data).length === 0) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    initializeMonthData(currentMonth);
  }

  // Debug log
  console.log('Monthly data processed:', {
    months: Object.keys(data),
    totalMonths: Object.keys(data).length,
    sampleMonth: data[Object.keys(data)[0]]
  });

  Object.keys(data).forEach(monthKey => {
    const [year, month] = monthKey.split('-').map(Number);
    const record = profitData.monthlyRecords?.find(r => 
      r.year === year && r.month === month
    );
    data[monthKey].isClosed = record?.isClosed || false;
  });

  return data;
}, [profitData, closedMonths]);

const renderIncomeBreakdown = (monthData: MonthlyData) => (
  <div className="space-y-6">
    {/* Income Summary Card */}
    <div className="grid grid-cols-1 gap-4">
      <Card className="bg-green-50/50">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">{t.totalIncome}</p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(monthData.totalIncome.total)}
              </p>
            </div>
            <Calendar className="h-5 w-5 text-green-500" />
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Installments Table */}
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">{t.installments}</h3>
      {monthData.installments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">{t.dueDate}</th>
                <th className="text-left py-2">{t.childName}</th>
                <th className="text-left py-2">{t.status}</th>
                <th className="text-right py-2">{t.amount}</th>
                <th className="text-right py-2">{t.paidAmount}</th>
              </tr>
            </thead>
            <tbody>
              {monthData.installments.map(installment => (
                <tr key={installment.id} className="border-b">
                  <td className="py-2">{formatDate(installment.dueDate)}</td>
                  <td className="py-2">{installment.childName}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(installment.status)}`}>
                      {installment.status}
                    </span>
                  </td>
                  <td className="py-2 text-right font-mono">
                    {formatCurrency(installment.amount)}
                  </td>
                  <td className="py-2 text-right font-mono">
                    {formatCurrency(installment.paidAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-4">{t.noRecords}</p>
      )}
    </div>
  </div>
);

  const renderExpensesBreakdown = (monthData: MonthlyData) => (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">{t.paymentDate}</th>
              <th className="text-left py-2">{t.description}</th>
              <th className="text-left py-2">{t.type}</th>
              <th className="text-right py-2">{t.amount}</th>
            </tr>
          </thead>
          <tbody>
            {monthData.expenses.map(expense => (
              <tr key={expense.id} className="border-b">
                <td className="py-2">{formatDate(expense.createdAt)}</td>
                <td className="py-2">{expense.description}</td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${getExpenseTypeStyle(expense.type)}`}>
                    {expense.type === 'FOOD' ? t.foodExpense : t.generalExpense}
                  </span>
                </td>
                <td className="py-2 text-right font-mono">
                  {formatCurrency(expense.amount)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2">
              <td colSpan={3} className="py-2 font-semibold">{t.totalExpenses}</td>
              <td className="py-2 text-right font-mono font-semibold">
                {formatCurrency(monthData.totalExpenses)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );


  const handleToggleMonthDialog = (monthKey: string, data: MonthlyData) => {
    console.log('Opening dialog for month:', monthKey);
    const [year, month] = monthKey.split('-').map(Number);
    const currentStatus = isMonthClosed(monthKey);
    
    setMonthToClose({ 
      key: monthKey, 
      data: { ...data, isClosed: currentStatus }
    });
    setShowCloseAlert(true);
  };

  const confirmToggleMonth = async () => {
    if (!monthToClose) return;

    const [year, month] = monthToClose.key.split('-').map(Number);
    const isClosed = isMonthClosed(monthToClose.key);

    try {
      const endpoint = isClosed
        ? '/api/admin/financial/reopen-month'
        : '/api/admin/financial/close-month';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update month status');
      }

      const result = await response.json();
      console.log('Toggle month response:', result);

      // Close the dialog
      setShowCloseAlert(false);

      // Update the monthly records
      if (isClosed) {
        setMonthlyRecords(prev => prev.filter(
          record => !(record.year === year && record.month === month)
        ));
      } else {
        setMonthlyRecords(prev => [...prev, { year, month, isClosed: true }]);
      }

      // Refresh the page to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Failed to toggle month status:', error);
      alert(language === 'en' 
        ? `Failed to ${isClosed ? 'reopen' : 'close'} month: ${error.message}`
        : `فشل في ${isClosed ? 'إعادة فتح' : 'إغلاق'} الشهر: ${error.message}`
      );
    }
  };

  const confirmCloseMonth = async () => {
    if (!monthToClose) return;
    
    const [year, month] = monthToClose.key.split('-').map(Number);
    
    try {
      const response = await fetch('/api/admin/financial/close-month', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ month, year }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to close month');
      }
  
      // Close the dialog
      setShowCloseAlert(false);
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Failed to close month:', error);
      alert(language === 'en' ? 'Failed to close month' : 'فشل في إغلاق الشهر');
    }
  };

  const handlePrintMonth = (monthKey: string, monthData: MonthlyData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
  
    const monthName = new Date(monthKey + '-01').toLocaleDateString(
      language === 'ar' ? 'ar-IQ' : 'en-US',
      { month: 'long', year: 'numeric' }
    );

    
  
    printWindow.document.write(`
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
        <head>
          <title>${monthName} - ${t.monthlyFinances}</title>
          <style>
            body { 
              font-family: Arial, sans-serif;
              margin: 2rem;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 2rem;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 1rem;
              margin-bottom: 2rem;
            }
            .summary-item {
              padding: 1rem;
              border-radius: 8px;
              text-align: center;
              border: 1px solid #ddd;
            }
            .income { background-color: #d1fae5; }
            .expenses { background-color: #fee2e2; }
            .profit { background-color: #dbeafe; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 1.5rem;
              margin-bottom: 2rem;
            }
            th, td {
              padding: 0.75rem;
              border-bottom: 1px solid #ddd;
              text-align: left;
            }
            th {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            .type-badge {
              padding: 0.25rem 0.5rem;
              border-radius: 9999px;
              font-size: 0.875rem;
              background-color: #f3f4f6;
            }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .section-title {
              margin-top: 2rem;
              padding-bottom: 0.5rem;
              border-bottom: 2px solid #e5e7eb;
            }
            .total-row {
              background-color: #f8f9fa;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${monthName} - ${t.monthlyFinances}</h1>
          </div>
          
          <div class="summary">
            <div class="summary-item income">
              <h3>${t.totalIncome}</h3>
              <strong>${formatCurrency(monthData.totalIncome.total)}</strong>
            </div>
            <div class="summary-item expenses">
              <h3>${t.totalExpenses}</h3>
              <strong>${formatCurrency(monthData.totalExpenses)}</strong>
            </div>
            <div class="summary-item profit">
              <h3>${t.netProfit}</h3>
              <strong>${formatCurrency(monthData.netProfit)}</strong>
            </div>
          </div>
  
          <h2 class="section-title">${t.installments}</h2>
          <table>
            <thead>
              <tr>
                <th>${t.dueDate}</th>
                <th>${t.childName}</th>
                <th>${t.status}</th>
                <th class="text-right">${t.amount}</th>
                <th class="text-right">${t.paidAmount}</th>
              </tr>
            </thead>
            <tbody>
              ${monthData.installments.map(installment => `
                <tr>
                  <td>${formatDate(installment.dueDate)}</td>
                  <td>${installment.childName}</td>
                  <td><span class="type-badge">${installment.status}</span></td>
                  <td class="text-right">${formatCurrency(installment.amount)}</td>
                  <td class="text-right">${formatCurrency(installment.paidAmount)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3">${language === 'en' ? 'Total Installments' : 'مجموع الأقساط'}</td>
                <td class="text-right">${formatCurrency(monthData.installments.reduce((sum, inst) => sum + inst.amount, 0))}</td>
                <td class="text-right">${formatCurrency(monthData.installments.reduce((sum, inst) => sum + inst.paidAmount, 0))}</td>
              </tr>
            </tbody>
          </table>
  
          <h2 class="section-title">${t.expenses}</h2>
          <table>
            <thead>
              <tr>
                <th>${t.paymentDate}</th>
                <th>${t.description}</th>
                <th>${t.type}</th>
                <th class="text-right">${t.amount}</th>
              </tr>
            </thead>
            <tbody>
              ${monthData.expenses.map(expense => `
                <tr>
                  <td>${formatDate(expense.createdAt)}</td>
                  <td>${expense.description}</td>
                  <td><span class="type-badge">${expense.type === 'FOOD' ? t.foodExpense : t.generalExpense}</span></td>
                  <td class="text-right">${formatCurrency(expense.amount)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3">${language === 'en' ? 'Total Expenses' : 'مجموع المصروفات'}</td>
                <td class="text-right">${formatCurrency(monthData.totalExpenses)}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);
  
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="space-y-4">
      {Object.entries(monthlyData).reverse().map(([monthKey, data]) => (
        <Card key={monthKey} className="border-2 border-pink-200 hover:border-pink-300 transition-all duration-200">
          <CardHeader>
            <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  {new Date(monthKey + '-01').toLocaleDateString(
                    language === 'ar' ? 'ar-IQ' : 'en-US',
                    { month: 'long', year: 'numeric' }
                  )}
                  <span 
                    className={`px-2 py-1 text-xs rounded-full ${
                      isMonthClosed(monthKey)
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {isMonthClosed(monthKey)
                      ? (language === 'en' ? 'Closed' : 'مغلق')
                      : (language === 'en' ? 'Open' : 'مفتوح')
                    }
                  </span>
                </CardTitle>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handlePrintMonth(monthKey, data)}
                  variant="outline"
                  size="sm"
                  className="bg-white"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {t.printReport}
                </Button>
                {/* Add Close Month Button */}
                <Button
  onClick={() => handleToggleMonthDialog(monthKey, data)}
  variant="outline"
  size="sm"
  className={`${data.isClosed ? 'bg-yellow-100' : 'bg-white'}`}
>
  <Lock className="h-4 w-4" />
</Button>

<Button
  onClick={() => setSelectedMonth(
    selectedMonth === monthKey ? null : monthKey
  )}
  variant="ghost"
  size="sm"
>
  {selectedMonth === monthKey ? 
    <ChevronUp className="h-4 w-4" /> : 
    <ChevronDown className="h-4 w-4" />
  }
</Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-500">{t.totalIncome}</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(data.totalIncome.total)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.totalExpenses}</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatCurrency(data.totalExpenses)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.netProfit}</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatCurrency(data.netProfit)}
                </p>
              </div>
            </div>
          </CardHeader>

          {selectedMonth === monthKey && (
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Button
                  variant={activeTab === 'income' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('income')}
                >
                  {t.totalIncome}
                </Button>
                <Button
                  variant={activeTab === 'expenses' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('expenses')}
                >
                  {t.totalExpenses}
                </Button>
              </div>

              {activeTab === 'income' ? (
                renderIncomeBreakdown(data)
              ) : (
                renderExpensesBreakdown(data)
              )}
            </CardContent>
          )}
        </Card>
      ))}

<AlertDialog.AlertDialog open={showCloseAlert} onOpenChange={setShowCloseAlert}>
        <AlertDialog.AlertDialogContent>
          <AlertDialog.AlertDialogHeader>
            <AlertDialog.AlertDialogTitle>
              {monthToClose?.data.isClosed
                ? t.reopenConfirmTitle
                : t.closeConfirmTitle}
            </AlertDialog.AlertDialogTitle>
            <AlertDialog.AlertDialogDescription>
              {monthToClose?.data.isClosed
                ? t.reopenConfirmMessage
                : t.closeConfirmMessage}
            </AlertDialog.AlertDialogDescription>
          </AlertDialog.AlertDialogHeader>
          <AlertDialog.AlertDialogFooter>
            <AlertDialog.AlertDialogCancel>
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </AlertDialog.AlertDialogCancel>
            <AlertDialog.AlertDialogAction onClick={confirmToggleMonth}>
              {monthToClose?.data.isClosed
                ? (language === 'en' ? 'Reopen Month' : 'إعادة فتح الشهر')
                : (language === 'en' ? 'Close Month' : 'إغلاق الشهر')}
            </AlertDialog.AlertDialogAction>
          </AlertDialog.AlertDialogFooter>
        </AlertDialog.AlertDialogContent>
      </AlertDialog.AlertDialog>
    </div>
  );
};

export default MonthlyReport;