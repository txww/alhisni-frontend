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
interface Session {
  id: number; title: string; date: string; zoom_link: string; section_id: number; is_active: boolean;
  attended?: boolean;
}
interface SectionTeacher {
  teacher_id: number; subject?: string; first_name?: string; last_name?: string; email?: string;
}
interface SectionInfo {
  id: number; name: string; academic_year: string; level?: string;
  teachers?: SectionTeacher[];
  max_students: number; student_count: number;
}
interface Lesson {
  id: number; title: string; video_url: string; section_id: number;
  subject: string; description?: string; duration?: string; order: number;
  quiz_question?: string; attended: boolean; pdf_url?: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: string; message: string }> = {
  pending:  { label: "قيد المراجعة", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-300", icon: "⏳", message: "طلبك قيد المراجعة، سيتم التواصل معك قريباً." },
  approved: { label: "مقبول", color: "text-green-600", bg: "bg-green-50", border: "border-green-300", icon: "✅", message: "مبارك! تم قبولك في المعهد." },
  rejected: { label: "مرفوض", color: "text-red-600", bg: "bg-red-50", border: "border-red-300", icon: "❌", message: "لم يتم قبول طلبك. للاستفسار تواصل مع إدارة المعهد." },
};
const educationMap: Record<string, string> = {
  primary: "ابتدائي", intermediate: "إعدادي", secondary: "ثانوي",
  university: "جامعي", postgraduate: "دراسات عليا",
};
const genderMap: Record<string, string> = { male: "ذكر", female: "أنثى" };
const dayNames: Record<number, string> = { 0: "الأحد", 1: "الإثنين", 2: "الثلاثاء", 3: "الأربعاء", 4: "الخميس", 5: "الجمعة", 6: "السبت" };

type Tab = "overview" | "schedule" | "lessons" | "profile";
const sidebarItems: { id: Tab; label: string; icon: string }[] = [
  { id: "overview",  label: "نظرة عامة",      icon: "🏠" },
  { id: "schedule",  label: "الجدول الأسبوعي", icon: "📅" },
  { id: "lessons",   label: "الدروس المسجلة", icon: "🎬" },
  { id: "profile",   label: "ملفي الشخصي",    icon: "👤" },
];

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return m ? m[1] : null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [section, setSection] = useState<SectionInfo | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // اختبار الحضور للدروس
  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizMsg, setQuizMsg] = useState("");
  const [quizSuccess, setQuizSuccess] = useState(false);
  const [watchingLesson, setWatchingLesson] = useState<Lesson | null>(null);

  // حضور الجلسات
  const [joiningSession, setJoiningSession] = useState<number | null>(null);

  const getJwt = () => localStorage.getItem("jwt") || "";

  useEffect(() => {
    const jwt = getJwt();
    if (!jwt) { setChecking(false); router.push("/login"); return; }
    fetch(`${STRAPI_URL}/api/users/me`, { headers: { Authorization: `Bearer ${jwt}` } })
      .then(r => r.json())
      .then(data => {
        if (!data?.id) { router.push("/login"); return; }
        if (data.isTeacher) { router.push("/teacher"); return; }
        setUser(data);
      })
      .catch(() => router.push("/login"))
      .finally(() => setChecking(false));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    fetchSection();
  }, [user]);

  const fetchSection = async () => {
    const res = await fetch("/api/sections/my", { headers: { Authorization: `Bearer ${getJwt()}` } });
    const data = await res.json();
    if (data?.type === "student" && data.data) {
      setSection(data.data);
      fetchLessons(data.data.id);
      fetchSessions(data.data.id);
    }
  };

  const fetchLessons = async (sectionId: number) => {
    setLoadingLessons(true);
    const res = await fetch(`/api/lessons?sectionId=${sectionId}`, { headers: { Authorization: `Bearer ${getJwt()}` } });
    const data = await res.json();
    if (Array.isArray(data?.data)) setLessons(data.data);
    setLoadingLessons(false);
  };

  const fetchSessions = async (sectionId: number) => {
    setLoadingSessions(true);
    const res = await fetch(`/api/sessions?sectionId=${sectionId}`, { headers: { Authorization: `Bearer ${getJwt()}` } });
    const data = await res.json();
    if (Array.isArray(data?.data)) setSessions(data.data);
    setLoadingSessions(false);
  };

  const canAccessLesson = (lesson: Lesson, index: number): boolean => {
    if (index === 0) return true;
    return lessons[index - 1]?.attended === true;
  };

  const submitQuiz = async () => {
    if (!quizLesson) return;
    setQuizLoading(true); setQuizMsg("");
    const res = await fetch("/api/lessons/attend", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getJwt()}` },
      body: JSON.stringify({ lessonId: quizLesson.id, answer: quizAnswer }),
    });
    const data = await res.json();
    if (!res.ok) { setQuizMsg(data.error || "إجابة خاطئة، حاول مجدداً"); setQuizSuccess(false); }
    else {
      setQuizMsg("✅ تم تأكيد حضورك!"); setQuizSuccess(true);
      if (section) fetchLessons(section.id);
      setTimeout(() => { setQuizLesson(null); setQuizAnswer(""); setQuizMsg(""); setQuizSuccess(false); }, 2000);
    }
    setQuizLoading(false);
  };

  // الانضمام للجلسة وتسجيل الحضور تلقائياً
  const joinSession = async (session: Session) => {
    setJoiningSession(session.id);
    try {
      const res = await fetch("/api/sessions/attend", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getJwt()}` },
        body: JSON.stringify({ sessionId: session.id }),
      });
      const data = await res.json();
      if (res.ok && data.zoomLink) {
        // حدّث الحضور محلياً
        setSessions(prev => prev.map(s => s.id === session.id ? { ...s, attended: true } : s));
        window.open(data.zoomLink, "_blank");
      } else {
        window.open(session.zoom_link, "_blank");
      }
    } catch {
      window.open(session.zoom_link, "_blank");
    }
    setJoiningSession(null);
  };

  const handleLogout = () => { clearSession(); router.push("/login"); };

  if (checking) return <main className="min-h-screen bg-[var(--lux-black)] flex items-center justify-center"><div className="text-[var(--gold)]">جاري التحقق...</div></main>;
  if (!user) return null;

  const status = statusConfig[user.registrationStatus || "pending"];
  const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
  const attendedCount = lessons.filter(l => l.attended).length;
  const upcomingSessions = sessions.filter(s => new Date(s.date) >= new Date());
  const pastSessions = sessions.filter(s => new Date(s.date) < new Date());

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
            <p className="text-white text-sm font-semibold">{userName}</p>
            <p className="text-[var(--gold)]/70 text-xs">{section ? section.name : "لم يتم تعيين شعبة"}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[var(--gold)] flex items-center justify-center text-black font-bold text-sm shrink-0">{userName.charAt(0)}</div>
        </div>
      </header>

      <div className="flex flex-1">
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <aside className={`fixed lg:sticky top-16 h-[calc(100vh-4rem)] w-64 bg-[var(--lux-black)] border-l border-[var(--gold)]/10 flex flex-col z-30 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
          <div className="p-5 border-b border-[var(--gold)]/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[var(--gold)]/10 border-2 border-[var(--gold)]/30 flex items-center justify-center shrink-0">
                <span className="text-[var(--gold)] text-lg font-bold">{userName.charAt(0)}</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{userName}</p>
                {section && <p className="text-[var(--gold)]/70 text-xs mt-0.5">{section.name}</p>}
                <span className={`text-xs px-2 py-0.5 rounded-full mt-0.5 inline-block border ${status.bg} ${status.color} ${status.border}`}>{status.icon} {status.label}</span>
              </div>
            </div>
            {lessons.length > 0 && (
              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white/60">تقدمك في الدروس</span>
                  <span className="text-[var(--gold)] font-bold">{attendedCount}/{lessons.length}</span>
                </div>
                <div className="bg-white/10 rounded-full h-2">
                  <div className="h-2 rounded-full bg-[var(--gold)] transition-all" style={{ width: `${lessons.length > 0 ? Math.round((attendedCount / lessons.length) * 100) : 0}%` }} />
                </div>
              </div>
            )}
          </div>
          <nav className="flex-1 p-3 overflow-y-auto">
            {sidebarItems.map((item) => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); setWatchingLesson(null); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition mb-1 text-right ${activeTab === item.id ? "bg-[var(--gold)] text-black" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
                <span>{item.icon}</span>
                {item.label}
                {item.id === "schedule" && upcomingSessions.length > 0 && (
                  <span className={`mr-auto text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === item.id ? "bg-black/20 text-black" : "bg-green-500 text-white"}`}>{upcomingSessions.length}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-[var(--gold)]/10">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition text-right"><span>🚪</span> تسجيل الخروج</button>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">

          {/* نظرة عامة */}
          {activeTab === "overview" && (
            <div className="space-y-5 max-w-2xl">
              <div className={`rounded-2xl p-5 border-2 ${status.bg} ${status.border}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{status.icon}</span>
                  <div>
                    <p className={`font-bold text-lg ${status.color}`}>{status.label}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{status.message}</p>
                  </div>
                </div>
              </div>

              {section ? (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-[var(--lux-black)] mb-4 flex items-center gap-2"><span>🏫</span> شعبتي</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--gold)] flex items-center justify-center">
                      <span className="text-black font-bold text-lg">{section.name.includes("أولى") ? "١" : "٢"}</span>
                    </div>
                    <div>
                      <p className="font-bold text-[var(--lux-black)]">{section.name}</p>
                      {section.level && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{section.level}</span>}
                    </div>
                  </div>
                  {section.teachers && section.teachers.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[var(--text-gray)] mb-2">المدرسون</p>
                      <div className="space-y-2">
                        {section.teachers.map(t => (
                          <div key={t.teacher_id} className="flex items-center gap-3 p-2.5 bg-[var(--soft-white)] rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-[var(--lux-black)] flex items-center justify-center shrink-0">
                              <span className="text-[var(--gold)] text-xs font-bold">{(t.first_name || "م").charAt(0)}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[var(--lux-black)]">{t.first_name} {t.last_name}</p>
                              {t.subject && <p className="text-xs text-[var(--gold)]">{t.subject}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
                  <p className="text-4xl mb-2">🏫</p>
                  <p className="font-semibold text-[var(--lux-black)]">لم يتم تعيينك في شعبة بعد</p>
                  <p className="text-sm text-[var(--text-gray)] mt-1">تواصل مع إدارة المعهد</p>
                </div>
              )}

              {lessons.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-[var(--lux-black)] mb-4 flex items-center gap-2"><span>📈</span> تقدمك</h3>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-[var(--text-gray)]">الدروس المكتملة</span>
                    <span className="font-bold text-[var(--gold)]">{attendedCount} / {lessons.length}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-3 mb-3">
                    <div className="h-3 rounded-full bg-[var(--gold)] transition-all" style={{ width: `${Math.round((attendedCount / lessons.length) * 100)}%` }} />
                  </div>
                  <button onClick={() => setActiveTab("lessons")} className="text-sm text-[var(--gold)] hover:underline">عرض جميع الدروس ←</button>
                </div>
              )}

              {upcomingSessions.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-[var(--lux-black)] mb-4 flex items-center gap-2"><span>📅</span> الجلسات القادمة</h3>
                  <div className="space-y-3">
                    {upcomingSessions.slice(0, 3).map(session => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-[var(--soft-white)] rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-[var(--lux-black)]">{session.title}</p>
                          <p className="text-xs text-[var(--text-gray)]">{dayNames[new Date(session.date).getDay()]} — {new Date(session.date).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                        <button onClick={() => joinSession(session)} disabled={joiningSession === session.id}
                          className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition font-medium disabled:opacity-50">
                          {joiningSession === session.id ? "..." : "انضم 📡"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* الجدول الأسبوعي */}
          {activeTab === "schedule" && (
            <div className="max-w-2xl space-y-4">
              <h2 className="text-xl font-bold text-[var(--lux-black)]">📅 الجدول الأسبوعي</h2>
              {section && <p className="text-[var(--text-gray)] text-sm">{section.name} — كل الدروس الساعة 9 مساءً</p>}

              {loadingSessions ? <div className="text-center py-10 text-[var(--gold)]">جاري التحميل...</div>
                : sessions.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl">
                    <p className="text-4xl mb-3">📅</p>
                    <p className="font-semibold text-[var(--lux-black)]">لا توجد جلسات بعد</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {sessions.map(session => {
                      const isPast = new Date(session.date) < new Date();
                      const dayName = dayNames[new Date(session.date).getDay()];
                      return (
                        <div key={session.id} className={`bg-white rounded-xl p-4 shadow-sm border-2 transition ${session.attended ? "border-green-200" : isPast ? "border-gray-100 opacity-70" : "border-[var(--gold)]/20"}`}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${session.attended ? "bg-green-500 text-white" : isPast ? "bg-gray-100 text-gray-500" : "bg-[var(--gold)]/10 text-[var(--gold)]"}`}>
                                {session.attended ? "✓" : dayName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-[var(--lux-black)] text-sm">{session.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-[var(--text-gray)]">{dayName}</span>
                                  <span className="text-xs text-[var(--text-gray)]">•</span>
                                  <span className="text-xs text-[var(--text-gray)]">{new Date(session.date).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>
                                  {session.attended && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ حضرت</span>}
                                  {!isPast && !session.attended && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">قادمة</span>}
                                  {isPast && !session.attended && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">انتهت</span>}
                                </div>
                              </div>
                            </div>
                            {!isPast && (
                              <button onClick={() => joinSession(session)} disabled={joiningSession === session.id}
                                className={`shrink-0 text-xs px-4 py-2 rounded-lg font-medium transition ${session.attended ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-[var(--gold)] text-black hover:opacity-90"} disabled:opacity-50`}>
                                {joiningSession === session.id ? "..." : session.attended ? "دخول مجدداً" : "انضم الآن 📡"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* إحصائيات الحضور */}
              {sessions.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-[var(--lux-black)] mb-3">📊 إحصائيات حضورك</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-green-50 rounded-xl">
                      <p className="text-2xl font-bold text-green-600">{sessions.filter(s => s.attended).length}</p>
                      <p className="text-xs text-green-600 mt-0.5">حضرت</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-xl">
                      <p className="text-2xl font-bold text-red-500">{pastSessions.filter(s => !s.attended).length}</p>
                      <p className="text-xs text-red-500 mt-0.5">غبت</p>
                    </div>
                    <div className="text-center p-3 bg-[var(--gold)]/10 rounded-xl">
                      <p className="text-2xl font-bold text-[var(--gold)]">{upcomingSessions.length}</p>
                      <p className="text-xs text-[var(--gold)] mt-0.5">قادمة</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* الدروس المسجلة */}
          {activeTab === "lessons" && (
            <div className="max-w-3xl">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-[var(--lux-black)]">🎬 الدروس المسجلة</h2>
                {section && <p className="text-[var(--text-gray)] text-sm mt-0.5">{section.name}</p>}
              </div>

              {watchingLesson && (
                <div className="mb-6 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  <div className="aspect-video bg-black">
                    {getYouTubeId(watchingLesson.video_url) ? (
                      <iframe src={`https://www.youtube.com/embed/${getYouTubeId(watchingLesson.video_url)}`} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                    ) : (
                      <video src={watchingLesson.video_url} controls className="w-full h-full" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-[var(--lux-black)]">{watchingLesson.title}</h3>
                        {watchingLesson.subject && <p className="text-xs text-[var(--gold)] mt-0.5">{watchingLesson.subject}</p>}
                        {watchingLesson.description && <p className="text-sm text-[var(--text-gray)] mt-1">{watchingLesson.description}</p>}
                        {watchingLesson.pdf_url && (
                          <a href={watchingLesson.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-2 text-sm bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition font-medium">
                            📄 تحميل المقرر PDF
                          </a>
                        )}
                      </div>
                      <button onClick={() => setWatchingLesson(null)} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-[var(--text-gray)] hover:bg-gray-50 transition shrink-0">إغلاق</button>
                    </div>
                    {!watchingLesson.attended && watchingLesson.quiz_question && (
                      <div className="mt-4 p-4 bg-[var(--gold)]/5 border border-[var(--gold)]/20 rounded-xl">
                        <p className="text-sm font-bold text-[var(--lux-black)] mb-1">📝 اختبار تأكيد الحضور</p>
                        <p className="text-sm text-[var(--lux-black)] mb-3">{watchingLesson.quiz_question}</p>
                        {quizLesson?.id !== watchingLesson.id ? (
                          <button onClick={() => { setQuizLesson(watchingLesson); setQuizAnswer(""); setQuizMsg(""); }} className="text-sm bg-[var(--gold)] text-black px-4 py-2 rounded-xl font-bold hover:opacity-90 transition">أجب للتأكيد</button>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <input value={quizAnswer} onChange={e => setQuizAnswer(e.target.value)} placeholder="اكتب إجابتك..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition text-sm" onKeyDown={e => e.key === "Enter" && submitQuiz()} />
                            {quizMsg && <p className={`text-sm font-medium ${quizSuccess ? "text-green-600" : "text-red-600"}`}>{quizMsg}</p>}
                            <div className="flex gap-2">
                              <button onClick={submitQuiz} disabled={quizLoading || !quizAnswer} className="flex-1 bg-[var(--gold)] text-black py-2 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 text-sm">{quizLoading ? "جاري التحقق..." : "تأكيد الحضور ✓"}</button>
                              <button onClick={() => setQuizLesson(null)} className="border border-gray-200 text-[var(--text-gray)] px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition">إلغاء</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {watchingLesson.attended && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-sm text-green-700 font-medium">✅ تم تأكيد حضورك لهذا الدرس</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {loadingLessons ? <div className="text-center py-10 text-[var(--gold)]">جاري التحميل...</div>
                : !section ? (
                  <div className="text-center py-16 bg-white rounded-2xl"><p className="text-4xl mb-3">🏫</p><p className="font-semibold text-[var(--lux-black)]">يجب تعيينك في شعبة أولاً</p></div>
                ) : lessons.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl"><p className="text-4xl mb-3">🎬</p><p className="font-semibold text-[var(--lux-black)]">لا توجد دروس بعد</p></div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {lessons.map((lesson, index) => {
                      const accessible = canAccessLesson(lesson, index);
                      const isWatching = watchingLesson?.id === lesson.id;
                      return (
                        <div key={lesson.id} className={`bg-white rounded-xl p-4 shadow-sm border-2 transition ${isWatching ? "border-[var(--gold)]" : accessible ? "border-gray-100 hover:border-[var(--gold)]/30" : "border-gray-100 opacity-60"}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${lesson.attended ? "bg-green-500 text-white" : accessible ? "bg-[var(--gold)] text-black" : "bg-gray-200 text-gray-500"}`}>
                              {lesson.attended ? "✓" : index + 1}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`font-semibold text-sm ${accessible ? "text-[var(--lux-black)]" : "text-gray-400"}`}>{lesson.title}</p>
                                {lesson.attended && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ مكتمل</span>}
                                {!accessible && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">🔒 مقفل</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {lesson.subject && <span className="text-xs text-[var(--gold)]">{lesson.subject}</span>}
                                {lesson.duration && <span className="text-xs text-[var(--text-gray)]">⏱ {lesson.duration}</span>}
                                {lesson.quiz_question && !lesson.attended && accessible && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">📝 يتطلب اختبار</span>}
                                {lesson.pdf_url && accessible && (
                                  <a href={lesson.pdf_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full hover:bg-blue-200 transition">📄 المقرر PDF</a>
                                )}
                              </div>
                              {!accessible && index > 0 && <p className="text-xs text-gray-400 mt-0.5">أكمل الدرس {index} أولاً</p>}
                            </div>
                            {accessible && (
                              <button onClick={() => setWatchingLesson(isWatching ? null : lesson)} className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition ${isWatching ? "bg-gray-100 text-gray-600" : "bg-[var(--gold)] text-black hover:opacity-90"}`}>
                                {isWatching ? "إغلاق" : "▶ مشاهدة"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          )}

          {/* الملف الشخصي */}
          {activeTab === "profile" && (
            <div className="max-w-lg">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-[var(--lux-black)] border-2 border-[var(--gold)] flex items-center justify-center mx-auto mb-3">
                    <span className="text-[var(--gold)] text-2xl font-bold">{userName.charAt(0)}</span>
                  </div>
                  <h2 className="font-bold text-[var(--lux-black)] text-lg">{userName}</h2>
                  <p className="text-[var(--text-gray)] text-sm">{user.email}</p>
                </div>
                <div className="space-y-2 text-sm">
                  {user.gender && <InfoRow label="الجنس" value={genderMap[user.gender] || user.gender} />}
                  {user.nationality && <InfoRow label="الجنسية" value={user.nationality} />}
                  {user.residenceCountry && <InfoRow label="بلد الإقامة" value={user.residenceCountry} />}
                  {user.educationLevel && <InfoRow label="المؤهل العلمي" value={educationMap[user.educationLevel] || user.educationLevel} />}
                  {user.phone && <InfoRow label="الهاتف" value={user.phone} />}
                  {user.telegram && <InfoRow label="تيليغرام" value={user.telegram} />}
                  {section && <InfoRow label="الشعبة" value={section.name} />}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50">
      <span className="text-[var(--text-gray)]">{label}</span>
      <span className="font-medium text-[var(--lux-black)]">{value}</span>
    </div>
  );
}
