'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import RegistrationStats from './RegistrationStats';
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
import { Plus, Search, Settings, Trash2, FileText, Lock, UserPlus } from 'lucide-react';


interface PaymentManagementProps {
  language: 'en' | 'ar';
}

interface Child {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  registrationType?: 'DAILY' | 'MONTHLY' | 'YEARLY';
  isRegistered?: boolean;
  parentId: string;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  receiptNumber?: string;
}

enum RegistrationType {
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

const formatCurrency = (amount: number) => {
  return `${amount.toLocaleString()} IQD`;
};

// Update the function to accept language parameter
const formatBaghdadTime = (date: string, lang: 'en' | 'ar') => {
  try {
    // Don't add 3 hours since the time is already in Baghdad time
    const dateObj = new Date(date);
    
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

const PaymentManagement: React.FC<PaymentManagementProps> = ({ language }) => {
  // States
  const [isLocked, setIsLocked] = useState(true);
const [password, setPassword] = useState('');
const [protectionError, setProtectionError] = useState('');
const [showPassword, setShowPassword] = useState(false);
const pt = protectionTranslations[language];
  const [children, setChildren] = useState<Child[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isSetAmountOpen, setIsSetAmountOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [registrationType, setRegistrationType] = useState<'DAILY' | 'MONTHLY' | 'YEARLY' | ''>('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    const now = new Date();
    now.setHours(now.getHours() + 3); // Add 3 hours to current time
    return now.toISOString().slice(0, 16);
  });
  // New states for registration
  const [isRegisterChildOpen, setIsRegisterChildOpen] = useState(false);
  const [selectedChildName, setSelectedChildName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [availableChildren, setAvailableChildren] = useState<Child[]>([]);

    // Fetch all children (both registered and unregistered)
    const fetchAvailableChildren = async () => {
      try {
        const response = await fetch('/api/admin/children/registered');
        if (!response.ok) throw new Error('Failed to fetch children');
        const data = await response.json();
        console.log('Available children:', data);  // Debug log
        setAvailableChildren(data);
      } catch (error) {
        console.error('Failed to fetch available children:', error);
      }
    };
  
    useEffect(() => {
      if (!isLocked) {
        fetchAvailableChildren();
      }
    }, [isLocked]);

    const handleRegisterClick = () => {
      console.log('Register button clicked');  // Debug log
      setIsRegisterChildOpen(true);
      console.log('Dialog state after click:', isRegisterChildOpen);  // Debug log
    };

// Fetch registered children for the payments table
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
  if (!isLocked) {
    fetchAvailableChildren();
    fetchChildren();
  }
}, [isLocked]);

// Handle child registration
// Handle child registration
const handleRegisterChild = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  const registrationData = {
    childName: selectedChildName,
    parentId: selectedParentId,
    totalAmount: Number(totalAmount),
    registrationType: registrationType,
  };

  try {
    const response = await fetch('/api/payments/register-child', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Registration successful:', data);

    // Refresh both lists
    await Promise.all([
      fetchAvailableChildren(),  // Refresh unregistered children list
      fetchChildren()            // Refresh registered children list
    ]);
    
    setIsRegisterChildOpen(false);
    resetRegistrationForm();

  } catch (error) {
    console.error('Registration failed:', error);
    setError(
      language === 'en' 
        ? `Registration failed: ${error.message}` 
        : `فشل التسجيل: ${error.message}`
    );
  } finally {
    setIsLoading(false);
  }
};

const handleDeleteRegistration = async (childId: string, childName: string) => {
  if (!confirm(
    language === 'en'
      ? `Are you sure you want to delete the registration for ${childName}?`
      : `هل أنت متأكد من حذف تسجيل ${childName}؟`
  )) {
    return;
  }

  setIsLoading(true);
  try {
    const response = await fetch('/api/payments/delete-registration', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ childId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
    }

    // Remove the deleted child from the local state
    setChildren(prevChildren => prevChildren.filter(child => child.id !== childId));

    // Show success message
    alert(
      language === 'en'
        ? 'Registration deleted successfully'
        : 'تم حذف التسجيل بنجاح'
    );
  } catch (error) {
    console.error('Delete failed:', error);
    alert(
      language === 'en'
        ? `Failed to delete registration: ${error.message}`
        : `فشل حذف التسجيل: ${error.message}`
    );
  } finally {
    setIsLoading(false);
  }
};

const resetRegistrationForm = () => {
  setSelectedChildName('');
  setSelectedParentId('');
  setTotalAmount(0);
  setRegistrationType('');
};

const fetchPayments = async () => {
  try {
    const response = await fetch('/api/payments/children');
    if (!response.ok) throw new Error('Failed to fetch payments');
    const data = await response.json();
    setChildren(data);
  } catch (error) {
    console.error('Failed to fetch payments:', error);
  }
};


const RegisterChildDialog = () => (
  <Dialog open={isRegisterChildOpen} onOpenChange={setIsRegisterChildOpen}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          {language === 'en' ? 'Register Child' : 'تسجيل طفل'}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleRegisterChild} className="space-y-4 mt-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {language === 'en' ? 'Select Child' : 'اختر الطفل'}
          </label>
          <select
            className="w-full p-2 border rounded-md"
            value={`${selectedChildName}|${selectedParentId}`}
            onChange={(e) => {
              const [name, parentId] = e.target.value.split('|');
              setSelectedChildName(name);
              setSelectedParentId(parentId);
            }}
            required
          >
            <option value="">
              {language === 'en' ? 'Select a child' : 'اختر طفلاً'}
            </option>
            {availableChildren.map((child) => (
              <option 
                key={child.id} 
                value={`${child.name}|${child.parentId}`}
                className={child.isRegistered ? 'text-blue-600' : ''}
              >
                {child.name} 
                {child.isRegistered ? (
                  language === 'en' 
                    ? ` (Already registered - ${child.registrationType?.toLowerCase()})` 
                    : ` (مسجل مسبقاً - ${
                        child.registrationType === 'DAILY' ? 'يومي' :
                        child.registrationType === 'MONTHLY' ? 'شهري' :
                        'سنوي'
                      })`
                ) : ''}
              </option>
            ))}
          </select>
        </div>

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

        <div className="space-y-2">
          <label className="text-sm font-medium">
            {language === 'en' ? 'Registration Type' : 'نوع التسجيل'}
          </label>
          <select
            className="w-full p-2 border rounded-md"
            value={registrationType}
            onChange={(e) => setRegistrationType(e.target.value as RegistrationType)}
            required
          >
            <option value="">
              {language === 'en' ? 'Select registration type' : 'اختر نوع التسجيل'}
            </option>
            <option value="DAILY">{language === 'en' ? 'Daily' : 'يومي'}</option>
            <option value="MONTHLY">{language === 'en' ? 'Monthly' : 'شهري'}</option>
            <option value="YEARLY">{language === 'en' ? 'Yearly' : 'سنوي'}</option>
          </select>
        </div>

        <DialogFooter>
          <Button 
            type="submit" 
            className="bg-blue-500 hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading 
              ? (language === 'en' ? 'Registering...' : 'جاري التسجيل...')
              : (language === 'en' ? 'Register' : 'تسجيل')
            }
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);

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
              fetchChildren(); // or fetchProfitData() for profit page
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
  
