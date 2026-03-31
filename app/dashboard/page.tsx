"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

interface User {
  id: number; email: string; firstName?: string; lastName?: string; phone?: string;
  gender?: string; birthDate?: string; nationality?: string; residenceCountry?: string;
  educationLevel?: string; telegram?: string; registrationStatus?: string; academicYear?: string;
}
interface ZoomSession {
  id: number; title: string; date: string; zoomLink: string; academicYear: string; isActive: boolean;
}
interface SectionInfo {
  id: number; name: string; academic_year: string; gender: string;
  teacher_first?: string; teacher_last?: string; teacher_email?: string; teacher_phone?: string;
  max_students: number; student_count: number;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: string; message: string }> = {
  pending:  { label: "قيد المراجعة", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-300", icon: "⏳", message: "طلبك قيد المراجعة، سيتم التواصل معك قريباً." },
  approved: { label: "مقبول", color: "text-green-600", bg: "bg-green-50", border: "border-green-300", icon: "✅", message: "مبارك! تم قبولك في المعهد. يمكنك الآن الوصول إلى جميع الجلسات." },
  rejected: { label: "مرفوض", color: "text-red-600", bg: "bg-red-50", border: "border-red-300", icon: "❌", message: "لم يتم قبول طلبك. للاستفسار تواصل مع إدارة المعهد." },
};
const yearMap: Record<string, string> = {
  year1: "السنة الأولى", year2: "السنة الثانية", year3: "السنة الثالثة",
  year4: "السنة الرابعة", year5: "السنة الخامسة",
};
const educationMap: Record<string, string> = {
  primary: "ابتدائي", intermediate: "إعدادي", secondary: "ثانوي",
  university: "جامعي", postgraduate: "دراسات عليا",
};
const genderMap: Record<string, string> = { male: "ذكر", female: "أنثى" };
const subjectsByYear: Record<string, string[]> = {
  year1: ["الفقه", "أصول الفقه", "القواعد الفقهية", "المذهب", "النحو", "الصرف", "الإملاء", "المنطق"],
  year2: ["الفقه", "أصول الفقه", "النحو", "البلاغة", "المذهب", "الصرف"],
  year3: ["الفقه", "أصول الفقه", "النحو", "تخريج الفروع", "مصطلحات", "التزكية", "التراجم"],
  year4: ["الفقه", "أصول الفقه", "تخريج الفروع", "المقاصد", "الجدل"],
  year5: ["الفقه", "أصول الفقه", "التخريج المتقدم", "المقاصد المتقدمة"],
};

type Tab = "overview" | "subjects" | "sessions" | "profile";
const sidebarItems: { id: Tab; label: string; icon: string }[] = [
  { id: "overview",  label: "نظرة عامة",       icon: "🏠" },
  { id: "subjects",  label: "موادي الدراسية",   icon: "📚" },
  { id: "sessions",  label: "الجلسات المباشرة", icon: "🎥" },
  { id: "profile",   label: "ملفي الشخصي",      icon: "👤" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ZoomSession[]>([]);
  const [section, setSection] = useState<SectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) { router.push("/login"); return; }

    Promise.all([
      fetch(`${STRAPI_URL}/api/users/me`, { headers: { Authorization: `Bearer ${jwt}` } }).then(r => r.json()),
      fetch(`${STRAPI_URL}/api/zoom-sessions?filters[isActive][$eq]=true&sort=date:asc`, { headers: { Authorization: `Bearer ${jwt}` } }).then(r => r.ok ? r.json() : { data: [] }),
      fetch("/api/sections/my", { headers: { Authorization: `Bearer ${jwt}` } }).then(r => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([userData, sessionsData, sectionData]) => {
        if (userData?.error) { clearSession(); router.push("/login"); return; }
        setUser(userData);
        setSessions(Array.isArray(sessionsData?.data)
          ? sessionsData.data.map((s: ZoomSession) => ({ id: s.id, title: s.title, date: s.date, zoomLink: s.zoomLink, academicYear: s.academicYear, isActive: s.isActive }))
          : []);
        if (sectionData?.data) setSection(sectionData.data);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => { clearSession(); router.push("/login"); };

  if (loading) return (
    <main className="min-h-screen bg-[var(--soft-white)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-[var(--gold)] border-t-transparent animate-spin" />
        <p className="text-[var(--text-gray)]">جاري التحميل...</p>
      </div>
    </main>
  );
  if (!user) return null;

  const status = statusConfig[user.registrationStatus || "pending"];
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
  const yearLabel = yearMap[user.academicYear || ""] || "غير محدد";
  const subjects = subjectsByYear[user.academicYear || ""] || [];
  const mySessions = sessions.filter(s => !user.academicYear || s.academicYear === user.academicYear);
  const upcomingSessions = mySessions.filter(s => new Date(s.date) >= new Date());
  const nextSession = upcomingSessions[0];
  const teacherName = section ? `${section.teacher_first || ""} ${section.teacher_last || ""}`.trim() : null;

  return (
    <div className="min-h-screen bg-[var(--soft-white)] flex flex-col" dir="rtl">
      <header className="bg-[var(--lux-black)] border-b border-[var(--gold)]/20 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(v => !v)} className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="text-[var(--gold)] font-bold text-sm hidden md:block">معهد الإمام تقي الدين الحصني</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-semibold">{fullName}</p>
            <p className={`text-xs ${status.color}`}>{status.icon} {status.label}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[var(--gold)] flex items-center justify-center text-black font-bold text-sm shrink-0">{fullName.charAt(0)}</div>
        </div>
      </header>

      <div className="flex flex-1">
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <aside className={`fixed lg:sticky top-16 h-[calc(100vh-4rem)] w-64 bg-[var(--lux-black)] border-l border-[var(--gold)]/10 flex flex-col z-30 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
          <div className="p-5 border-b border-[var(--gold)]/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--gold)]/10 border-2 border-[var(--gold)]/30 flex items-center justify-center shrink-0">
                <span className="text-[var(--gold)] text-lg font-bold">{fullName.charAt(0)}</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-white font-semibold text-sm truncate">{fullName}</p>
                <p className="text-[var(--gold)]/70 text-xs truncate">{yearLabel}</p>
                {section && <p className="text-white/50 text-xs truncate">🏫 {section.name}</p>}
              </div>
            </div>
            <div className={`mt-3 px-3 py-1.5 rounded-lg text-xs font-medium text-center border ${status.bg} ${status.color} ${status.border}`}>
              {status.icon} {status.label}
            </div>
          </div>

          <nav className="flex-1 p-3 overflow-y-auto">
            <p className="text-[var(--gold)]/40 text-xs font-medium px-3 mb-2">القائمة الرئيسية</p>
            {sidebarItems.map((item) => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition mb-1 text-right ${activeTab === item.id ? "bg-[var(--gold)] text-black" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
                <span>{item.icon}</span>
                {item.label}
                {item.id === "sessions" && upcomingSessions.length > 0 && (
                  <span className={`mr-auto text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === item.id ? "bg-black/20 text-black" : "bg-[var(--gold)] text-black"}`}>{upcomingSessions.length}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-[var(--gold)]/10">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition text-right">
              <span>🚪</span> تسجيل الخروج
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
          {user.registrationStatus !== "approved" && (
            <div className={`rounded-2xl p-4 mb-6 border-2 ${status.bg} ${status.border} flex items-start gap-3`}>
              <span className="text-2xl">{status.icon}</span>
              <div>
                <p className={`font-bold ${status.color}`}>{status.label}</p>
                <p className={`text-sm mt-1 ${status.color} opacity-80`}>{status.message}</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h1 className="text-xl font-bold text-[var(--lux-black)]">{sidebarItems.find(i => i.id === activeTab)?.icon} {sidebarItems.find(i => i.id === activeTab)?.label}</h1>
            <p className="text-[var(--text-gray)] text-sm">معهد الإمام تقي الدين الحصني</p>
          </div>

          {/* نظرة عامة */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div className="bg-[var(--lux-black)] rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-48 h-48 bg-[var(--gold)]/5 rounded-full -translate-x-24 -translate-y-24" />
                <div className="relative">
                  <p className="text-gray-400 text-sm">أهلاً وسهلاً،</p>
                  <h2 className="text-white text-2xl font-bold mt-1">{fullName}</h2>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <p className="text-[var(--gold)] text-sm">{yearLabel}</p>
                    {section && <span className="text-white/60 text-sm">• 🏫 {section.name}</span>}
                    {teacherName && <span className="text-white/60 text-sm">• 👨‍🏫 {teacherName}</span>}
                  </div>
                </div>
                {nextSession && user.registrationStatus === "approved" && (
                  <div className="relative mt-4 bg-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-gray-400 text-xs">🔴 الجلسة القادمة</p>
                      <p className="text-white font-semibold mt-0.5">{nextSession.title}</p>
                      <p className="text-[var(--gold)] text-sm mt-0.5">{new Date(nextSession.date).toLocaleDateString("ar-SA", { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <a href={nextSession.zoomLink} target="_blank" rel="noopener noreferrer" className="bg-[var(--gold)] text-black px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition whitespace-nowrap shrink-0">انضم 🎥</a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "السنة الدراسية", value: yearLabel, icon: "📖", color: "text-[var(--gold)]" },
                  { label: "الشعبة", value: section?.name || "غير محددة", icon: "🏫", color: "text-purple-600" },
                  { label: "جلسات قادمة", value: upcomingSessions.length.toString(), icon: "🎥", color: "text-blue-600" },
                  { label: "الحالة", value: status.label, icon: status.icon, color: status.color },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                    <p className="text-2xl mb-2">{stat.icon}</p>
                    <p className={`font-bold text-sm ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-[var(--text-gray)] mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* بطاقة الشعبة والمدرس */}
              {section && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-[var(--lux-black)] mb-4">🏫 شعبتي</h3>
                  <div className="flex items-center gap-4 p-4 bg-[var(--soft-white)] rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-[var(--gold)] flex items-center justify-center shrink-0">
                      <span className="text-black text-xl">🏫</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[var(--lux-black)]">{section.name}</p>
                      <p className="text-xs text-[var(--text-gray)] mt-0.5">{yearMap[section.academic_year]} • {section.gender === "female" ? "إناث 👩" : "ذكور 👨"}</p>
                      <p className="text-xs text-[var(--text-gray)] mt-0.5">👥 {section.student_count} طالب من {section.max_students}</p>
                    </div>
                  </div>
                  {teacherName && (
                    <div className="flex items-center gap-4 p-4 bg-[var(--soft-white)] rounded-xl mt-3">
                      <div className="w-12 h-12 rounded-full bg-[var(--lux-black)] border-2 border-[var(--gold)] flex items-center justify-center shrink-0">
                        <span className="text-[var(--gold)] font-bold text-lg">{teacherName.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-bold text-[var(--lux-black)]">{teacherName}</p>
                        <p className="text-xs text-[var(--text-gray)]">👨‍🏫 مدرس الشعبة</p>
                        {section.teacher_email && <p className="text-xs text-[var(--gold)] mt-0.5">{section.teacher_email}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-[var(--lux-black)] mb-4">معلومات سريعة</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoRow label="البريد الإلكتروني" value={user.email} icon="📧" />
                  <InfoRow label="رقم الهاتف" value={user.phone} icon="📞" />
                  <InfoRow label="التليجرام" value={user.telegram} icon="✈️" />
                  <InfoRow label="الجنسية" value={user.nationality} icon="🌍" />
                </div>
              </div>
            </div>
          )}

          {/* موادي */}
          {activeTab === "subjects" && (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-[var(--lux-black)]">مواد {yearLabel}</h3>
                <span className="text-xs bg-[var(--gold)]/10 text-[var(--gold)] px-3 py-1 rounded-full font-medium">{subjects.length} مادة</span>
              </div>
              {subjects.length === 0 ? (
                <div className="text-center py-10"><p className="text-4xl mb-3">📚</p><p className="text-[var(--text-gray)]">لم يتم تحديد سنتك الدراسية بعد</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {subjects.map((subject, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-[var(--soft-white)] rounded-xl border border-gray-100 hover:border-[var(--gold)]/30 transition">
                      <div className="w-8 h-8 rounded-full bg-[var(--gold)] flex items-center justify-center text-black font-bold text-sm shrink-0">{index + 1}</div>
                      <span className="font-medium text-[var(--lux-black)]">{subject}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* الجلسات */}
          {activeTab === "sessions" && (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-[var(--lux-black)]">الجلسات المباشرة</h3>
                {upcomingSessions.length > 0 && <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">{upcomingSessions.length} جلسة قادمة</span>}
              </div>
              {user.registrationStatus !== "approved" ? (
                <div className="text-center py-10"><p className="text-4xl mb-3">🔒</p><p className="font-medium text-[var(--lux-black)]">الجلسات متاحة للطلاب المقبولين فقط</p></div>
              ) : mySessions.length === 0 ? (
                <div className="text-center py-10"><p className="text-4xl mb-3">📅</p><p className="text-[var(--text-gray)]">لا توجد جلسات مجدولة حالياً</p></div>
              ) : (
                <div className="flex flex-col gap-3">
                  {mySessions.map((session) => {
                    const isPast = new Date(session.date) < new Date();
                    return (
                      <div key={session.id} className={`rounded-xl p-4 border flex items-center justify-between gap-3 ${isPast ? "bg-gray-50 border-gray-200 opacity-60" : "bg-[#fdf8ef] border-[var(--gold)]/30"}`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[var(--lux-black)]">{session.title}</p>
                            {!isPast && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">قادمة</span>}
                          </div>
                          <p className="text-sm text-[var(--text-gray)] mt-1">{new Date(session.date).toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                        {!isPast ? (
                          <a href={session.zoomLink} target="_blank" rel="noopener noreferrer" className="bg-[var(--gold)] text-black px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition whitespace-nowrap shrink-0">انضم 🎥</a>
                        ) : (
                          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full shrink-0">انتهت</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* الملف الشخصي */}
          {activeTab === "profile" && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-full bg-[var(--lux-black)] border-2 border-[var(--gold)] flex items-center justify-center shrink-0">
                    <span className="text-[var(--gold)] text-2xl font-bold">{fullName.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--lux-black)] text-lg">{fullName}</h3>
                    <p className="text-[var(--gold)] text-sm">{yearLabel}</p>
                    {section && <p className="text-[var(--text-gray)] text-xs mt-0.5">🏫 {section.name}</p>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block border ${status.bg} ${status.color} ${status.border}`}>{status.icon} {status.label}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoRow label="الاسم الكامل" value={fullName} icon="👤" />
                  <InfoRow label="البريد الإلكتروني" value={user.email} icon="📧" />
                  <InfoRow label="رقم الهاتف" value={user.phone} icon="📞" />
                  <InfoRow label="التليجرام" value={user.telegram} icon="✈️" />
                  <InfoRow label="الجنس" value={genderMap[user.gender || ""] || "-"} icon="👥" />
                  <InfoRow label="تاريخ الميلاد" value={user.birthDate || "-"} icon="🎂" />
                  <InfoRow label="الجنسية" value={user.nationality} icon="🌍" />
                  <InfoRow label="بلد الإقامة" value={user.residenceCountry} icon="🏠" />
                  <InfoRow label="المستوى التعليمي" value={educationMap[user.educationLevel || ""] || "-"} icon="🎓" />
                  <InfoRow label="السنة الدراسية" value={yearLabel} icon="📖" />
                  {section && <InfoRow label="الشعبة" value={section.name} icon="🏫" />}
                  {teacherName && <InfoRow label="مدرس الشعبة" value={teacherName} icon="👨‍🏫" />}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value?: string; icon?: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--soft-white)] rounded-xl border border-gray-100">
      {icon && <span className="text-base shrink-0">{icon}</span>}
      <div className="overflow-hidden">
        <p className="text-xs text-[var(--text-gray)]">{label}</p>
        <p className="text-sm font-medium text-[var(--lux-black)] truncate">{value || "-"}</p>
      </div>
    </div>
  );
}