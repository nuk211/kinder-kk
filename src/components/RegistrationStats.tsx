import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import _ from 'lodash';

const RegistrationStats = ({ children, language }) => {
  // Calculate totals by registration type
  const incomeByType = _.chain(children)
    .filter(child => child.registrationType) // Only include children with a registration type
    .groupBy('registrationType') // Group by registration type
    .mapValues(groupedChildren => 
      groupedChildren.reduce((total, child) => total + child.paidAmount, 0)
    ) // Sum paidAmount for each group
    .value();

  const totalIncome = _.sum(Object.values(incomeByType));

  const formatCurrency = (amount) => {
    return `${amount.toLocaleString()} IQD`;
  };

  const getColorClass = (type) => {
    switch (type) {
      case 'DAILY':
        return 'bg-blue-50 border-blue-200';
      case 'MONTHLY':
        return 'bg-green-50 border-green-200';
      case 'YEARLY':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColorClass = (type) => {
    switch (type) {
      case 'DAILY':
        return 'text-blue-700';
      case 'MONTHLY':
        return 'text-green-700';
      case 'YEARLY':
        return 'text-purple-700';
      default:
        return 'text-gray-700';
    }
  };

  const translateType = (type) => {
    if (language === 'ar') {
      switch (type) {
        case 'DAILY':
          return 'يومي';
        case 'MONTHLY':
          return 'شهري';
        case 'YEARLY':
          return 'سنوي';
        default:
          return 'غير محدد';
      }
    }
    return type?.toLowerCase() || 'Not set';
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        {language === 'en' ? 'Total Income by Registration Type' : 'إجمالي الدخل حسب نوع التسجيل'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['DAILY', 'MONTHLY', 'YEARLY'].map((type) => (
          <div
            key={type}
            className={`p-4 rounded-lg border ${getColorClass(type)}`}
          >
            <div className={`text-sm font-medium ${getTextColorClass(type)}`}>
              {translateType(type)}
            </div>
            <div className="text-xl font-bold mt-1">
              {formatCurrency(incomeByType[type] || 0)}
            </div>
          </div>
        ))}
        <div className="p-4 rounded-lg border bg-pink-50 border-pink-200">
          <div className="text-sm font-medium text-pink-700">
            {language === 'en' ? 'Total Income' : 'إجمالي الدخل'}
          </div>
          <div className="text-xl font-bold mt-1 text-pink-900">
            {formatCurrency(totalIncome)}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RegistrationStats;