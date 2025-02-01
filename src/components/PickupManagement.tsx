import React, { useState, useEffect } from 'react';
import { UserMinus } from 'lucide-react';

interface Child {
  id: string;
  name: string;
  parentName: string;
  checkInTime: string;
}

interface PickupManagementProps {
  language?: 'en' | 'ar';
}

const translations = {
  en: {
    pickupManagement: "Pickup Management",
    selectChild: "Select Child",
    selectChildPlaceholder: "Select a child",
    pickedUpBy: "Picked up by",
    parent: "Parent",
    familyMember: "Family Member",
    friend: "Friend",
    other: "Other",
    namePlaceholder: "Name",
    completePickup: "Complete Pickup",
    successMessage: "Pickup successfully registered! SMS notification sent to parent.",
  },
  ar: {
    pickupManagement: "إدارة الاستلام",
    selectChild: "اختر الطفل",
    selectChildPlaceholder: "اختر طفلاً",
    pickedUpBy: "تم الاستلام بواسطة",
    parent: "ولي الأمر",
    familyMember: "فرد من العائلة",
    friend: "صديق",
    other: "آخر",
    namePlaceholder: "الاسم",
    completePickup: "إتمام الاستلام",
    successMessage: "تم تسجيل الاستلام بنجاح! تم إرسال إشعار SMS لولي الأمر.",
  }
};

const PickupManagement = ({ language = 'en' }: PickupManagementProps) => {
  const t = translations[language];
  const isRTL = language === 'ar';

  const pickupOptions = [
    { value: 'parent', label: t.parent },
    { value: 'familyMember', label: t.familyMember },
    { value: 'friend', label: t.friend },
    { value: 'other', label: t.other }
  ];

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [pickupBy, setPickupBy] = useState<string>('parent');
  const [pickupDetails, setPickupDetails] = useState({
    name: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await fetch('/api/children/attendance');
        const data = await response.json();
        setChildren(data.presentChildren || []);
      } catch (error) {
        console.error('Failed to fetch children:', error);
      }
    };
    fetchChildren();
  }, []);

  const handlePickup = async () => {
    try {
      const response = await fetch('/api/pickup/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: selectedChild,
          pickupBy,
          pickupDetails
        }),
      });

      if (response.ok) {
        setShowSuccess(true);
        setSelectedChild('');
        setPickupBy('parent');
        setPickupDetails({ name: '' });
        
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to register pickup:', error);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-xl shadow-sm" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2">
        <UserMinus className="h-6 w-6 text-pink-500" />
        <h2 className="text-2xl font-semibold text-gray-800">{t.pickupManagement}</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.selectChild}
          </label>
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="">{t.selectChildPlaceholder}</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name} - {child.parentName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.pickedUpBy}
          </label>
          <select
            value={pickupBy}
            onChange={(e) => setPickupBy(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            {pickupOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {pickupBy !== 'parent' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder={t.namePlaceholder}
              value={pickupDetails.name}
              onChange={(e) => setPickupDetails({ name: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        )}

        <button
          onClick={handlePickup}
          disabled={!selectedChild || (pickupBy !== 'parent' && !pickupDetails.name)}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.completePickup}
        </button>

        {showSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            {t.successMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default PickupManagement;