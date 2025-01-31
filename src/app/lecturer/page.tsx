'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import QRScanner from '@/components/QRScanner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, Scan, Globe, XCircle, Clock } from 'lucide-react';
import { AlertCircle, CheckCircle } from 'lucide-react'; // Add new icons
interface ScanResult {
  name: string;
  status: 'PRESENT' | 'ABSENT' | 'PICKED_UP';
  message: string;
  timestamp: string;
}

interface ScanHistory {
  id: string;
  name: string;
  status: string;
  timestamp: string;
  scanCount: number;
}

interface ScanStatus {
  success?: boolean;
  message?: string;
  children?: ScanResult[];
  loading?: boolean;
}

type Language = 'en' | 'ar';

const translations = {
  en: {
    welcome: "Welcome Teacher!",
    subtitle: "Scan your students' attendance QR codes 📚",
    loadingMessage: "Processing student code... ✨",
    success: "🎉 Attendance Recorded!",
    error: "❌ Scan Error",
    scannerGuide: "Position student's QR code in the scanner box ✨",
    present: "is present",
    absent: "is absent",
    pickedUp: "is marked for pickup",
    scanAnother: "Scan Another",
    switchLanguage: "العربية",
    lastScanned: "Recently Scanned Students:",
    noScansYet: "No students scanned yet",
    scanCount: "Scan count today",
    timeScanned: "Times scanned today",
    lastSeen: "Last seen",
    historyTitle: "Today's Scan History",
  },
  ar: {
    welcome: "!مرحباً بالمعلم",
    subtitle: "امسح رموز حضور طلابك 📚",
    loadingMessage: "...معالجة رمز الطالب ✨",
    success: "!تم تسجيل الحضور 🎉",
    error: "!خطأ في المسح ❌",
    scannerGuide: "!ضع رمز QR للطالب في مربع الماسح ✨",
    present: "حاضر",
    absent: "غائب",
    pickedUp: "تم طلب استلامه",
    scanAnother: "مسح آخر",
    switchLanguage: "English",
    lastScanned: ":الطلاب الممسوحين مؤخراً",
    noScansYet: "لم يتم مسح أي طالب بعد",
    scanCount: "عدد المسح اليوم",
    timeScanned: "مرات المسح اليوم",
    lastSeen: "آخر ظهور",
    historyTitle: "سجل المسح اليوم",
  }
};

