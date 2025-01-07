'use client';

import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import AdminDashboard from '@/components/AdminDashboard';
import ChildrenList from '@/components/ChildrenList';
import ParentList from '@/components/ParentList';
import AttendanceManagement from '@/components/AttendanceManagement';
import { NotificationMenu } from '@/components/NotificationMenu';
import { Globe, LayoutDashboard, Users, Calendar, UserSquare2, UserMinus, CreditCard } from 'lucide-react';
import PickupManagement from '@/components/PickupManagement';
import PaymentManagement from '@/components/PaymentManagement';
interface Notification {
  id: string;
  message: string;
  type: 'CHECK_IN' | 'PICK_UP';
  read: boolean;
  timestamp: string;
}

interface PresentChild {
  id: string;
  name: string;
  parentName: string;
}



type Language = 'en' | 'ar';

const translations = {
  en: {
    dashboard: "Dashboard",
    children: "Children",
    attendance: "Attendance",
    parents: "Parents",
    switchLanguage: "العربية",
    notificationTitle: "Notifications",
    clearAll: "Clear All",
    markAllAsRead: "Mark all as read",
    noNotifications: "No notifications",
    checkedIn: "checked in",
    pickedUp: "picked up",
    by: "by",
    present: "Present Children",
    recent: "Recent Activities",
    // Added missing translations
    dashboardOverview: "Dashboard Overview",
    recentActivities: "Recent Activities",
    pickedUpBy: "Picked up by",
    presentChildren: "Present Children",
    checkInQRCode: "Check-in QR Code",
    totalChildren: "Total Children",
    activeChildren: "Active Children",
    totalParents: "Total Parents",
    todayAttendance: "Today's Attendance",
    generateQR: "Generate QR Code",
    scanQR: "Scan QR Code",
    pickupRequests: "Pickup Requests",
    attendanceHistory: "Attendance History",
    viewAll: "View All",
    status: "Status",
    time: "Time",
    date: "Date",
    actions: "Actions",
    pickup: "Pickup Management",
    payments: "Payments & Accounting",
    totalAmount: "Total Amount",
    paidAmount: "Paid Amount",
    remainingAmount: "Remaining Amount",
    installments: "Installments",
    dueDate: "Due Date",
    paymentStatus: "Payment Status",
    addPayment: "Add Payment",
    addInstallment: "Add Installment",
    editPayment: "Edit Payment",
    paymentHistory: "Payment History",
    receiptNumber: "Receipt Number",
    paymentDate: "Payment Date",
    amount: "Amount",
    description: "Description",
    paid: "Paid",
    pending: "Pending",
    overdue: "Overdue",
    searchChild: "Search Child",
  },
  ar: {
    dashboard: "لوحة التحكم",
    children: "الأطفال",
    attendance: "الحضور والانصراف",
    parents: "أولياء الأمور",
    switchLanguage: "English",
    notificationTitle: "الإشعارات",
    clearAll: "مسح الكل",
    markAllAsRead: "تعليم الكل كمقروء",
    noNotifications: "لا توجد إشعارات",
    checkedIn: "تم تسجيل حضور",
    pickedUp: "تم استلام",
    pickupRequests: "طلبات استلام الاطفال",
    by: "بواسطة",
    present: "الأطفال الحاضرون",
    recent: "النشاطات الأخيرة",
    // Added missing translations
    dashboardOverview: "نظرة عامة على لوحة التحكم",
    recentActivities: "النشاطات الأخيرة",
    pickedUpBy: "تم الاستلام بواسطة",
    presentChildren: "الأطفال الحاضرون",
    checkInQRCode: "رمز QR للحضور",
    totalChildren: "إجمالي الأطفال",
    activeChildren: "الأطفال النشطون",
    totalParents: "إجمالي أولياء الأمور",
    todayAttendance: "الحضور اليوم",
    generateQR: "إنشاء رمز QR",
    scanQR: "مسح رمز QR",
    attendanceHistory: "سجل الحضور",
    viewAll: "عرض الكل",
    status: "الحالة",
    time: "الوقت",
    date: "التاريخ",
    actions: "الإجراءات",
    pickup: "إدارة الاستلام",
    payments: "المدفوعات والحسابات",
    totalAmount: "المبلغ الإجمالي",
    paidAmount: "المبلغ المدفوع",
    remainingAmount: "المبلغ المتبقي",
    installments: "الأقساط",
    dueDate: "تاريخ الاستحقاق",
    paymentStatus: "حالة الدفع",
    addPayment: "إضافة دفعة",
    addInstallment: "إضافة قسط",
    editPayment: "تعديل الدفعة",
    paymentHistory: "سجل المدفوعات",
    receiptNumber: "رقم الإيصال",
    paymentDate: "تاريخ الدفع",
    amount: "المبلغ",
    description: "الوصف",
    paid: "مدفوع",
    pending: "معلق",
    overdue: "متأخر",
    searchChild: "بحث عن طفل",
  }
};



