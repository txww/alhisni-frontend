"use client";

import { useEffect, useState } from "react";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const ALLOWED_TEACHERS = ["teacher@hisni.com"]; // أضف إيميلات المدرسين هنا

interface ZoomSession {
  id: number;
  documentId?: string;
  title: string;
  date: string;
  zoomLink: string;
  academicYear: string;
  isActive: boolean;
}

const yearMap: Record<string, string> = {
  year1: "السنة الأولى",
  year2: "السنة الثانية",
  year3: "السنة الثالثة",
  year4: "السنة الرابعة",
  year5: "السنة الخامسة",
};

export default function TeacherPage() {
  const [authed, setAuthed] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [teacherJwt, setTeacherJwt] = useState("");

  const [sessions, setSessions] = useState<ZoomSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"sessions" | "add">("sessions");

  const [sessionForm, setSessionForm] = useState({
    title: "", date: "", zoomLink: "", academicYear: "year1", isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [editingSession, setEditingSession] = useState<ZoomSession | null>(null);

  useEffect(() => {
    const jwt = localStorage.getItem("teacherJwt");
    const email = localStorage.getItem("teacherEmail");
    if (jwt && email && ALLOWED_TEACHERS.includes(email)) {
      setTeacherJwt(jwt);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchSessions();
  }, [authed]);

  const handleLogin = async () => {
    if (!ALLOWED_TEACHERS.includes(loginForm.email)) {
      setLoginError("هذا الحساب غير مصرح له بالدخول كمدرس");
      return;
    }
    const res = await fetch(`${STRAPI_URL}/api/auth/local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: loginForm.email, password: loginForm.password }),
    });
    const data = await res.json();
    if (!res.ok) { setLoginError("البريد الإلكتروني أو كلمة المرور غير صحيحة"); return; }
    localStorage.setItem("teacherJwt", data.jwt);
    localStorage.setItem("teacherEmail", loginForm.email);
    setTeacherJwt(data.jwt);
    setAuthed(true);
  };

  const fetchSessions = async () => {
    setLoading(true);
    const jwt = localStorage.getItem("teacherJwt");
    const res = await fetch(`${STRAPI_URL}/api/zoom-sessions?sort=date:desc`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const data = await res.json();
    setSessions(
      Array.isArray(data?.data)
        ? data.data.map((s: ZoomSession) => ({
            id: s.id,
            documentId: s.documentId,
            title: s.title,
            date: s.date,
            zoomLink: s.zoomLink,
            academicYear: s.academicYear,
            isActive: s.isActive,
          }))
        : []
    );
    setLoading(false);
  };

  const saveSession = async () => {
    if (!sessionForm.title || !sessionForm.date || !sessionForm.zoomLink) {
      setMsg("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    setSaving(true);
    const jwt = localStorage.getItem("teacherJwt");
    const id = editingSession?.documentId || editingSession?.id;
    const url = editingSession
      ? `${STRAPI_URL}/api/zoom-sessions/${id}`
      : `${STRAPI_URL}/api/zoom-sessions`;
    const res = await fetch(url, {
      method: editingSession ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ data: sessionForm }),
    });
    if (!res.ok) {
      setMsg("حدث خطأ، يرجى المحاولة مجدداً");
      setSaving(false);
      return;
    }
    setMsg(editingSession ? "تم تعديل الجلسة ✓" : "تمت إضافة الجلسة ✓");
    setSessionForm({ title: "", date: "", zoomLink: "", academicYear: "year1", isActive: true });
    setEditingSession(null);
    setActiveTab("sessions");
    await fetchSessions();
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const deleteSession = async (session: ZoomSession) => {
    if (!confirm("هل تريد حذف هذه الجلسة؟")) return;
    const jwt = localStorage.getItem("teacherJwt");
    const id = session.documentId || session.id;
    await fetch(`${STRAPI_URL}/api/zoom-sessions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` },
    });
    await fetchSessions();
  };

  const startEdit = (session: ZoomSession) => {
    setEditingSession(session);
    setSessionForm({
      title: session.title || "",
      date: session.date ? session.date.slice(0, 16) : "",
      zoomLink: session.zoomLink || "",
      academicYear: session.academicYear || "year1",
      isActive: session.isActive ?? true,
    });
    setActiveTab("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    localStorage.removeItem("teacherJwt");
    localStorage.removeItem("teacherEmail");
    setAuthed(false);
    setTeacherJwt("");
  };

  // شاشة الدخول
  if (!authed) {
    return (
      <main className="min-h-screen bg-[var(--lux-black)] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full border-4 border-[var(--gold)] flex items-center justify-center mx-auto mb-4">
            <span className="text-[var(--gold)] text-2xl font-bold">ح</span>
          </div>
          <h2 className="text-xl font-bold text-[var(--lux-black)] mb-1">بوابة المدرسين</h2>
          <p className="text-[var(--text-gray)] text-sm mb-6">معهد الإمام تقي الدين الحصني</p>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{loginError}</div>
          )}

          <div className="flex flex-col gap-3 mb-4">
            <input type="email" value={loginForm.email} onChange={(e) => setLoginForm(p => ({ ...p, email: e.target.value }))}
              placeholder="البريد الإلكتروني"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition" />
            <input type="password" value={loginForm.password} onChange={(e) => setLoginForm(p => ({ ...p, password: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="كلمة المرور"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition" />
          </div>
          <button onClick={handleLogin} className="w-full bg-[var(--gold)] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition">دخول</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--soft-white)] py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--lux-black)]">بوابة المدرسين</h1>
            <p className="text-[var(--text-gray)] text-sm">معهد الإمام تقي الدين الحصني</p>
          </div>
          <button onClick={handleLogout} className="border border-gray-300 text-[var(--text-gray)] px-5 py-2 rounded-lg text-sm hover:bg-gray-100 transition">
            خروج
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "إجمالي الجلسات", value: sessions.length, color: "text-[var(--lux-black)]" },
            { label: "القادمة", value: sessions.filter(s => new Date(s.date) >= new Date()).length, color: "text-[var(--gold)]" },
            { label: "المنتهية", value: sessions.filter(s => new Date(s.date) < new Date()).length, color: "text-gray-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[var(--text-gray)] text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "sessions", label: "الجلسات", icon: "🎥" },
            { id: "add", label: editingSession ? "تعديل جلسة" : "إضافة جلسة", icon: "➕" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id as "sessions" | "add"); if (tab.id === "sessions") { setEditingSession(null); setSessionForm({ title: "", date: "", zoomLink: "", academicYear: "year1", isActive: true }); } }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? "bg-[var(--gold)] text-white" : "bg-white border border-gray-200 text-[var(--text-gray)]"}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* قائمة الجلسات */}
        {activeTab === "sessions" && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-[var(--lux-black)] mb-5">جلسات Zoom</h3>
            {loading ? (
              <div className="text-center py-10 text-[var(--gold)]">جاري التحميل...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-10 text-[var(--text-gray)]">لا توجد جلسات بعد</div>
            ) : (
              <div className="flex flex-col gap-3">
                {sessions.map((session) => {
                  const isPast = new Date(session.date) < new Date();
                  return (
                    <div key={session.id} className={`rounded-xl p-4 border flex items-start justify-between gap-3 ${isPast ? "bg-gray-50 border-gray-200" : "bg-[#fdf8ef] border-[var(--gold)]/20"}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-[var(--lux-black)]">{session.title}</p>
                          {!session.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">مخفية</span>}
                          {isPast && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">انتهت</span>}
                        </div>
                        <p className="text-sm text-[var(--text-gray)]">
                          {new Date(session.date).toLocaleDateString("ar-SA", {
                            weekday: "long", year: "numeric", month: "long", day: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-[var(--gold)]/10 text-[var(--gold)] px-2 py-0.5 rounded-full">{yearMap[session.academicYear]}</span>
                          <a href={session.zoomLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate max-w-64">{session.zoomLink}</a>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => startEdit(session)} className="text-xs border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50 transition text-[var(--text-gray)]">تعديل</button>
                        <button onClick={() => deleteSession(session)} className="text-xs border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition text-red-500">حذف</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* نموذج إضافة/تعديل */}
        {activeTab === "add" && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-[var(--lux-black)] mb-5">
              {editingSession ? "تعديل الجلسة" : "إضافة جلسة جديدة"}
            </h3>

            {msg && (
              <div className={`mb-4 p-3 rounded-lg text-sm text-center ${msg.includes("خطأ") || msg.includes("يرجى") ? "bg-red-50 border border-red-200 text-red-600" : "bg-green-50 border border-green-200 text-green-600"}`}>
                {msg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">عنوان الجلسة <span className="text-red-500">*</span></label>
                <input value={sessionForm.title} onChange={(e) => setSessionForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="مثال: لقاء إثرائي - الفقه الشافعي"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">التاريخ والوقت <span className="text-red-500">*</span></label>
                <input type="datetime-local" value={sessionForm.date} onChange={(e) => setSessionForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-black bg-white focus:outline-none focus:border-[var(--gold)] transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">السنة الدراسية</label>
                <select value={sessionForm.academicYear} onChange={(e) => setSessionForm(p => ({ ...p, academicYear: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition">
                  {Object.entries(yearMap).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">رابط Zoom <span className="text-red-500">*</span></label>
                <input value={sessionForm.zoomLink} onChange={(e) => setSessionForm(p => ({ ...p, zoomLink: e.target.value }))}
                  placeholder="https://zoom.us/j/..."
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-black bg-white focus:outline-none focus:border-[var(--gold)] transition" />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={sessionForm.isActive} onChange={(e) => setSessionForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-[var(--gold)]" />
                  <span className="text-sm text-[var(--lux-black)]">نشطة (تظهر للطلاب)</span>
                </label>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button onClick={saveSession} disabled={saving}
                  className="flex-1 bg-[var(--gold)] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-60">
                  {saving ? "جاري الحفظ..." : editingSession ? "حفظ التعديلات" : "إضافة الجلسة"}
                </button>
                {editingSession && (
                  <button onClick={() => { setEditingSession(null); setSessionForm({ title: "", date: "", zoomLink: "", academicYear: "year1", isActive: true }); setActiveTab("sessions"); }}
                    className="border border-gray-200 text-[var(--text-gray)] px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition">
                    إلغاء
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}