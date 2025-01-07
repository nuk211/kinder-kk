'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

interface ChildAttendance {
  id: string;
  name: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  parentName: string;
}
interface AttendanceRecord {
  date: string;
  present: number;
  absent: number;
  total: number;
  pickUps: number;
  children: ChildAttendance[];
}
interface AttendanceStats {
  dailyStats: AttendanceRecord[];
  weeklyAverage: number;
  monthlyAverage: number;
  totalStudents: number;
  presentChildren: ChildAttendance[];
}

interface AttendanceManagementProps {
  language?: 'en' | 'ar';
}

const translations = {
  en: {
    attendanceManagement: "Attendance Management",
    week: "Week",
    month: "Month",
    totalStudents: "Total Students",
    weeklyAverage: "Weekly Average",
    monthlyAverage: "Monthly Average",
    todayPresent: "Today Present",
    attendanceTrends: "Attendance Trends",
    present: "Present",
    absent: "Absent",
    pickups: "Pick-ups",
    currentlyPresentChildren: "Currently Present Children",
    name: "Name",
    parent: "Parent",
    checkInTime: "Check-in Time",
    status: "Status",
    noChildren: "No children present at the moment",
    loading: "Loading...",
    pickedUp: "PICKED UP"
  },
  ar: {
    attendanceManagement: "إدارة الحضور",
    week: "أسبوع",
    month: "شهر",
    totalStudents: "إجمالي الطلاب",
    weeklyAverage: "المتوسط الأسبوعي",
    monthlyAverage: "المتوسط الشهري",
    todayPresent: "الحضور اليوم",
    attendanceTrends: "اتجاهات الحضور",
    present: "حاضر",
    absent: "غائب",
    pickups: "تم الاستلام",
    currentlyPresentChildren: "الأطفال الحاضرون حالياً",
    name: "الاسم",
    parent: "ولي الأمر",
    checkInTime: "وقت الحضور",
    status: "الحالة",
    noChildren: "لا يوجد أطفال حاضرون حالياً",
    loading: "جاري التحميل...",
    pickedUp: "تم الاستلام"
  }
};


const AttendanceManagement = ({ language = 'en' }: AttendanceManagementProps) => {
  const t = translations[language];
  const [dateRange, setDateRange] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [isRTL, setIsRTL] = useState(false);
  const [stats, setStats] = useState<AttendanceStats>({
    dailyStats: [],
    weeklyAverage: 0,
    monthlyAverage: 0,
    totalStudents: 0,
    presentChildren: []
  });

  // RTL detection on mount and language change
  useEffect(() => {
    const updateRTL = () => {
      const direction = document.documentElement.dir || 'ltr';
      setIsRTL(direction === 'rtl');
    };

    updateRTL();
    window.addEventListener('languagechange', updateRTL);
    return () => window.removeEventListener('languagechange', updateRTL);
  }, []);

  // Fetch data initially and setup refresh interval
  useEffect(() => {
    fetchAttendanceData();
    const interval = setInterval(fetchAttendanceData, 60000);
    return () => clearInterval(interval);
  }, [dateRange]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/children/attendance?range=${dateRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }
      const data = await response.json();

      // Process and sort the data
      const processedData = {
        ...data,
        dailyStats: (data.dailyStats || []).sort((a: AttendanceRecord, b: AttendanceRecord) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      };

      setStats({
        dailyStats: processedData.dailyStats,
        weeklyAverage: data.weeklyAverage || 0,
        monthlyAverage: data.monthlyAverage || 0,
        totalStudents: data.totalStudents || 0,
        presentChildren: data.presentChildren || []
      });
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setStats({
        dailyStats: [],
        weeklyAverage: 0,
        monthlyAverage: 0,
        totalStudents: 0,
        presentChildren: []
      });
    } finally {
      setLoading(false);
    }
  };

  const today = stats.dailyStats.length > 0 ? stats.dailyStats[stats.dailyStats.length - 1] : {
    date: new Date().toISOString().split('T')[0],
    present: 0,
    absent: 0,
    total: 0,
    pickUps: 0,
    children: []
  };

  // Prepare chart data
  const chartData = isRTL ? [...stats.dailyStats].reverse() : stats.dailyStats;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-purple-600" />
        <span className="ml-2">{t.loading}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">{t.attendanceManagement}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 rounded transition-colors ${
              dateRange === 'week' ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {t.week}
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 rounded transition-colors ${
              dateRange === 'month' ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {t.month}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-sm text-gray-500">{t.totalStudents}</p>
          <p className="text-2xl font-bold">{stats.totalStudents}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-sm text-gray-500">{t.weeklyAverage}</p>
          <p className="text-2xl font-bold">{stats.weeklyAverage}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-sm text-gray-500">{t.monthlyAverage}</p>
          <p className="text-2xl font-bold">{stats.monthlyAverage}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-sm text-gray-500">{t.todayPresent}</p>
          <p className="text-2xl font-bold">{today.present}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">{t.attendanceTrends}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ 
                top: 5, 
                right: isRTL ? 20 : 30, 
                left: isRTL ? 30 : 20, 
                bottom: 5 
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString(language === 'ar' ? 'en-GB' : 'en-US', {
                  day: '2-digit',
                  month: '2-digit',
                })}
                reversed={isRTL}
              />
              <YAxis orientation={isRTL ? "right" : "left"} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  value,
                  name === 'present' ? t.present :
                  name === 'absent' ? t.absent :
                  name === 'pickUps' ? t.pickups : name
                ]}
                labelFormatter={(label) => new Date(label).toLocaleDateString(language === 'ar' ? 'en-GB' : 'en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })}
                contentStyle={{ 
                  textAlign: isRTL ? 'right' : 'left',
                  direction: isRTL ? 'rtl' : 'ltr'
                }}
              />
              <Legend align={isRTL ? "right" : "left"} layout="horizontal" />
              <Line type="monotone" dataKey="present" stroke="#10B981" name={t.present} strokeWidth={2} />
              <Line type="monotone" dataKey="absent" stroke="#EF4444" name={t.absent} strokeWidth={2} />
              <Line type="monotone" dataKey="pickUps" stroke="#8B5CF6" name={t.pickups} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Present Children Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">{t.currentlyPresentChildren}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t.name}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t.parent}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t.checkInTime}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t.status}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.presentChildren.length > 0 ? (
                stats.presentChildren.map((child) => (
                  <tr key={child.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {child.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {child.parentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {child.checkInTime ? new Date(child.checkInTime).toLocaleTimeString(language === 'ar' ? 'en-GB' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        child.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                        child.status === 'PICKED_UP' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {child.status === 'PRESENT' ? t.present :
                         child.status === 'PICKED_UP' ? t.pickedUp :
                         child.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    {t.noChildren}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;