export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [presentChildren, setPresentChildren] = useState<PresentChild[]>([]);
  const processedIds = useRef(new Set<string>());
  const [language, setLanguage] = useState<Language>('en');

  const t = translations[language];

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();
  
      // Update notifications
      if (data.recentActivities?.length > 0) {
        const newActivities = data.recentActivities
          .filter((activity: any) => !processedIds.current.has(activity.id))
          .map((activity: any) => {
            processedIds.current.add(activity.id);
            return {
              id: activity.id,
              message: language === 'ar' 
                ? `${activity.childName} ${activity.type === 'CHECK_IN' ? t.checkedIn : t.pickedUp} ${t.by} ${activity.parentName}`
                : `${activity.childName} has been ${activity.type === 'CHECK_IN' ? t.checkedIn : t.pickedUp} ${t.by} ${activity.parentName}`,
              type: activity.type,
              read: false,
              timestamp: new Date().toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Baghdad',
              }),
            };
          });

        if (newActivities.length > 0) {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const uniqueNewActivities = newActivities.filter((n) => !existingIds.has(n.id));
            const allNotifications = [...uniqueNewActivities, ...prev];
            return allNotifications.slice(0, 50);
          });

          // Handle desktop notifications
          if ('Notification' in window) {
            if (Notification.permission === 'granted') {
              newActivities.forEach((activity) => {
                new Notification('KinderPickup', {
                  body: activity.message,
                  icon: '/favicon.ico',
                });
              });
              // Play sound only if there are new notifications
              try {
                const audio = new Audio('/notification.mp3');
                await audio.play();
              } catch (error) {
                console.warn('Failed to play notification sound:', error);
              }
            } else if (Notification.permission !== 'denied') {
              const permission = await Notification.requestPermission();
              if (permission === 'granted') {
                newActivities.forEach((activity) => {
                  new Notification('KinderPickup', {
                    body: activity.message,
                    icon: '/favicon.ico',
                  });
                });
              }
            }
          }
        }
      }

      // Update present children
      if (data.presentChildren) {
        setPresentChildren(data.presentChildren);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  // Initialize notifications and request permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    fetchDashboardData();
  }, []);

  // Set up polling interval
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 30000);
    return () => {
      clearInterval(interval);
      processedIds.current.clear();
    };
  }, []);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
    processedIds.current.clear();
  };

   return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-8 right-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
        </div>
      </div>

{/* Language Switcher */}
<button
  onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
  className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} bg-white/80 p-2 rounded-full hover:bg-white transition-all duration-200 z-50 flex items-center gap-2 shadow-md`} // Changed z-10 to z-50
>
  <Globe className="h-5 w-5 text-pink-500" />
  <span className="text-sm font-medium text-pink-500">
    {t.switchLanguage}
  </span>
</button>

      <Layout>
        
        <Card className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.1)] border-4 border-pink-200">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-comic transform hover:scale-105 ${
                    activeTab === 'dashboard'
                      ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg'
                      : 'bg-white/80 hover:bg-white text-gray-700 border-2 border-pink-200'
                  }`}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  {t.dashboard}
                </button>
                <button
                  onClick={() => setActiveTab('children')}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-comic transform hover:scale-105 ${
                    activeTab === 'children'
                      ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg'
                      : 'bg-white/80 hover:bg-white text-gray-700 border-2 border-pink-200'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  {t.children}
                </button>
                <button
                  onClick={() => setActiveTab('parents')}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-comic transform hover:scale-105 ${
                    activeTab === 'parents'
                      ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg'
                      : 'bg-white/80 hover:bg-white text-gray-700 border-2 border-pink-200'
                  }`}
                >
                  <UserSquare2 className="h-5 w-5" />
                  {t.parents}
                </button>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-comic transform hover:scale-105 ${
                    activeTab === 'attendance'
                      ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg'
                      : 'bg-white/80 hover:bg-white text-gray-700 border-2 border-pink-200'
                  }`}
                >
                  <Calendar className="h-5 w-5" />
                  {t.attendance}
                </button>
                <button
                onClick={() => setActiveTab('pickup')}
                className={`px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-comic transform hover:scale-105 ${
                  activeTab === 'pickup'
                    ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg'
                    : 'bg-white/80 hover:bg-white text-gray-700 border-2 border-pink-200'
                }`}
              >
                <UserMinus className="h-5 w-5" />
                {t.pickup}
              </button>
              <button
  onClick={() => setActiveTab('payments')}
  className={`px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-comic transform hover:scale-105 ${
    activeTab === 'payments'
      ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg'
      : 'bg-white/80 hover:bg-white text-gray-700 border-2 border-pink-200'
  }`}
>
  <CreditCard className="h-5 w-5" />
  {t.payments}
</button>
              
              </div>

            </div>

            <div className="mt-6">
            {activeTab === 'pickup' && <PickupManagement language={language} />}
            {activeTab === 'payments' && <PaymentManagement language={language} />}
              {activeTab === 'dashboard' && (
                <AdminDashboard 
                  presentChildren={presentChildren}
                  onNotificationUpdate={setNotifications}
                  language={language}
                />
              )}
              {activeTab === 'children' && <ChildrenList language={language} />}
              {activeTab === 'parents' && <ParentList language={language} />}
              {activeTab === 'attendance' && <AttendanceManagement language={language} />}
            </div>
          </div>
        </Card>
      </Layout>

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-6000 {
          animation-delay: 6s;
        }
        .font-comic {
          font-family: 'Comic Sans MS', cursive, sans-serif;
        }
      `}</style>
    </div>
  );
}
