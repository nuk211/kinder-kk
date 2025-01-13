'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import PaymentManagement from './PaymentManagement';

interface PaymentManagementProps {
  language: 'en' | 'ar';
}

const ProtectedPaymentWrapper: React.FC<PaymentManagementProps> = ({ language }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [protectionError, setProtectionError] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/protection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'payments', password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setProtectionError(data.error || (language === 'en' ? 'Failed to unlock page' : 'فشل في فتح الصفحة'));
        return;
      }

      setIsLocked(false);
      setPassword('');
      setProtectionError('');
    } catch (error) {
      setProtectionError(language === 'en' ? 'Failed to unlock page' : 'فشل في فتح الصفحة');
    }
  };

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="flex justify-center mb-6">
            <Lock className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-6 text-center">
            {language === 'en' ? 'Protected Page' : 'صفحة محمية'}
          </h2>
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'en' ? 'Enter Password' : 'أدخل كلمة المرور'}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full"
                required
              />
            </div>
            {protectionError && (
              <p className="text-red-500 text-sm">{protectionError}</p>
            )}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {language === 'en' ? 'Unlock' : 'فتح'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return <PaymentManagement language={language} />;
};

export default ProtectedPaymentWrapper;