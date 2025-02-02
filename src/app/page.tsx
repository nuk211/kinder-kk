'use client';
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { GraduationCap, ClipboardIcon, ArrowRight, Globe } from 'lucide-react';

type Language = 'en' | 'ar';

const translations = {
  en: {
    welcome: "Welcome to",
    subtitle: "Streamlined education management system for lecturers and staff",
    forLecturers: "For Lecturers",
    forStaff: "For Staff",
    lecturerDesc: "Access your student attendance.",
    staffDesc: "Manage children, attendance, and pickup notifications efficiently and securely.",
    lecturerPortal: "Lecturer Portal",
    staffPortal: "Staff Portal",
    switchLanguage: "العربية"
  },
  ar: {
    welcome: "مرحباً بكم في",
    subtitle: "نظام إدارة تعليمي متطور للمحاضرين والموظفين",
    forLecturers: "للأساتذة",
    forStaff: "للموظفين",
    lecturerDesc: "الوصول إلى إدارة حضور الطلاب.",
    staffDesc: "إدارة الأطفال والحضور وإشعارات الاستلام بكفاءة وأمان.",
    lecturerPortal: "بوابة المحاضرين",
    staffPortal: "بوابة الموظفين",
    switchLanguage: "English"
  }
};

export default function Home() {
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-8 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 transform -rotate-12 animate-float animation-delay-2000">
          <div className="text-6xl">📚</div>
        </div>
        <div className="absolute top-40 right-10 transform rotate-12 animate-float animation-delay-4000">
          <div className="text-6xl">🎓</div>
        </div>
        <div className="absolute bottom-20 left-10 transform rotate-12 animate-float">
          <div className="text-6xl">✏️</div>
        </div>
        <div className="absolute bottom-40 right-10 transform -rotate-12 animate-float animation-delay-6000">
          <div className="text-6xl">📝</div>
        </div>
      </div>

      {/* Language Switcher */}
      <button
        onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
        className={`absolute top-20 ${language === 'ar' ? 'left-4' : 'right-4'} bg-white/80 p-2 rounded-full hover:bg-white transition-all duration-200 z-50 flex items-center gap-2 shadow-md`}
      >
        <Globe className="h-5 w-5 text-orange-500" />
        <span className="text-sm font-medium text-orange-500">
          {t.switchLanguage}
        </span>
      </button>

      <div className="relative">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16 animate-fade-up">
            <h1 className="text-5xl font-bold mb-4 transform transition-all duration-300 ease-in-out">
              {t.welcome}{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-yellow-500 to-red-500 relative inline-block animate-wave">
                SunWay
                <span className="absolute -top-6 right-0 text-3xl animate-spin-slow">✨</span>
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Lecturer Card */}
            <div className="group relative overflow-hidden transform transition-all duration-300 ease-in-out hover:translate-y-[-8px] animate-fade-up">
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border-4 border-orange-200 h-full">
                <div className="mb-6">
                  <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    <ClipboardIcon className="h-8 w-8 text-orange-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{t.forLecturers}</h2>
                  <p className="text-gray-600 mb-6 leading-relaxed h-[72px]">
                    {t.lecturerDesc}
                  </p>
                </div>
                <Link 
                  href="/lecturer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-yellow-600 transition-all duration-200 transform hover:scale-105"
                >
                  {t.lecturerPortal}
                  <ArrowRight className={`h-4 w-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
                </Link>
              </div>
            </div>

            {/* Staff Card */}
            <div className="group relative overflow-hidden transform transition-all duration-300 ease-in-out hover:translate-y-[-8px] animate-fade-up animation-delay-200">
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border-4 border-yellow-200 h-full">
                <div className="mb-6">
                  <div className="h-16 w-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    <GraduationCap className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{t.forStaff}</h2>
                  <p className="text-gray-600 mb-6 leading-relaxed h-[72px]">
                    {t.staffDesc}
                  </p>
                </div>
                <Link 
                  href="/admin"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105"
                >
                  {t.staffPortal}
                  <ArrowRight className={`h-4 w-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        @keyframes fade-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-wave {
          animation: wave 3s ease-in-out infinite;
        }
        .animate-fade-up {
          animation: fade-up 0.5s ease-out forwards;
        }
        .animate-spin-slow {
          animation: spin 4s linear infinite;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
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
      `}</style>
    </main>
  );
}