export default function LecturerPage() {
  const { data: session } = useSession();
  const [scanStatus, setScanStatus] = useState<ScanStatus>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [scanHistory, setScanHistory] = useState<Map<string, ScanHistory>>(new Map());
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);

  const t = translations[language];
  const updateScanHistory = (child: any) => {
    if (!child || !child.id) {
      console.error('Invalid child data:', child);
      return;
    }
    
    console.log('Updating scan history for child:', child);
    setScanHistory(prevHistory => {
      const newHistory = new Map(prevHistory);
      const existingEntry = newHistory.get(child.id);
      console.log('Existing entry:', existingEntry);
      
      const newEntry = {
        id: child.id,
        name: child.name,
        status: child.status,
        timestamp: child.timestamp,
        scanCount: (existingEntry?.scanCount || 0) + 1
      };
      
      console.log('New entry:', newEntry);
      newHistory.set(child.id, newEntry);
      console.log('Updated history size:', newHistory.size);
      return newHistory;
    });
  };
  
  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return t.present;
      case 'PICKED_UP':
        return t.pickedUp;
      default:
        return t.absent;
    }
  };

  
  const handleScan = async (result: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      setScanStatus({ loading: true });
  
      const response = await fetch('/api/qr/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: result }),
      });
  
      const data = await response.json();
      console.log('API Response Data:', data); // Add this debug log
      
      if (!response.ok) throw new Error(data.error || 'Failed to validate QR code');
  
      const newScans = data.data?.children.map((child: any) => {
        console.log('Processing child:', child); // Add this debug log
        
        // Make sure we pass the ID to updateScanHistory
        updateScanHistory({
          id: child.id,
          name: child.name,
          status: child.status,
          timestamp: child.timestamp
        });
        
        return {
          name: child.name,
          status: child.status,
          message: child.message,
          timestamp: child.timestamp
        };
      });
  
      console.log('New scans:', newScans); // Add this debug log
      setRecentScans(prev => [...(newScans || []), ...prev.slice(0, 9)]);
      
      setScanStatus({
        success: true,
        message: data.message,
        children: newScans,
        loading: false
      });
    } catch (error) {
      console.error('Scan processing error:', error);
      setScanStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process QR code',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  const handleDismissAlert = () => {
    setScanStatus({});
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-blue-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Language Switcher */}
      <button
        onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
        className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} bg-white/80 p-2 rounded-full hover:bg-white transition-all duration-200 z-10 flex items-center gap-2 shadow-md`}
      >
        <Globe className="h-5 w-5 text-purple-500" />
        <span className="text-sm font-medium text-purple-500">
          {t.switchLanguage}
        </span>
      </button>

      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-8 right-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 transform -rotate-12">
          <div className="text-6xl">👩‍🏫</div>
        </div>
        <div className="absolute top-20 right-20 transform rotate-12">
          <div className="text-6xl">📚</div>
        </div>
        <div className="absolute bottom-20 left-20 transform rotate-12">
          <div className="text-6xl">✏️</div>
        </div>
        <div className="absolute bottom-10 right-10 transform -rotate-12">
          <div className="text-6xl">🎓</div>
        </div>
      </div>

      <div className="relative container mx-auto p-4 max-w-2xl">
        <div className="text-center mb-8 animate-fade-up">
          <h1 className="text-4xl font-bold mb-2 font-comic">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
              {t.welcome}
            </span>
          </h1>
          <p className="text-gray-600 font-comic">{t.subtitle}</p>
        </div>
        
        {(scanStatus.message || scanStatus.loading) && (
          <Alert 
            variant={scanStatus.success ? "default" : "destructive"} 
            className="mb-6 bg-white/90 backdrop-blur-sm border-4 border-purple-200 rounded-2xl animate-fade-up relative"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleDismissAlert}
            >
              <XCircle className="h-5 w-5" />
            </Button>
            
            {scanStatus.loading ? (
              <div className="flex items-center space-x-2 font-comic">
                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                <span>{t.loadingMessage}</span>
              </div>
            ) : (
              <>
                <AlertTitle className="font-comic text-lg">
                  {scanStatus.success ? t.success : t.error}
                </AlertTitle>
                <AlertDescription className="font-comic">
                  {scanStatus.success ? (
                    <>
                      {scanStatus.children?.map((child, index) => (
                        <div key={index} className="mb-2 p-3 bg-blue-50/50 rounded-xl border-2 border-blue-200">
                          <p className="font-medium text-blue-800">
                            {child.name} {getStatusMessage(child.status)} 🌟
                          </p>
                          <p className="text-sm text-gray-600">
                            {language === 'ar' ? 'الوقت:' : 'Time:'} {child.timestamp}
                          </p>
                        </div>
                      ))}
                      <Button
                        onClick={handleDismissAlert}
                        className="mt-4 bg-purple-500 hover:bg-purple-600"
                      >
                        {t.scanAnother}
                      </Button>
                    </>
                  ) : (
                    <p>{scanStatus.message}</p>
                  )}
                </AlertDescription>
              </>
            )}
          </Alert>
        )}

        <div className="bg-white/90 backdrop-blur-lg p-8 rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.1)] border-4 border-purple-200 animate-fade-up">
          <div className="relative">
          
<QRScanner
  onScan={(decodedText, responseData) => {
    if (responseData && responseData.data && responseData.data.children) {
      // Do not make another API call, just update UI with the received data
      const newScans = responseData.data.children.map((child: any) => ({
        name: child.name,
        status: child.status,
        message: child.message,
        timestamp: child.timestamp
      }));

      setRecentScans(prev => [...newScans, ...prev.slice(0, 9)]);
      
      // Update scan status
      setScanStatus({
        success: true,
        message: responseData.message,
        children: newScans,
        loading: false
      });
      // @ts-ignore
      // Update scan history
      if (child.id) {
        // @ts-ignore
        updateScanHistory(child);
      }
    }
  }}
  onError={(error) => {
    setScanStatus({
      success: false,
      message: error.message
    });
  }}
/>
            <div className="absolute inset-0 border-8 border-dashed border-blue-300 rounded-lg pointer-events-none animate-pulse"></div>
          </div>
          <p className="text-center text-gray-600 mt-6 font-comic flex items-center justify-center gap-2">
            <Scan className="w-5 h-5 text-purple-500" />
            {t.scannerGuide}
          </p>
        </div>

        {/* Recent Scans Section */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm p-6 rounded-2xl border-4 border-purple-200">
          <h2 className="text-xl font-bold mb-4 text-purple-700 font-comic">{t.lastScanned}</h2>
          {recentScans.length > 0 ? (
            <div className="space-y-3">
              {recentScans.map((scan, index) => (
                <div key={index} className="p-3 bg-purple-50 rounded-xl border-2 border-purple-100">
                  <p className="font-medium text-purple-800">
                    {scan.name} {getStatusMessage(scan.status)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {language === 'ar' ? 'الوقت:' : 'Time:'} {scan.timestamp}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center font-comic">{t.noScansYet}</p>
          )}
        </div>
        
      </div>
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes fade-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-fade-up {
          animation: fade-up 0.5s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
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
    </main>
  );
}