    if (!registrationType) {
      setError(language === 'en' ? 'Please select registration type' : 'الرجاء اختيار نوع التسجيل');
      setIsLoading(false);
      return;
    }
  
    try {
      console.log('Sending data:', { 
        childId: selectedChild, 
        totalAmount, 
        registrationType 
      });
  
      const response = await fetch('/api/payments/set-total', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: selectedChild,
          totalAmount: parseFloat(totalAmount.toString()),
          registrationType: registrationType,
        }),
      });
  
      const data = await response.json();
      console.log('Response:', data);
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to set total amount');
      }
  
      await fetchChildren(); // Refresh the list
      setIsSetAmountOpen(false);
      setTotalAmount(0);
      setRegistrationType('');
      setSelectedChild('');
    } catch (error) {
      console.error('Failed to set total amount:', error);
      setError(language === 'en' ? 'Failed to set total amount' : 'فشل في تعيين المبلغ الإجمالي');
    } finally {
      setIsLoading(false);
    }
  };


  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/protection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'payments', password }), // use 'profit' for ProfitManagement
      });
  
      if (!res.ok) {
        const data = await res.json();
        setProtectionError(data.error || (language === 'en' ? 'Failed to unlock page' : 'فشل في فتح الصفحة'));
        return;
      }
  
      setIsLocked(false);
      // Store the unlocked state
      localStorage.setItem('pageLockState', JSON.stringify({ 
        page: 'payments', // use 'profit' for ProfitManagement
        isLocked: false 
      }));
      setPassword('');
      setProtectionError('');
      fetchChildren(); // use fetchProfitData() for ProfitManagement
    } catch (error) {
      setProtectionError(language === 'en' ? 'Failed to unlock page' : 'فشل في فتح الصفحة');
    }
  };

  const handleLock = async () => {
    try {
      await fetch('/api/admin/protection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'payments' }), // use 'profit' for ProfitManagement
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
            {language === 'en' ? 'Payments Management' : 'إدارة المدفوعات'}
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
                  className="w-full bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-xl px-6 py-3 transform transition-all duration-200 hover:scale-105"
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

  const handleDeletePayment = async (paymentId: string) => {
    if (confirm(
      language === 'en' 
        ? 'Are you sure you want to delete this payment?' 
        : 'هل أنت متأكد من حذف هذه الدفعة؟'
    )) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/payments/${paymentId}`, {
          method: 'DELETE',
        });
  
        if (!response.ok) {
          throw new Error('Failed to delete payment');
        }
  
        // Refresh both the payment details and children list
        await fetchPaymentDetails(selectedChild);
        await fetchChildren();
        
      } catch (error) {
        console.error('Failed to delete payment:', error);
        setError(language === 'en' ? 'Failed to delete payment' : 'فشل في حذف الدفعة');
      } finally {
        setIsLoading(false);
      }
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
      const now = new Date();
      setPaymentDate(now.toISOString().slice(0, 16));
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
{/* Header */}
<div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          {language === 'en' ? 'Payments Management' : 'إدارة المدفوعات'}
        </h2>
        <div className="flex items-center space-x-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={language === 'en' ? 'Search child...' : 'بحث عن طفل...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleRegisterClick}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Register Child' : 'تسجيل طفل'}
          </Button>
          <Button
            onClick={() => setIsLocked(true)}
            size="sm"
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white"
          >
            <Lock className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Lock Page' : 'قفل الصفحة'}
          </Button>
        </div>
      </div>

      {/* Registration Dialog */}
      <Dialog open={isRegisterChildOpen} onOpenChange={setIsRegisterChildOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Register Child' : 'تسجيل طفل'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRegisterChild} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'en' ? 'Select Child' : 'اختر الطفل'}
              </label>
              <select
                className="w-full p-2 border rounded-md"
                value={`${selectedChildName}|${selectedParentId}`}
                onChange={(e) => {
                  const [name, parentId] = e.target.value.split('|');
                  setSelectedChildName(name);
                  setSelectedParentId(parentId);
                }}
                required
              >
                <option value="">
                  {language === 'en' ? 'Select a child' : 'اختر طفلاً'}
                </option>
                {availableChildren.map((child) => (
                  <option 
                    key={child.id} 
                    value={`${child.name}|${child.parentId}`}
                  >
                    {child.name}
                  </option>
                ))}
              </select>
            </div>

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

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'en' ? 'Registration Type' : 'نوع التسجيل'}
              </label>
              <select
                className="w-full p-2 border rounded-md"
                value={registrationType}
                onChange={(e) => setRegistrationType(e.target.value as 'DAILY' | 'MONTHLY' | 'YEARLY')}
                required
              >
                <option value="">
                  {language === 'en' ? 'Select registration type' : 'اختر نوع التسجيل'}
                </option>
                <option value="DAILY">{language === 'en' ? 'Daily' : 'يومي'}</option>
                <option value="MONTHLY">{language === 'en' ? 'Monthly' : 'شهري'}</option>
                <option value="YEARLY">{language === 'en' ? 'Yearly' : 'سنوي'}</option>
              </select>
            </div>

            <DialogFooter>
              <Button 
                type="submit" 
                className="bg-blue-500 hover:bg-blue-600"
                disabled={isLoading}
              >
                {isLoading 
                  ? (language === 'en' ? 'Registering...' : 'جاري التسجيل...')
                  : (language === 'en' ? 'Register' : 'تسجيل')
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Registration Type Income Statistics */}
      <RegistrationStats children={children} language={language} />

      

      {/* Children Payments Table */}
      <Card className="p-6">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-[200px]">{language === 'en' ? 'Child Name' : 'اسم الطفل'}</TableHead>
        <TableHead className="w-[150px]">{language === 'en' ? 'Registration Type' : 'نوع التسجيل'}</TableHead>
        <TableHead className="text-right w-[150px]">{language === 'en' ? 'Total Amount' : 'المبلغ الإجمالي'}</TableHead>
        <TableHead className="text-right w-[150px]">{language === 'en' ? 'Paid Amount' : 'المبلغ المدفوع'}</TableHead>
        <TableHead className="text-right w-[150px]">{language === 'en' ? 'Remaining' : 'المتبقي'}</TableHead>
        <TableHead className="w-[300px]">{language === 'en' ? 'Actions' : 'الإجراءات'}</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {children.filter(child =>
        child.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).map((child) => (
        <TableRow key={child.id}>
          <TableCell className="font-medium">{child.name}</TableCell>
          <TableCell>
            <span className={`px-2 py-1 rounded-full text-xs
              ${child.registrationType === 'DAILY' 
                ? 'bg-blue-100 text-blue-800' 
                : child.registrationType === 'MONTHLY'
                ? 'bg-green-100 text-green-800'
                : child.registrationType === 'YEARLY'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-gray-100 text-gray-800'
              }`}
            >
              {child.registrationType 
                ? (language === 'en' 
                    ? child.registrationType.toLowerCase()
                    : child.registrationType === 'DAILY' 
                      ? 'يومي' 
                      : child.registrationType === 'MONTHLY'
                        ? 'شهري'
                        : 'سنوي')
                : language === 'en' ? 'Not set' : 'غير محدد'
              }
            </span>
          </TableCell>
          <TableCell className="text-right">{formatCurrency(child.totalAmount)}</TableCell>
          <TableCell className="text-right">{formatCurrency(child.paidAmount)}</TableCell>
          <TableCell className="text-right">{formatCurrency(child.remainingAmount)}</TableCell>
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
                 <Button
        onClick={() => handleDeleteRegistration(child.id, child.name)}
        size="sm"
        variant="destructive"
        className="bg-red-500 hover:bg-red-600"
        disabled={isLoading}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        {language === 'en' ? 'Delete' : 'حذف'}
      </Button>
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
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {language === 'en' ? 'Registration Type' : 'نوع التسجيل'}
        </label>
        <select
          className="w-full p-2 border rounded-md"
          value={registrationType}
          onChange={(e) => setRegistrationType(e.target.value as RegistrationType)}
          required
        >
          <option value="">
            {language === 'en' ? 'Select registration type' : 'اختر نوع التسجيل'}
          </option>
          <option value={RegistrationType.DAILY}>
            {language === 'en' ? 'Daily' : 'يومي'}
          </option>
          <option value={RegistrationType.MONTHLY}>
            {language === 'en' ? 'Monthly' : 'شهري'}
          </option>
          <option value={RegistrationType.YEARLY}>
            {language === 'en' ? 'Yearly' : 'سنوي'}
          </option>
        </select>
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
    <TableHead className="w-44">{language === 'en' ? 'Date' : 'التاريخ'}</TableHead>
    <TableHead className="text-right w-32">{language === 'en' ? 'Amount' : 'المبلغ'}</TableHead>
    <TableHead className="w-32">{language === 'en' ? 'Receipt No.' : 'رقم الإيصال'}</TableHead>
    <TableHead className="w-20">{language === 'en' ? 'Actions' : 'الإجراءات'}</TableHead>
  </TableRow>
</TableHeader>
  <TableBody>
  {payments.length > 0 ? (
    payments.map((payment) => (
      <TableRow key={payment.id} className="hover:bg-gray-50">
        <TableCell className="text-sm">
          {formatBaghdadTime(payment.paymentDate, language)}
        </TableCell>
        <TableCell className="text-right font-medium">
          {formatCurrency(payment.amount)}
        </TableCell>
        <TableCell className="text-gray-600">
          {payment.receiptNumber || '-'}
        </TableCell>
        <TableCell>
          <Button
            onClick={() => handleDeletePayment(payment.id)}
            size="sm"
            variant="ghost"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    ))
  ) : (
    <TableRow>
      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
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