"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  birthDate?: string;
  nationality?: string;
  residenceCountry?: string;
  educationLevel?: string;
  telegram?: string;
  registrationStatus?: string;
  academicYear?: string;
}

interface ZoomSession {
  id: number;
  title: string;
  date: string;
  zoomLink: string;
  academicYear: string;
  isActive: boolean;
}

const statusMap: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:  { label: "قيد المراجعة", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  approved: { label: "مقبول", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
  rejected: { label: "مرفوض", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
};

const yearMap: Record<string, string> = {
  year1: "السنة الأولى",
  year2: "السنة الثانية",
  year3: "السنة الثالثة",
  year4: "السنة الرابعة",
  year5: "السنة الخامسة",
};

const educationMap: Record<string, string> = {
  primary: "ابتدائي",
  intermediate: "إعدادي",
  secondary: "ثانوي",
  university: "جامعي",
  postgraduate: "دراسات عليا",
};

const genderMap: Record<string, string> = {
  male: "ذكر",
  female: "أنثى",
};

const subjectsByYear: Record<string, string[]> = {
  year1: ["الفقه", "أصول الفقه", "القواعد الفقهية", "المذهب", "النحو", "الصرف", "الإملاء", "المنطق"],
  year2: ["الفقه", "أصول الفقه", "النحو", "البلاغة", "المذهب", "الصرف"],
  year3: ["الفقه", "أصول الفقه", "النحو", "تخريج الفروع", "مصطلحات", "التزكية", "التراجم"],
  year4: ["الفقه", "أصول الفقه", "تخريج الفروع", "المقاصد", "الجدل"],
  year5: ["الفقه", "أصول الفقه", "التخريج المتقدم", "المقاصد المتقدمة"],
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ZoomSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "subjects" | "sessions" | "profile">("overview");

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) { router.push("/login"); return; }

    Promise.all([
      fetch(`${STRAPI_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      }).then((r) => r.json()),
      fetch(`${STRAPI_URL}/api/zoom-sessions?filters[isActive][$eq]=true&sort=date:asc`, {
        headers: { Authorization: `Bearer ${jwt}` },
      }).then((r) => r.ok ? r.json() : { data: [] }),
    ])
      .then(([userData, sessionsData]) => {
        if (userData?.error) {
          localStorage.removeItem("jwt");
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }
        setUser(userData);
        setSessions(
  Array.isArray(sessionsData?.data)
    ? sessionsData.data.map((s: ZoomSession) => ({
        id: s.id,
        title: s.title,
        date: s.date,
        zoomLink: s.zoomLink,
        academicYear: s.academicYear,
        isActive: s.isActive,
      }))
    : []
);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--soft-white)] flex items-center justify-center">
        <div className="text-[var(--gold)] text-xl">جاري التحميل...</div>
      </main>
    );
  }

  if (!user) return null;

  const status = statusMap[user.registrationStatus || "pending"];
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
  const yearLabel = yearMap[user.academicYear || ""] || "غير محدد";
  const subjects = subjectsByYear[user.academicYear || ""] || [];

  const mySessions = sessions.filter(s => !user.academicYear || s.academicYear === user.academicYear);
  const upcomingSessions = mySessions.filter(s => new Date(s.date) >= new Date());
  const nextSession = upcomingSessions[0];

  const tabs = [
    { id: "overview", label: "نظرة عامة", icon: "🏠" },
    { id: "subjects", label: "موادي", icon: "📚" },
    { id: "sessions", label: "الجلسات المباشرة", icon: "🎥" },
    { id: "profile", label: "ملفي", icon: "👤" },
  ] as const;

  return (
    <main className="min-h-screen bg-[var(--soft-white)]">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--lux-black)]">لوحة الطالب</h1>
            <p className="text-[var(--text-gray)] text-sm">معهد الإمام تقي الدين الحصني</p>
          </div>
          <button onClick={handleLogout} className="border border-gray-300 text-[var(--text-gray)] px-5 py-2 rounded-lg text-sm hover:bg-gray-100 transition">
            تسجيل الخروج
          </button>
        </div>

        {/* Welcome Card */}
        <div className="bg-[var(--lux-black)] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">أهلاً وسهلاً</p>
              <h2 className="text-white text-xl font-bold">{fullName}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[var(--gold)] text-sm font-medium">{yearLabel}</span>
                <span className="text-gray-600">•</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-full border-2 border-[var(--gold)] flex items-center justify-center">
              <span className="text-[var(--gold)] text-2xl font-bold">{fullName.charAt(0)}</span>
            </div>
          </div>

          {nextSession && user.registrationStatus === "approved" && (
            <div className="mt-4 bg-white/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs mb-1">الجلسة المباشرة القادمة</p>
                <p className="text-white font-semibold">{nextSession.title}</p>
                <p className="text-[var(--gold)] text-sm">
                  {new Date(nextSession.date).toLocaleDateString("ar-SA", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                    hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
              <a href={nextSession.zoomLink} target="_blank" rel="noopener noreferrer"
                className="bg-[var(--gold)] text-black px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition whitespace-nowrap">
                انضم الآن 🎥
              </a>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[var(--gold)] text-white"
                  : "bg-white text-[var(--text-gray)] hover:bg-gray-50 border border-gray-200"
              }`}>
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* نظرة عامة */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`rounded-2xl p-5 border ${status.bg} ${status.border}`}>
              <p className="text-sm text-gray-500 mb-1">حالة التسجيل</p>
              <p className={`text-xl font-bold ${status.color}`}>{status.label}</p>
              {user.registrationStatus === "pending" && <p className="text-sm text-gray-500 mt-2">طلبك قيد المراجعة، سيتم التواصل معك قريباً.</p>}
              {user.registrationStatus === "approved" && <p className="text-sm text-green-600 mt-2">مبارك! أنت طالب مقبول في المعهد.</p>}
              {user.registrationStatus === "rejected" && <p className="text-sm text-red-500 mt-2">يمكنك التواصل مع إدارة المعهد لمزيد من المعلومات.</p>}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-[var(--text-gray)] mb-1">السنة الدراسية</p>
              <p className="text-xl font-bold text-[var(--gold)]">{yearLabel}</p>
              <p className="text-sm text-[var(--text-gray)] mt-2">
                {subjects.length > 0 ? `${subjects.length} مواد مقررة` : "لم تحدد السنة بعد"}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-[var(--text-gray)] mb-1">الجلسات المباشرة القادمة</p>
              <p className="text-xl font-bold text-[var(--lux-black)]">{upcomingSessions.length}</p>
              <p className="text-sm text-[var(--text-gray)] mt-2">جلسة مجدولة</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-[var(--text-gray)] mb-1">تليجرام</p>
              <p className="text-lg font-bold text-[var(--lux-black)]">{user.telegram || "-"}</p>
              <p className="text-sm text-[var(--text-gray)] mt-2">للتواصل مع المعهد</p>
            </div>
          </div>
        )}

        {/* موادي */}
        {activeTab === "subjects" && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-[var(--lux-black)] mb-5">مواد {yearLabel}</h3>
            {subjects.length === 0 ? (
              <p className="text-[var(--text-gray)] text-center py-8">لم يتم تحديد سنتك الدراسية بعد، تواصل مع إدارة المعهد.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subjects.map((subject, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-[var(--soft-white)] rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-[var(--gold)]/10 flex items-center justify-center text-[var(--gold)] font-bold text-sm shrink-0">
                      {index + 1}
                    </div>
                    <span className="font-medium text-[var(--lux-black)]">{subject}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-5 pt-4 border-t border-gray-100 text-center">
              <a href="/study-plan" className="text-[var(--gold)] text-sm font-semibold hover:underline">
                عرض خطة الدراسة الكاملة ←
              </a>
            </div>
          </div>
        )}

        {/* الجلسات المباشرة */}
        {activeTab === "sessions" && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-[var(--lux-black)] mb-5">الجلسات المباشرة</h3>
            {user.registrationStatus !== "approved" ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">🔒</p>
                <p className="text-[var(--text-gray)]">الجلسات متاحة للطلاب المقبولين فقط.</p>
              </div>
            ) : mySessions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">📅</p>
                <p className="text-[var(--text-gray)]">لا توجد جلسات مجدولة حالياً.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {mySessions.map((session) => {
                  const isPast = new Date(session.date) < new Date();
                  return (
                    <div key={session.id} className={`rounded-xl p-4 border flex items-center justify-between ${isPast ? "bg-gray-50 border-gray-200 opacity-60" : "bg-[#fdf8ef] border-[var(--gold)]/20"}`}>
                      <div>
                        <p className="font-semibold text-[var(--lux-black)]">{session.title}</p>
                        <p className="text-sm text-[var(--text-gray)] mt-1">
                          {new Date(session.date).toLocaleDateString("ar-SA", {
                            weekday: "long", year: "numeric", month: "long", day: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                      </div>
                      {!isPast ? (
                        <a href={session.zoomLink} target="_blank" rel="noopener noreferrer"
                          className="bg-[var(--gold)] text-black px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition whitespace-nowrap">
                          انضم 🎥
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">انتهت</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ملفي */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-[var(--lux-black)] mb-5 border-b border-gray-100 pb-3">البيانات الشخصية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="الاسم الكامل" value={fullName} />
              <InfoRow label="البريد الإلكتروني" value={user.email} />
              <InfoRow label="رقم الهاتف" value={user.phone} />
              <InfoRow label="التليجرام" value={user.telegram} />
              <InfoRow label="الجنس" value={genderMap[user.gender || ""] || "-"} />
              <InfoRow label="تاريخ الميلاد" value={user.birthDate || "-"} />
              <InfoRow label="الجنسية" value={user.nationality} />
              <InfoRow label="بلد الإقامة" value={user.residenceCountry} />
              <InfoRow label="المستوى التعليمي" value={educationMap[user.educationLevel || ""] || "-"} />
              <InfoRow label="السنة الدراسية" value={yearLabel} />
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-1 p-3 bg-[var(--soft-white)] rounded-xl">
      <span className="text-xs text-[var(--text-gray)]">{label}</span>
      <span className="text-sm font-medium text-[var(--lux-black)]">{value || "-"}</span>
    </div>
  );
}