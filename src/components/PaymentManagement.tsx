'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Search, Settings, Trash2, FileText } from 'lucide-react';

interface PaymentManagementProps {
  language: 'en' | 'ar';
}

interface Child {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  receiptNumber?: string;
}

// Update the function to accept language parameter
const formatBaghdadTime = (date: string, lang: 'en' | 'ar') => {
    try {
      const dateObj = new Date(date);
      dateObj.setHours(dateObj.getHours() + 3); // Add 3 hours
  
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
  
      return dateObj.toLocaleString(
        lang === 'ar' ? 'ar-IQ' : 'en-US',
        options
      );
    } catch (error) {
      console.error('Error formatting date:', error);
      return date;
    }
  };

const PaymentManagement: React.FC<PaymentManagementProps> = ({ language }) => {
  // States
  const [children, setChildren] = useState<Child[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isSetAmountOpen, setIsSetAmountOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    const now = new Date();
    now.setHours(now.getHours() + 3); // Add 3 hours to current time
    return now.toISOString().slice(0, 16);
  });
  // Fetch children data
  const fetchChildren = async () => {
    try {
      const response = await fetch('/api/payments/children');
      if (!response.ok) throw new Error('Failed to fetch children');
      const data = await response.json();
      setChildren(data);
    } catch (error) {
      console.error('Failed to fetch children data:', error);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchPaymentDetails = async (childId: string) => {
    console.log('Starting to fetch details for child:', childId);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/payments/details/${childId}`);
      console.log('Response received:', response);

      if (!response.ok) {
        throw new Error('Failed to fetch payment details');
      }

      const data = await response.json();
      console.log('Received data:', data);

      setPayments(data.payments || []);
      setSelectedChild(childId);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      setError(language === 'en' ? 'Failed to fetch payment details' : 'فشل في جلب تفاصيل الدفعات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetTotalAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/payments/set-total', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: selectedChild,
          totalAmount: totalAmount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to set total amount');
      }

      await fetchChildren();
      setIsSetAmountOpen(false);
      setTotalAmount(0);
      setSelectedChild('');
    } catch (error) {
      console.error('Failed to set total amount:', error);
      setError(language === 'en' ? 'Failed to set total amount' : 'فشل في تعيين المبلغ الإجمالي');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPayments = async (childId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payments/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ childId }),
      });

      if (!response.ok) {
        throw new Error('Failed to reset payments');
      }

      await fetchChildren();
    } catch (error) {
      console.error('Failed to reset payments:', error);
      setError(language === 'en' ? 'Failed to reset payments' : 'فشل في إعادة تعيين المدفوعات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: selectedChild,
          amount: paymentAmount,
          paymentDate: new Date(paymentDate).toISOString(),
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to add payment');
      }
  
      await fetchChildren();
      setIsAddPaymentOpen(false);
      setPaymentAmount(0);
      setPaymentDate(new Date().toISOString().slice(0, 16));
      setSelectedChild('');
    } catch (error) {
      console.error('Failed to add payment:', error);
      setError(language === 'en' ? 'Failed to add payment' : 'فشل في إضافة الدفعة');
    } finally {
      setIsLoading(false);
    }
  };

  const openSetAmountDialog = (childId: string) => {
    const child = children.find(c => c.id === childId);
    setSelectedChild(childId);
    setTotalAmount(child?.totalAmount || 0);
    setError('');
    setIsSetAmountOpen(true);
  };

  const openAddPaymentDialog = (childId: string) => {
    const now = new Date();
    now.setHours(now.getHours() + 3); // Add 3 hours to current time
    
    setSelectedChild(childId);
    setPaymentAmount(0);
    setPaymentDate(now.toISOString().slice(0, 16));
    setError('');
    setIsAddPaymentOpen(true);
  };

  const selectedChildData = children.find(child => child.id === selectedChild);

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Search and Title */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          {language === 'en' ? 'Payments Management' : 'إدارة المدفوعات'}
        </h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={language === 'en' ? 'Search child...' : 'بحث عن طفل...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Children Payments Table */}
      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === 'en' ? 'Child Name' : 'اسم الطفل'}</TableHead>
              <TableHead>{language === 'en' ? 'Total Amount' : 'المبلغ الإجمالي'}</TableHead>
              <TableHead>{language === 'en' ? 'Paid Amount' : 'المبلغ المدفوع'}</TableHead>
              <TableHead>{language === 'en' ? 'Remaining' : 'المتبقي'}</TableHead>
              <TableHead>{language === 'en' ? 'Actions' : 'الإجراءات'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {children.filter(child =>
              child.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((child) => (
              <TableRow key={child.id}>
                <TableCell className="font-medium">{child.name}</TableCell>
                <TableCell>{child.totalAmount}</TableCell>
                <TableCell>{child.paidAmount}</TableCell>
                <TableCell>{child.remainingAmount}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => openSetAmountDialog(child.id)}
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      {language === 'en' ? 'Set Total' : 'تعيين المبلغ'}
                    </Button>
                    <Button
                      onClick={() => openAddPaymentDialog(child.id)}
                      size="sm"
                      className="bg-pink-500 hover:bg-pink-600"
                      disabled={child.totalAmount === 0}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {language === 'en' ? 'Add Payment' : 'إضافة دفعة'}
                    </Button>
                    {(child.totalAmount > 0 || child.paidAmount > 0) && (
                      <Button
                        onClick={() => {
                          if (confirm(
                            language === 'en' 
                              ? `Are you sure you want to reset all payment data for ${child.name}?` 
                              : `هل أنت متأكد من إعادة تعيين جميع بيانات الدفع لـ ${child.name}؟`
                          )) {
                            handleResetPayments(child.id);
                          }
                        }}
                        size="sm"
                        variant="destructive"
                        className="bg-red-500 hover:bg-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {language === 'en' ? 'Reset' : 'إعادة تعيين'}
                      </Button>
                    )}
                    {child.paidAmount > 0 && (
                      <Button
                        onClick={() => fetchPaymentDetails(child.id)}
                        size="sm"
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        {language === 'en' ? 'Details' : 'التفاصيل'}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Set Total Amount Dialog */}
      <Dialog open={isSetAmountOpen} onOpenChange={setIsSetAmountOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Set Total Amount' : 'تعيين المبلغ الإجمالي'}
              {selectedChildData && ` - ${selectedChildData.name}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSetTotalAmount} className="space-y-4 mt-4">
            {error && (
              <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'en' ? 'Total Amount' : 'المبلغ الإجمالي'}
              </label>
              <Input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                required
                min="0"
                step="0.01"
                className="w-full"
              />
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                className="bg-blue-500 hover:bg-blue-600"
                disabled={isLoading}
              >
                {isLoading 
                  ? (language === 'en' ? 'Saving...' : 'جاري الحفظ...')
                  : (language === 'en' ? 'Save' : 'حفظ')
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Add New Payment' : 'إضافة دفعة جديدة'}
              {selectedChildData && ` - ${selectedChildData.name}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPayment} className="space-y-4 mt-4">
            {error && (
              <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === 'en' ? 'Payment Amount' : 'مبلغ الدفعة'}
            </label>
            <Input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              required
              min="0"
              max={selectedChildData?.remainingAmount || 0}
              step="0.01"
              className="w-full"
            />
            {selectedChildData && (
              <p className="text-sm text-gray-500">
                {language === 'en' 
                  ? `Remaining amount: ${selectedChildData.remainingAmount}`
                  : `المبلغ المتبقي: ${selectedChildData.remainingAmount}`
                }
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === 'en' ? 'Payment Date' : 'تاريخ الدفع'}
            </label>
            <Input
              type="datetime-local"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              className="bg-pink-500 hover:bg-pink-600"
              disabled={isLoading || !selectedChildData?.remainingAmount}
            >
              {isLoading 
                ? (language === 'en' ? 'Adding...' : 'جاري الإضافة...')
                : (language === 'en' ? 'Add Payment' : 'إضافة الدفعة')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Payment Details Dialog */}
    <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {language === 'en' ? 'Payment Details' : 'تفاصيل المدفوعات'}
            {selectedChildData && ` - ${selectedChildData.name}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm text-blue-700">
                {language === 'en' ? 'Total Amount' : 'المبلغ الإجمالي'}
              </h4>
              <p className="text-xl font-bold text-blue-900">
                {selectedChildData?.totalAmount || 0}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm text-green-700">
                {language === 'en' ? 'Paid Amount' : 'المبلغ المدفوع'}
              </h4>
              <p className="text-xl font-bold text-green-900">
                {selectedChildData?.paidAmount || 0}
              </p>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg">
              <h4 className="text-sm text-pink-700">
                {language === 'en' ? 'Remaining' : 'المتبقي'}
              </h4>
              <p className="text-xl font-bold text-pink-900">
                {selectedChildData?.remainingAmount || 0}
              </p>
            </div>
          </div>

{/* Payments History Table */}
<div className="border rounded-lg">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>{language === 'en' ? 'Date' : 'التاريخ'}</TableHead>
        <TableHead>{language === 'en' ? 'Amount' : 'المبلغ'}</TableHead>
        <TableHead>
          {language === 'en' ? 'Receipt No.' : 'رقم الإيصال'}
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {payments.length > 0 ? (
        payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>
              {(() => {
                const date = new Date(payment.paymentDate);
                date.setHours(date.getHours()); // Add 3 hours
                return date.toLocaleString(
                  language === 'ar' ? 'ar-IQ' : 'en-US',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  }
                );
              })()}
            </TableCell>
            <TableCell>{payment.amount}</TableCell>
            <TableCell>{payment.receiptNumber || '-'}</TableCell>
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={3} className="text-center py-4 text-gray-500">
            {language === 'en'
              ? 'No payment records found'
              : 'لم يتم العثور على سجلات دفع'}
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
</div>
        </div>
        <DialogFooter>
          <Button 
            onClick={() => setIsDetailsOpen(false)}
            className="bg-gray-500 hover:bg-gray-600"
          >
            {language === 'en' ? 'Close' : 'إغلاق'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
);
};

export default PaymentManagement;