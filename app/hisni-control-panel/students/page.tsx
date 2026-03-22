"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const ADMIN_EMAIL = "admin@hisni.com";

interface Student {
  id: number; email: string; firstName?: string; lastName?: string; phone?: string;
  telegram?: string; nationality?: string; residenceCountry?: string; educationLevel?: string;
  gender?: string; registrationStatus?: string; academicYear?: string; birthDate?: string; isTeacher?: boolean;
}
interface Teacher {
  id: number; email: string; firstName?: string; lastName?: string; phone?: string;
  teacherYear?: string; teacherSubject?: string; isTeacher?: boolean;
}
interface ZoomSession {
  id: number; title: string; date: string; zoomLink: string; academicYear: string; isActive: boolean;
}

const statusMap: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:  { label: "قيد المراجعة", color: "text-yellow-700", bg: "bg-yellow-50",  border: "border-yellow-200" },
  approved: { label: "مقبول",        color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200"  },
  rejected: { label: "مرفوض",        color: "text-red-700",    bg: "bg-red-50",     border: "border-red-200"    },
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

const calcAge = (birthDate?: string) => {
  if (!birthDate) return "";
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age.toString();
};

const exportCSV = (students: Student[]) => {
  const headers = ["الاسم الكامل", "البريد الإلكتروني", "العمر", "الجنس", "المؤهل الدراسي", "الجنسية", "بلد الإقامة", "الهاتف", "السنة الدراسية", "حالة التسجيل"];
  const rows = students.map(s => [
    `${s.firstName || ""} ${s.lastName || ""}`.trim(), s.email, calcAge(s.birthDate),
    genderMap[s.gender || ""] || s.gender || "", educationMap[s.educationLevel || ""] || s.educationLevel || "",
    s.nationality || "", s.residenceCountry || "", s.phone || "",
    yearMap[s.academicYear || ""] || s.academicYear || "",
    statusMap[s.registrationStatus || "pending"]?.label || "",
  ]);
  const BOM = "\uFEFF";
  const csv = BOM + [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `طلاب_معهد_الحصني_${new Date().toLocaleDateString("ar-SA").replace(/\//g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

type Tab = "overview" | "students" | "teachers" | "sessions";
const sidebarItems: { id: Tab; label: string; icon: string }[] = [
  { id: "overview",  label: "نظرة عامة",   icon: "📊" },
  { id: "students",  label: "الطلاب",       icon: "👥" },
  { id: "teachers",  label: "المدرسون",     icon: "👨‍🏫" },
  { id: "sessions",  label: "جلسات Zoom",   icon: "🎥" },
];

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition text-sm";

// مكون شريط بياني بسيط
function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--text-gray)] w-24 text-right shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-[var(--lux-black)] w-6 text-left shrink-0">{value}</span>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [filter, setFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [updating, setUpdating] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [showMsgForm, setShowMsgForm] = useState(false);
  const [msgForm, setMsgForm] = useState({ subject: "", body: "" });
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgResult, setMsgResult] = useState("");

  const [sessions, setSessions] = useState<ZoomSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionForm, setSessionForm] = useState({ title: "", date: "", zoomLink: "", academicYear: "year1", isActive: true });
  const [savingSession, setSavingSession] = useState(false);
  const [sessionMsg, setSessionMsg] = useState("");
  const [editingSession, setEditingSession] = useState<ZoomSession | null>(null);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teacherMsg, setTeacherMsg] = useState("");
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherForm, setTeacherForm] = useState({ firstName: "", lastName: "", email: "", password: "", phone: "", teacherYear: "year1", teacherSubject: "" });
  const [savingTeacher, setSavingTeacher] = useState(false);

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) { setChecking(false); router.push("/login"); return; }
    fetch(`${STRAPI_URL}/api/users/me`, { headers: { Authorization: `Bearer ${jwt}` } })
      .then(r => r.json())
      .then(data => { if (data?.email === ADMIN_EMAIL) setAuthed(true); else router.push("/login"); })
      .catch(() => router.push("/login"))
      .finally(() => setChecking(false));
  }, [router]);

  useEffect(() => { if (authed) { fetchStudents(); fetchSessions(); fetchTeachers(); } }, [authed]);

  const getJwt = () => localStorage.getItem("jwt") || "";

  const sendNotification = async (params: { type: "telegram" | "email" | "both"; telegramMessage?: string; emailTo?: string; emailSubject?: string; emailBody?: string; }) => {
    try { await fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...params, jwt: getJwt() }) }); } catch { /* silent */ }
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    const res = await fetch(`${STRAPI_URL}/api/users?populate=*`, { headers: { Authorization: `Bearer ${getJwt()}` } });
    const data = await res.json();
    if (Array.isArray(data)) setStudents(data.filter((u: Student) => !u.isTeacher && u.email !== ADMIN_EMAIL));
    setLoadingStudents(false);
  };
  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    const res = await fetch(`${STRAPI_URL}/api/users?populate=*`, { headers: { Authorization: `Bearer ${getJwt()}` } });
    const data = await res.json();
    if (Array.isArray(data)) setTeachers(data.filter((u: Teacher) => u.isTeacher === true));
    setLoadingTeachers(false);
  };
  const fetchSessions = async () => {
    setLoadingSessions(true);
    const res = await fetch(`${STRAPI_URL}/api/zoom-sessions?sort=date:asc`, { headers: { Authorization: `Bearer ${getJwt()}` } });
    const data = await res.json();
    setSessions(Array.isArray(data?.data) ? data.data.map((s: ZoomSession & { documentId?: string }) => ({ id: s.id, title: s.title, date: s.date, zoomLink: s.zoomLink, academicYear: s.academicYear, isActive: s.isActive })) : []);
    setLoadingSessions(false);
  };

  const handleLogout = () => { localStorage.removeItem("jwt"); localStorage.removeItem("user"); document.cookie = "jwt=; path=/; max-age=0"; router.push("/login"); };

  const updateStudent = async (studentId: number, updates: Partial<Student>) => {
    setUpdating(true); setStatusMsg("");
    const student = students.find(s => s.id === studentId) || selected;
    const name = `${student?.firstName || ""} ${student?.lastName || ""}`.trim() || student?.email || "";
    await fetch(`${STRAPI_URL}/api/users/${studentId}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getJwt()}` }, body: JSON.stringify(updates) });
    if (updates.registrationStatus) {
      const newStatus = updates.registrationStatus;
      const tgMsg = newStatus === "approved" ? `✅ <b>تم قبول طالب</b>\n👤 ${name}\n📧 ${student?.email}\n📱 ${student?.phone || "-"}` : newStatus === "rejected" ? `❌ <b>تم رفض طالب</b>\n👤 ${name}\n📧 ${student?.email}` : `🔄 <b>إعادة للمراجعة</b>\n👤 ${name}`;
      if (student?.email && (newStatus === "approved" || newStatus === "rejected")) {
        const emailSubject = newStatus === "approved" ? "مبارك! تم قبولك في معهد الإمام الحصني" : "بشأن طلب تسجيلك في معهد الإمام الحصني";
        const emailBody = newStatus === "approved"
          ? `<div dir="rtl" style="font-family:Arial;text-align:right;padding:20px;"><h2 style="color:#C6A85B;">معهد الإمام تقي الدين الحصني</h2><p>أخي الكريم <strong>${name}</strong>،</p><p>🎉 <strong>تم قبول طلبك</strong> في المعهد.</p><a href="https://alhisnifiqh.com/login" style="background:#C6A85B;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;margin:16px 0;">تسجيل الدخول</a><p style="color:#666;font-size:14px;">— فريق معهد الإمام الحصني</p></div>`
          : `<div dir="rtl" style="font-family:Arial;text-align:right;padding:20px;"><h2 style="color:#C6A85B;">معهد الإمام تقي الدين الحصني</h2><p>أخي الكريم <strong>${name}</strong>،</p><p>نأسف، لم يتم قبول طلبك في هذه المرحلة.</p><p style="color:#666;font-size:14px;">— فريق معهد الإمام الحصني</p></div>`;
        await sendNotification({ type: "both", telegramMessage: tgMsg, emailTo: student.email, emailSubject, emailBody });
      } else { await sendNotification({ type: "telegram", telegramMessage: tgMsg }); }
      setStatusMsg("تم التحديث وإرسال الإشعارات ✓");
      setTimeout(() => setStatusMsg(""), 4000);
    }
    await fetchStudents();
    setSelected((prev) => prev ? { ...prev, ...updates } : null);
    setUpdating(false);
  };

  const sendCustomMessage = async () => {
    if (!selected || !msgForm.subject || !msgForm.body) { setMsgResult("يرجى ملء جميع الحقول"); return; }
    setSendingMsg(true);
    const name = `${selected.firstName || ""} ${selected.lastName || ""}`.trim() || selected.email;
    const emailBody = `<div dir="rtl" style="font-family:Arial;text-align:right;padding:20px;"><h2 style="color:#C6A85B;">معهد الإمام تقي الدين الحصني</h2><p>أخي الكريم <strong>${name}</strong>،</p><div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:16px 0;border-right:4px solid #C6A85B;">${msgForm.body.replace(/\n/g, "<br>")}</div><p style="color:#666;font-size:14px;">— فريق معهد الإمام الحصني</p></div>`;
    await sendNotification({ type: "both", telegramMessage: `📨 <b>رسالة للطالب</b>\n👤 ${name}\n📌 ${msgForm.subject}`, emailTo: selected.email, emailSubject: msgForm.subject, emailBody });
    setMsgResult("تم الإرسال ✓"); setMsgForm({ subject: "", body: "" });
    setTimeout(() => { setMsgResult(""); setShowMsgForm(false); }, 3000);
    setSendingMsg(false);
  };

  const saveTeacher = async () => {
    if (!teacherForm.firstName || !teacherForm.lastName || !teacherForm.email) { setTeacherMsg("يرجى ملء الاسم والإيميل"); return; }
    if (!editingTeacher && !teacherForm.password) { setTeacherMsg("كلمة المرور مطلوبة"); return; }
    setSavingTeacher(true);
    if (editingTeacher) {
      const body: Record<string, unknown> = { firstName: teacherForm.firstName, lastName: teacherForm.lastName, phone: teacherForm.phone, teacherYear: teacherForm.teacherYear, teacherSubject: teacherForm.teacherSubject, isTeacher: true };
      if (teacherForm.password) body.password = teacherForm.password;
      const res = await fetch(`${STRAPI_URL}/api/users/${editingTeacher.id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getJwt()}` }, body: JSON.stringify(body) });
      if (!res.ok) { setTeacherMsg("حدث خطأ"); setSavingTeacher(false); return; }
      setTeacherMsg("تم تعديل بيانات المدرس ✓");
    } else {
      const r = await fetch(`${STRAPI_URL}/api/auth/local/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: teacherForm.email, email: teacherForm.email, password: teacherForm.password }) });
      const rd = await r.json();
      if (!r.ok) { setTeacherMsg(rd?.error?.message || "حدث خطأ"); setSavingTeacher(false); return; }
      await fetch(`${STRAPI_URL}/api/users/${rd.user.id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getJwt()}` }, body: JSON.stringify({ firstName: teacherForm.firstName, lastName: teacherForm.lastName, phone: teacherForm.phone, isTeacher: true, teacherYear: teacherForm.teacherYear, teacherSubject: teacherForm.teacherSubject }) });
      setTeacherMsg("تم إنشاء حساب المدرس ✓");
    }
    setTeacherForm({ firstName: "", lastName: "", email: "", password: "", phone: "", teacherYear: "year1", teacherSubject: "" });
    setEditingTeacher(null); setShowTeacherForm(false); await fetchTeachers(); setSavingTeacher(false);
    setTimeout(() => setTeacherMsg(""), 4000);
  };

  const deleteTeacher = async (teacher: Teacher) => {
    if (!confirm(`حذف ${teacher.firstName || teacher.email}؟`)) return;
    await fetch(`${STRAPI_URL}/api/users/${teacher.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getJwt()}` } });
    await fetchTeachers();
  };

  const saveSession = async () => {
    if (!sessionForm.title || !sessionForm.date || !sessionForm.zoomLink) { setSessionMsg("يرجى ملء جميع الحقول"); return; }
    setSavingSession(true);
    const url = editingSession ? `${STRAPI_URL}/api/zoom-sessions/${editingSession.id}` : `${STRAPI_URL}/api/zoom-sessions`;
    await fetch(url, { method: editingSession ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getJwt()}` }, body: JSON.stringify({ data: sessionForm }) });
    setSessionMsg(editingSession ? "تم التعديل ✓" : "تمت الإضافة ✓");
    setSessionForm({ title: "", date: "", zoomLink: "", academicYear: "year1", isActive: true });
    setEditingSession(null); await fetchSessions(); setSavingSession(false);
    setTimeout(() => setSessionMsg(""), 3000);
  };

  const deleteSession = async (id: number) => {
    if (!confirm("حذف هذه الجلسة؟")) return;
    await fetch(`${STRAPI_URL}/api/zoom-sessions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getJwt()}` } });
    await fetchSessions();
  };

  const filtered = students.filter(s => {
    const mf = filter === "all" || s.registrationStatus === filter;
    const yf = yearFilter === "all" || s.academicYear === yearFilter;
    return mf && yf && `${s.firstName || ""} ${s.lastName || ""} ${s.email}`.toLowerCase().includes(search.toLowerCase());
  });

  // إحصائيات للتقارير
  const approvedCount = students.filter(s => s.registrationStatus === "approved").length;
  const pendingCount = students.filter(s => s.registrationStatus === "pending").length;
  const rejectedCount = students.filter(s => s.registrationStatus === "rejected").length;
  const upcomingSessions = sessions.filter(s => new Date(s.date) >= new Date()).length;

  if (checking) return <main className="min-h-screen bg-[var(--lux-black)] flex items-center justify-center"><div className="text-[var(--gold)]">جاري التحقق...</div></main>;
  if (!authed) return null;

  const pageTitle = sidebarItems.find(i => i.id === activeTab);

  return (
    <div className="min-h-screen bg-[var(--soft-white)] flex flex-col" dir="rtl">

      {/* Header */}
      <header className="bg-[var(--lux-black)] border-b border-[var(--gold)]/20 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(v => !v)} className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="text-[var(--gold)] font-bold text-sm hidden md:block">معهد الإمام تقي الدين الحصني</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-semibold">لوحة الإدارة</p>
            <p className="text-[var(--gold)]/70 text-xs">المدير العام</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[var(--gold)] flex items-center justify-center text-black font-bold text-sm">م</div>
        </div>
      </header>

      <div className="flex flex-1">
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-16 h-[calc(100vh-4rem)] w-64 bg-[var(--lux-black)] border-l border-[var(--gold)]/10 flex flex-col z-30 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
          <div className="p-5 border-b border-[var(--gold)]/10">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-[var(--gold)] font-bold text-xl">{students.length}</p>
                <p className="text-white/50 text-xs mt-0.5">طالب</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-yellow-400 font-bold text-xl">{pendingCount}</p>
                <p className="text-white/50 text-xs mt-0.5">بانتظار</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-green-400 font-bold text-xl">{approvedCount}</p>
                <p className="text-white/50 text-xs mt-0.5">مقبول</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-purple-400 font-bold text-xl">{teachers.length}</p>
                <p className="text-white/50 text-xs mt-0.5">مدرس</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 overflow-y-auto">
            <p className="text-[var(--gold)]/40 text-xs font-medium px-3 mb-2">القائمة الرئيسية</p>
            {sidebarItems.map((item) => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); setSelected(null); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition mb-1 text-right ${activeTab === item.id ? "bg-[var(--gold)] text-black" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
                <span>{item.icon}</span>
                {item.label}
                {item.id === "students" && pendingCount > 0 && (
                  <span className={`mr-auto text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === item.id ? "bg-black/20 text-black" : "bg-yellow-400 text-black"}`}>{pendingCount}</span>
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

        {/* Main */}
        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-[var(--lux-black)]">{pageTitle?.icon} {pageTitle?.label}</h1>
            <p className="text-[var(--text-gray)] text-sm">معهد الإمام تقي الدين الحصني</p>
          </div>

          {/* ===== نظرة عامة ===== */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "إجمالي الطلاب", value: students.length, icon: "👥", color: "text-[var(--gold)]", bg: "bg-[var(--gold)]/10" },
                  { label: "قيد المراجعة", value: pendingCount, icon: "⏳", color: "text-yellow-600", bg: "bg-yellow-50" },
                  { label: "مقبولون", value: approvedCount, icon: "✅", color: "text-green-600", bg: "bg-green-50" },
                  { label: "جلسات قادمة", value: upcomingSessions, icon: "🎥", color: "text-blue-600", bg: "bg-blue-50" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3 text-xl`}>{stat.icon}</div>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[var(--text-gray)] text-sm mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* توزيع الحالات */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-[var(--lux-black)] mb-4">📊 توزيع حالات الطلاب</h3>
                  <div className="space-y-3">
                    <Bar label="مقبول" value={approvedCount} max={students.length} color="bg-green-500" />
                    <Bar label="قيد المراجعة" value={pendingCount} max={students.length} color="bg-yellow-400" />
                    <Bar label="مرفوض" value={rejectedCount} max={students.length} color="bg-red-400" />
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs text-[var(--text-gray)]">
                    <span>نسبة القبول: <strong className="text-green-600">{students.length > 0 ? Math.round((approvedCount / students.length) * 100) : 0}%</strong></span>
                    <span>الإجمالي: <strong>{students.length}</strong></span>
                  </div>
                </div>

                {/* توزيع السنوات */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-[var(--lux-black)] mb-4">📚 توزيع السنوات الدراسية</h3>
                  <div className="space-y-3">
                    {Object.entries(yearMap).map(([key, label]) => {
                      const count = students.filter(s => s.academicYear === key).length;
                      return <Bar key={key} label={label} value={count} max={students.length} color="bg-[var(--gold)]" />;
                    })}
                  </div>
                </div>

                {/* الجنسيات */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-[var(--lux-black)] mb-4">🌍 أبرز الجنسيات</h3>
                  <div className="space-y-3">
                    {(() => {
                      const nat: Record<string, number> = {};
                      students.forEach(s => { if (s.nationality) nat[s.nationality] = (nat[s.nationality] || 0) + 1; });
                      return Object.entries(nat).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, c]) => (
                        <Bar key={n} label={n} value={c} max={students.length} color="bg-blue-400" />
                      ));
                    })()}
                    {students.filter(s => !s.nationality).length > 0 && (
                      <Bar label="غير محدد" value={students.filter(s => !s.nationality).length} max={students.length} color="bg-gray-300" />
                    )}
                  </div>
                </div>

                {/* الجلسات القادمة */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-[var(--lux-black)] mb-4">🗓️ الجلسات القادمة</h3>
                  {sessions.filter(s => new Date(s.date) >= new Date()).length === 0 ? (
                    <div className="text-center py-6 text-[var(--text-gray)]">
                      <p className="text-3xl mb-2">📅</p>
                      <p className="text-sm">لا توجد جلسات قادمة</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.filter(s => new Date(s.date) >= new Date()).slice(0, 4).map(session => (
                        <div key={session.id} className="flex items-center gap-3 p-3 bg-[var(--soft-white)] rounded-xl">
                          <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center shrink-0">
                            <span className="text-sm">🎥</span>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-[var(--lux-black)] truncate">{session.title}</p>
                            <p className="text-xs text-[var(--text-gray)]">{new Date(session.date).toLocaleDateString("ar-SA", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          <span className="text-xs bg-[var(--gold)]/10 text-[var(--gold)] px-2 py-0.5 rounded-full shrink-0">{yearMap[session.academicYear]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* آخر المسجلين */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[var(--lux-black)]">🆕 آخر المسجلين</h3>
                  <button onClick={() => setActiveTab("students")} className="text-xs text-[var(--gold)] hover:underline">عرض الكل ←</button>
                </div>
                <div className="flex flex-col gap-2">
                  {students.filter(s => s.registrationStatus === "pending").slice(0, 5).map(student => {
                    const name = `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.email;
                    return (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-[var(--soft-white)] rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--lux-black)] flex items-center justify-center shrink-0">
                            <span className="text-[var(--gold)] font-bold text-xs">{name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--lux-black)]">{name}</p>
                            <p className="text-xs text-[var(--text-gray)]">{student.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { updateStudent(student.id, { registrationStatus: "approved" }); }}
                            className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition">قبول</button>
                          <button onClick={() => { setActiveTab("students"); setSelected(student); }}
                            className="text-xs border border-gray-200 text-[var(--text-gray)] px-3 py-1 rounded-lg hover:bg-gray-50 transition">تفاصيل</button>
                        </div>
                      </div>
                    );
                  })}
                  {students.filter(s => s.registrationStatus === "pending").length === 0 && (
                    <div className="text-center py-6 text-[var(--text-gray)] text-sm">لا يوجد طلبات بانتظار المراجعة 🎉</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== الطلاب ===== */}
          {activeTab === "students" && (
            <>
              <div className="flex flex-wrap gap-3 mb-5">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 بحث بالاسم أو الإيميل..."
                  className="border border-gray-200 rounded-xl px-4 py-2 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition flex-1 min-w-48 text-sm" />
                <div className="flex gap-2 flex-wrap">
                  {["all", "pending", "approved", "rejected"].map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition ${filter === f ? "bg-[var(--gold)] text-white" : "bg-white border border-gray-200 text-[var(--text-gray)]"}`}>
                      {f === "all" ? "الكل" : f === "pending" ? "⏳ بانتظار" : f === "approved" ? "✅ مقبول" : "❌ مرفوض"}
                    </button>
                  ))}
                </div>
                <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition text-xs">
                  <option value="all">كل السنوات</option>
                  {Object.entries(yearMap).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
                <button onClick={() => exportCSV(filtered)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition">📥 Excel</button>
              </div>

              <p className="text-xs text-[var(--text-gray)] mb-3">{filtered.length} نتيجة</p>

              <div className="flex gap-5">
                <div className="flex-1">
                  {loadingStudents ? <div className="text-center py-10 text-[var(--gold)]">جاري التحميل...</div>
                    : filtered.length === 0 ? <div className="text-center py-10 text-[var(--text-gray)]">لا يوجد طلاب</div>
                    : (
                      <div className="flex flex-col gap-2">
                        {filtered.map((student) => {
                          const st = statusMap[student.registrationStatus || "pending"];
                          const name = `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.email;
                          return (
                            <div key={student.id} onClick={() => { setSelected(student); setShowMsgForm(false); }}
                              className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition border-2 ${selected?.id === student.id ? "border-[var(--gold)]" : "border-transparent hover:border-gray-200"}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-[var(--lux-black)] flex items-center justify-center shrink-0">
                                    <span className="text-[var(--gold)] font-bold text-sm">{name.charAt(0)}</span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-[var(--lux-black)] text-sm">{name}</p>
                                    <p className="text-xs text-[var(--text-gray)]">{student.email}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {student.phone && <p className="text-xs text-[var(--text-gray)]">{student.phone}</p>}
                                      {student.academicYear && <span className="text-xs bg-[var(--gold)]/10 text-[var(--gold)] px-2 py-0.5 rounded-full">{yearMap[student.academicYear]}</span>}
                                      {student.nationality && <span className="text-xs text-[var(--text-gray)]">🌍 {student.nationality}</span>}
                                    </div>
                                  </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium border ${st.bg} ${st.color} ${st.border}`}>{st.label}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>

                {selected && (
                  <div className="w-72 shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-6">
                      <div className="text-center mb-4">
                        <div className="w-14 h-14 rounded-full bg-[var(--lux-black)] border-2 border-[var(--gold)] flex items-center justify-center mx-auto mb-2">
                          <span className="text-[var(--gold)] text-xl font-bold">{(`${selected.firstName || ""} ${selected.lastName || ""}`.trim() || selected.email).charAt(0)}</span>
                        </div>
                        <h3 className="font-bold text-[var(--lux-black)] text-sm">{`${selected.firstName || ""} ${selected.lastName || ""}`.trim() || selected.email}</h3>
                        <p className="text-xs text-[var(--text-gray)]">{selected.email}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block border ${statusMap[selected.registrationStatus || "pending"].bg} ${statusMap[selected.registrationStatus || "pending"].color} ${statusMap[selected.registrationStatus || "pending"].border}`}>
                          {statusMap[selected.registrationStatus || "pending"].label}
                        </span>
                      </div>

                      {statusMsg && <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg text-green-600 text-xs text-center">{statusMsg}</div>}

                      <div className="flex flex-col gap-1.5 mb-4 text-xs">
                        {selected.birthDate && <InfoRow label="العمر" value={`${calcAge(selected.birthDate)} سنة`} />}
                        {selected.gender && <InfoRow label="الجنس" value={genderMap[selected.gender] || selected.gender} />}
                        {selected.phone && <InfoRow label="الهاتف" value={selected.phone} />}
                        {selected.telegram && <InfoRow label="تليجرام" value={selected.telegram} />}
                        {selected.nationality && <InfoRow label="الجنسية" value={selected.nationality} />}
                        {selected.residenceCountry && <InfoRow label="بلد الإقامة" value={selected.residenceCountry} />}
                        {selected.educationLevel && <InfoRow label="المؤهل" value={educationMap[selected.educationLevel] || selected.educationLevel} />}
                      </div>

                      <div className="mb-3">
                        <label className="block text-xs font-medium text-[var(--text-gray)] mb-1">السنة الدراسية</label>
                        <select value={selected.academicYear || ""} onChange={(e) => updateStudent(selected.id, { academicYear: e.target.value })}
                          disabled={updating} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition text-xs">
                          <option value="">غير محدد</option>
                          {Object.entries(yearMap).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2 mb-3">
                        <button onClick={() => updateStudent(selected.id, { registrationStatus: "approved" })} disabled={updating || selected.registrationStatus === "approved"}
                          className="w-full bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-40 text-xs">✓ قبول + إشعار 📧</button>
                        <button onClick={() => updateStudent(selected.id, { registrationStatus: "rejected" })} disabled={updating || selected.registrationStatus === "rejected"}
                          className="w-full bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-40 text-xs">✗ رفض + إشعار 📧</button>
                        <button onClick={() => updateStudent(selected.id, { registrationStatus: "pending" })} disabled={updating || selected.registrationStatus === "pending"}
                          className="w-full border border-gray-200 text-[var(--text-gray)] py-2 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-40 text-xs">إعادة للمراجعة</button>
                      </div>

                      <button onClick={() => setShowMsgForm(v => !v)}
                        className="w-full border border-[var(--gold)] text-[var(--gold)] py-2 rounded-lg font-semibold hover:bg-[var(--gold)]/5 transition text-xs">
                        ✉️ رسالة مخصصة
                      </button>

                      {showMsgForm && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          {msgResult && <div className={`mb-2 p-2 rounded-lg text-xs text-center ${msgResult.includes("يرجى") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>{msgResult}</div>}
                          <div className="flex flex-col gap-2">
                            <input value={msgForm.subject} onChange={(e) => setMsgForm(p => ({ ...p, subject: e.target.value }))} placeholder="الموضوع *" className={inp} />
                            <textarea value={msgForm.body} onChange={(e) => setMsgForm(p => ({ ...p, body: e.target.value }))} placeholder="نص الرسالة *" rows={3} className={`${inp} resize-none`} />
                            <button onClick={sendCustomMessage} disabled={sendingMsg} className="w-full bg-[var(--gold)] text-white py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-60 text-xs">
                              {sendingMsg ? "جاري الإرسال..." : "إرسال 📧"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ===== المدرسون ===== */}
          {activeTab === "teachers" && (
            <div className="flex gap-5">
              <div className="flex-1">
                {teacherMsg && <div className={`mb-4 p-3 rounded-xl text-sm text-center ${teacherMsg.includes("خطأ") || teacherMsg.includes("يرجى") ? "bg-red-50 border border-red-200 text-red-600" : "bg-green-50 border border-green-200 text-green-600"}`}>{teacherMsg}</div>}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[var(--lux-black)]">قائمة المدرسين <span className="text-[var(--gold)]">({teachers.length})</span></h3>
                  <button onClick={() => { setShowTeacherForm(true); setEditingTeacher(null); setTeacherForm({ firstName: "", lastName: "", email: "", password: "", phone: "", teacherYear: "year1", teacherSubject: "" }); }}
                    className="bg-[var(--gold)] text-black px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition">+ إضافة مدرس</button>
                </div>
                {loadingTeachers ? <div className="text-center py-10 text-[var(--gold)]">جاري التحميل...</div>
                  : teachers.length === 0 ? <div className="text-center py-10 text-[var(--text-gray)]">لا يوجد مدرسون بعد</div>
                  : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {teachers.map((teacher) => {
                        const name = `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() || teacher.email;
                        const yearStudents = students.filter(s => s.academicYear === teacher.teacherYear && s.registrationStatus === "approved").length;
                        return (
                          <div key={teacher.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-[var(--gold)]/30 transition">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-[var(--lux-black)] flex items-center justify-center shrink-0 border-2 border-[var(--gold)]/30">
                                  <span className="text-[var(--gold)] font-bold">{name.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="font-bold text-[var(--lux-black)] text-sm">{name}</p>
                                  <p className="text-xs text-[var(--text-gray)]">{teacher.email}</p>
                                  {teacher.teacherSubject && <p className="text-xs text-[var(--gold)] mt-0.5">{teacher.teacherSubject}</p>}
                                  <div className="flex items-center gap-2 mt-1">
                                    {teacher.teacherYear && <span className="text-xs bg-[var(--gold)]/10 text-[var(--gold)] px-2 py-0.5 rounded-full">{yearMap[teacher.teacherYear]}</span>}
                                    <span className="text-xs text-[var(--text-gray)]">👥 {yearStudents} طالب</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5 shrink-0">
                                <button onClick={() => { setEditingTeacher(teacher); setTeacherForm({ firstName: teacher.firstName || "", lastName: teacher.lastName || "", email: teacher.email, password: "", phone: teacher.phone || "", teacherYear: teacher.teacherYear || "year1", teacherSubject: teacher.teacherSubject || "" }); setShowTeacherForm(true); }}
                                  className="text-xs border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50 transition text-[var(--text-gray)]">تعديل</button>
                                <button onClick={() => deleteTeacher(teacher)} className="text-xs border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition text-red-500">حذف</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
              {showTeacherForm && (
                <div className="w-72 shrink-0">
                  <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-6 border border-gray-100">
                    <h3 className="font-bold text-[var(--lux-black)] mb-4 text-sm">{editingTeacher ? "✏️ تعديل المدرس" : "➕ إضافة مدرس جديد"}</h3>
                    <div className="flex flex-col gap-2.5">
                      <div><label className="block text-xs text-[var(--text-gray)] mb-1">الاسم الأول *</label><input value={teacherForm.firstName} onChange={(e) => setTeacherForm(p => ({ ...p, firstName: e.target.value }))} placeholder="الاسم الأول" className={inp} /></div>
                      <div><label className="block text-xs text-[var(--text-gray)] mb-1">الاسم الأخير *</label><input value={teacherForm.lastName} onChange={(e) => setTeacherForm(p => ({ ...p, lastName: e.target.value }))} placeholder="الاسم الأخير" className={inp} /></div>
                      <div><label className="block text-xs text-[var(--text-gray)] mb-1">البريد الإلكتروني *</label><input type="email" value={teacherForm.email} onChange={(e) => setTeacherForm(p => ({ ...p, email: e.target.value }))} placeholder="teacher@example.com" className={inp} disabled={!!editingTeacher} /></div>
                      <div><label className="block text-xs text-[var(--text-gray)] mb-1">{editingTeacher ? "كلمة مرور جديدة" : "كلمة المرور *"}</label><input type="password" value={teacherForm.password} onChange={(e) => setTeacherForm(p => ({ ...p, password: e.target.value }))} placeholder="6 أحرف على الأقل" className={inp} /></div>
                      <div><label className="block text-xs text-[var(--text-gray)] mb-1">رقم الهاتف</label><input value={teacherForm.phone} onChange={(e) => setTeacherForm(p => ({ ...p, phone: e.target.value }))} placeholder="+963..." className={inp} /></div>
                      <div><label className="block text-xs text-[var(--text-gray)] mb-1">السنة الدراسية *</label>
                        <select value={teacherForm.teacherYear} onChange={(e) => setTeacherForm(p => ({ ...p, teacherYear: e.target.value }))} className={inp}>
                          {Object.entries(yearMap).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                        </select>
                      </div>
                      <div><label className="block text-xs text-[var(--text-gray)] mb-1">المادة</label><input value={teacherForm.teacherSubject} onChange={(e) => setTeacherForm(p => ({ ...p, teacherSubject: e.target.value }))} placeholder="مثال: أصول الفقه" className={inp} /></div>
                      <div className="flex gap-2 mt-1">
                        <button onClick={saveTeacher} disabled={savingTeacher} className="flex-1 bg-[var(--gold)] text-black py-2 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-60 text-sm">{savingTeacher ? "..." : editingTeacher ? "حفظ" : "إنشاء"}</button>
                        <button onClick={() => { setShowTeacherForm(false); setEditingTeacher(null); }} className="border border-gray-200 text-[var(--text-gray)] px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition">إلغاء</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== الجلسات ===== */}
          {activeTab === "sessions" && (
            <div className="flex gap-5">
              <div className="w-72 shrink-0">
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                  <h3 className="font-bold text-[var(--lux-black)] mb-4 text-sm">{editingSession ? "✏️ تعديل الجلسة" : "➕ جلسة جديدة"}</h3>
                  {sessionMsg && <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg text-green-600 text-xs text-center">{sessionMsg}</div>}
                  <div className="flex flex-col gap-2.5">
                    <div><label className="block text-xs text-[var(--text-gray)] mb-1">عنوان الجلسة *</label><input value={sessionForm.title} onChange={(e) => setSessionForm(p => ({ ...p, title: e.target.value }))} placeholder="مثال: لقاء إثرائي" className={inp} /></div>
                    <div><label className="block text-xs text-[var(--text-gray)] mb-1">التاريخ والوقت *</label><input type="datetime-local" value={sessionForm.date} onChange={(e) => setSessionForm(p => ({ ...p, date: e.target.value }))} className={inp} /></div>
                    <div><label className="block text-xs text-[var(--text-gray)] mb-1">رابط Zoom *</label><input value={sessionForm.zoomLink} onChange={(e) => setSessionForm(p => ({ ...p, zoomLink: e.target.value }))} placeholder="https://zoom.us/j/..." className={inp} /></div>
                    <div><label className="block text-xs text-[var(--text-gray)] mb-1">السنة الدراسية</label>
                      <select value={sessionForm.academicYear} onChange={(e) => setSessionForm(p => ({ ...p, academicYear: e.target.value }))} className={inp}>
                        {Object.entries(yearMap).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={sessionForm.isActive} onChange={(e) => setSessionForm(p => ({ ...p, isActive: e.target.checked }))} className="accent-[var(--gold)]" /><span className="text-[var(--lux-black)]">نشطة</span></label>
                    <button onClick={saveSession} disabled={savingSession} className="w-full bg-[var(--gold)] text-black py-2 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-60 text-sm">{savingSession ? "..." : editingSession ? "حفظ التعديلات" : "إضافة الجلسة"}</button>
                    {editingSession && <button onClick={() => { setEditingSession(null); setSessionForm({ title: "", date: "", zoomLink: "", academicYear: "year1", isActive: true }); }} className="w-full border border-gray-200 text-[var(--text-gray)] py-2 rounded-xl text-sm hover:bg-gray-50 transition">إلغاء</button>}
                  </div>
                </div>
              </div>
              <div className="flex-1">
                {loadingSessions ? <div className="text-center py-10 text-[var(--gold)]">جاري التحميل...</div>
                  : sessions.length === 0 ? <div className="text-center py-10 text-[var(--text-gray)]">لا توجد جلسات بعد</div>
                  : (
                    <div className="flex flex-col gap-3">
                      {sessions.map((session) => {
                        const isPast = new Date(session.date) < new Date();
                        return (
                          <div key={session.id} className={`bg-white rounded-xl p-4 shadow-sm border ${isPast ? "border-gray-100 opacity-60" : "border-[var(--gold)]/20"}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-[var(--lux-black)] text-sm">{session.title}</p>
                                  {!session.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">مخفية</span>}
                                  {isPast && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">انتهت</span>}
                                  {!isPast && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">قادمة</span>}
                                </div>
                                <p className="text-xs text-[var(--text-gray)]">{new Date(session.date).toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs bg-[var(--gold)]/10 text-[var(--gold)] px-2 py-0.5 rounded-full">{yearMap[session.academicYear]}</span>
                                  <a href={session.zoomLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate max-w-48">{session.zoomLink}</a>
                                </div>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={() => { setEditingSession(session); setSessionForm({ title: session.title, date: session.date ? session.date.slice(0, 16) : "", zoomLink: session.zoomLink || "", academicYear: session.academicYear || "year1", isActive: session.isActive ?? true }); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                  className="text-xs border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50 transition text-[var(--text-gray)]">تعديل</button>
                                <button onClick={() => deleteSession(session.id)} className="text-xs border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition text-red-500">حذف</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
    <div className="flex items-center justify-between py-1 border-b border-gray-50">
      <span className="text-[var(--text-gray)]">{label}</span>
      <span className="font-medium text-[var(--lux-black)]">{value}</span>
    </div>
  );
}