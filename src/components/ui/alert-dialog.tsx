import React, { useState, useEffect } from 'react';
import { UserMinus } from 'lucide-react';

interface Child {
  id: string;
  name: string;
  parentPhone: string;
}

const pickupOptions = [
  { value: 'parent', label: 'Parent' },
  { value: 'familyMember', label: 'Family Member' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Other' }
];

const PickupManagement = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [pickupBy, setPickupBy] = useState<string>('parent');
  const [pickupDetails, setPickupDetails] = useState({
    name: '',
    phone: '',
    relation: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Fetch children data
    const fetchChildren = async () => {
      try {
        const response = await fetch('/api/children/present');
        const data = await response.json();
        setChildren(data);
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
          pickupDetails: pickupBy === 'parent' ? {} : pickupDetails
        }),
      });

      if (response.ok) {
        setShowSuccess(true);
        // Reset form
        setSelectedChild('');
        setPickupBy('parent');
        setPickupDetails({ name: '', phone: '', relation: '' });
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to register pickup:', error);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-xl shadow-sm">
      <div className="flex items-center gap-2">
        <UserMinus className="h-6 w-6 text-pink-500" />
        <h2 className="text-2xl font-semibold text-gray-800">Pickup Management</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Child
          </label>
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="">Select a child</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Picked up by
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
              placeholder="Name"
              value={pickupDetails.name}
              onChange={(e) => setPickupDetails(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border rounded-lg"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={pickupDetails.phone}
              onChange={(e) => setPickupDetails(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full p-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Relation to Child"
              value={pickupDetails.relation}
              onChange={(e) => setPickupDetails(prev => ({ ...prev, relation: e.target.value }))}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        )}

        <button
          onClick={handlePickup}
          disabled={!selectedChild || (pickupBy !== 'parent' && (!pickupDetails.name || !pickupDetails.phone))}
          className="w-full bg-gradient-to-r from-pink-500 to-blue-500 text-white py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Complete Pickup
        </button>

        {showSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            Pickup successfully registered! SMS notification sent to parent.
          </div>
        )}
      </div>
    </div>
  );
};

export default PickupManagement;