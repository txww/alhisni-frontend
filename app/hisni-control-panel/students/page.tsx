"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

const yearMap: Record<string, string> = {
  all: "جميع السنوات", year1: "السنة الأولى", year2: "السنة الثانية",
  year3: "السنة الثالثة", year4: "السنة الرابعة", year5: "السنة الخامسة",
};

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: "قيد المراجعة", color: "text-yellow-700", bg: "bg-yellow-50" },
  approved: { label: "مقبول",        color: "text-green-700",  bg: "bg-green-50"  },
  rejected: { label: "مرفوض",        color: "text-red-700",    bg: "bg-red-50"    },
};

interface Student {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  telegram?: string;
  nationality?: string;
  residenceCountry?: string;
  registrationStatus?: string;
  academicYear?: string;
  isTeacher?: boolean;
}

interface ZoomSession {
  id: number;
  documentId?: string;
  title: string;
  date: string;
  zoomLink: string;
  academicYear: string;
  isActive: boolean;
}

interface TeacherInfo {
  id: number;
  firstName?: string;
  lastName?: string;
  teacherYear?: string;
  teacherSubject?: string;
  email: string;
  isTeacher?: boolean;
}

export default function TeacherPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);

  const [activeTab, setActiveTab] = useState<"students" | "sessions" | "add">("students");
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<ZoomSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState("");

  const [sessionForm, setSessionForm] = useState({ title: "", date: "", zoomLink: "", academicYear: "year1", isActive: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [editingSession, setEditingSession] = useState<ZoomSession | null>(null);

  const inp = "w-full border border-gray-200 rounded-lg px-4 py-3 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition";
  const getJwt = () => localStorage.getItem("jwt") || "";

  // التحقق من الجلسة عند التحميل
  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) { setChecking(false); router.push("/login"); return; }

    fetch(`${STRAPI_URL}/api/users/me`, { headers: { Authorization: `Bearer ${jwt}` } })
      .then(r => r.json())
      .then(data => {
        if (data?.isTeacher === true) {
          setTeacherInfo(data);
          setSessionForm(p => ({ ...p, academicYear: data.teacherYear || "year1" }));
          setAuthed(true);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setChecking(false));
  }, [router]);

  useEffect(() => {
    if (authed && teacherInfo) { fetchStudents(); fetchSessions(); }
  }, [authed, teacherInfo]);

  const fetchStudents = async () => {
    setLoading(true);
    const res = await fetch(`${STRAPI_URL}/api/users?populate=*`, { headers: { Authorization: `Bearer ${getJwt()}` } });
    const data = await res.json();
    const teacherYear = teacherInfo?.teacherYear || "year1";
    const all: Student[] = Array.isArray(data)
      ? data.filter((u: Student) => !u.isTeacher && u.email !== "admin@hisni.com")
      : [];
    setStudents(all.filter(s => s.academicYear === teacherYear));
    setLoading(false);
  };

  const fetchSessions = async () => {
    const res = await fetch(`${STRAPI_URL}/api/zoom-sessions?sort=date:desc`, { headers: { Authorization: `Bearer ${getJwt()}` } });
    const data = await res.json();
    const teacherYear = teacherInfo?.teacherYear || "year1";
    const all: ZoomSession[] = Array.isArray(data?.data)
      ? data.data.map((s: ZoomSession) => ({ id: s.id, documentId: s.documentId, title: s.title, date: s.date, zoomLink: s.zoomLink, academicYear: s.academicYear, isActive: s.isActive }))
      : [];
    setSessions(all.filter(s => s.academicYear === teacherYear));
  };

  const saveSession = async () => {
    if (!sessionForm.title || !sessionForm.date || !sessionForm.zoomLink) { setMsg("يرجى ملء جميع الحقول المطلوبة"); return; }
    setSaving(true);
    const id = editingSession?.documentId || editingSession?.id;
    const url = editingSession ? `${STRAPI_URL}/api/zoom-sessions/${id}` : `${STRAPI_URL}/api/zoom-sessions`;
    const res = await fetch(url, {
      method: editingSession ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getJwt()}` },
      body: JSON.stringify({ data: sessionForm }),
    });
    if (!res.ok) { setMsg("حدث خطأ، يرجى المحاولة مجدداً"); setSaving(false); return; }
    setMsg(editingSession ? "تم تعديل الجلسة ✓" : "تمت إضافة الجلسة ✓");
    setSessionForm({ title: "", date: "", zoomLink: "", academicYear: teacherInfo?.teacherYear || "year1", isActive: true });
    setEditingSession(null);
    setActiveTab("sessions");
    await fetchSessions();
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const deleteSession = async (session: ZoomSession) => {
    if (!confirm("هل تريد حذف هذه الجلسة؟")) return;
    await fetch(`${STRAPI_URL}/api/zoom-sessions/${session.documentId || session.id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${getJwt()}` },
    });
    await fetchSessions();
  };

  const startEdit = (session: ZoomSession) => {
    setEditingSession(session);
    setSessionForm({ title: session.title || "", date: session.date?.slice(0, 16) || "", zoomLink: session.zoomLink || "", academicYear: session.academicYear || "year1", isActive: session.isActive ?? true });
    setActiveTab("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const teacherName = `${teacherInfo?.firstName || ""} ${teacherInfo?.lastName || ""}`.trim() || teacherInfo?.email || "";
  const teacherYear = teacherInfo?.teacherYear || "year1";
  const filteredStudents = students.filter(s =>
    `${s.firstName || ""} ${s.lastName || ""} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  if (checking) return (
    <main className="min-h-screen bg-[var(--lux-black)] flex items-center justify-center">
      <div className="text-[var(--gold)]">جاري التحقق...</div>
    </main>
  );

  if (!authed) return null;

  return (
    <main className="min-h-screen bg-[var(--soft-white)] py-8 px-4">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--lux-black)]">{teacherName}</h1>
            <p className="text-[var(--text-gray)] text-sm">{teacherInfo?.teacherSubject} — {yearMap[teacherYear]}</p>
          </div>
          <button onClick={handleLogout} className="border border-gray-300 text-[var(--text-gray)] px-5 py-2 rounded-lg text-sm hover:bg-gray-100 transition">خروج</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "طلاب سنتي", value: students.length, color: "text-[var(--lux-black)]" },
            { label: "مقبولون", value: students.filter(s => s.registrationStatus === "approved").length, color: "text-green-600" },
            { label: "قيد المراجعة", value: students.filter(s => s.registrationStatus === "pending").length, color: "text-yellow-600" },
            { label: "جلساتي", value: sessions.length, color: "text-blue-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[var(--text-gray)] text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[{ id: "students", label: "طلابي", icon: "👥" }, { id: "sessions", label: "جلساتي", icon: "🎥" }, { id: "add", label: editingSession ? "تعديل جلسة" : "إضافة جلسة", icon: "➕" }].map((tab) => (
            <button key={tab.id}
              onClick={() => { setActiveTab(tab.id as "students" | "sessions" | "add"); if (tab.id !== "add") setEditingSession(null); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? "bg-[var(--gold)] text-white" : "bg-white border border-gray-200 text-[var(--text-gray)]"}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* طلابي */}
        {activeTab === "students" && (
          <div className="flex gap-5">
            <div className="flex-1">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الإيميل..."
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition mb-4" />
              {loading ? <div className="text-center py-10 text-[var(--gold)]">جاري التحميل...</div>
                : filteredStudents.length === 0 ? <div className="text-center py-10 text-[var(--text-gray)]">لا يوجد طلاب</div>
                : (
                  <div className="flex flex-col gap-3">
                    {filteredStudents.map((student) => {
                      const st = statusMap[student.registrationStatus || "pending"];
                      const name = `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.email;
                      return (
                        <div key={student.id} onClick={() => setSelectedStudent(selectedStudent?.id === student.id ? null : student)}
                          className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition border-2 ${selectedStudent?.id === student.id ? "border-[var(--gold)]" : "border-transparent"}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-[var(--lux-black)]">{name}</p>
                              <p className="text-sm text-[var(--text-gray)]">{student.email}</p>
                              {student.phone && <p className="text-xs text-[var(--text-gray)] mt-1">{student.phone}</p>}
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${st.bg} ${st.color}`}>{st.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
            {selectedStudent && (
              <div className="w-72 bg-white rounded-2xl shadow-sm p-6 h-fit sticky top-8">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--lux-black)] flex items-center justify-center mx-auto mb-2">
                    <span className="text-[var(--gold)] text-lg font-bold">{(`${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`.trim() || selectedStudent.email).charAt(0)}</span>
                  </div>
                  <h3 className="font-bold text-[var(--lux-black)] text-sm">{`${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`.trim() || selectedStudent.email}</h3>
                  <p className="text-xs text-[var(--text-gray)]">{selectedStudent.email}</p>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  {selectedStudent.phone && <Row label="الهاتف" value={selectedStudent.phone} />}
                  {selectedStudent.telegram && <Row label="تليجرام" value={selectedStudent.telegram} />}
                  {selectedStudent.nationality && <Row label="الجنسية" value={selectedStudent.nationality} />}
                  {selectedStudent.residenceCountry && <Row label="بلد الإقامة" value={selectedStudent.residenceCountry} />}
                  <Row label="السنة" value={yearMap[selectedStudent.academicYear || ""] || "غير محدد"} />
                  <Row label="الحالة" value={statusMap[selectedStudent.registrationStatus || "pending"].label} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* جلساتي */}
        {activeTab === "sessions" && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-[var(--lux-black)] mb-5">جلسات Zoom — {yearMap[teacherYear]}</h3>
            {sessions.length === 0 ? <div className="text-center py-10 text-[var(--text-gray)]">لا توجد جلسات بعد</div> : (
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
                        <p className="text-sm text-[var(--text-gray)]">{new Date(session.date).toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                        <a href={session.zoomLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate max-w-48 mt-1 block">{session.zoomLink}</a>
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

        {/* إضافة/تعديل جلسة */}
        {activeTab === "add" && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-[var(--lux-black)] mb-5">{editingSession ? "تعديل الجلسة" : "إضافة جلسة جديدة"}</h3>
            {msg && (
              <div className={`mb-4 p-3 rounded-lg text-sm text-center ${msg.includes("خطأ") || msg.includes("يرجى") ? "bg-red-50 border border-red-200 text-red-600" : "bg-green-50 border border-green-200 text-green-600"}`}>{msg}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">عنوان الجلسة <span className="text-red-500">*</span></label>
                <input value={sessionForm.title} onChange={(e) => setSessionForm(p => ({ ...p, title: e.target.value }))} placeholder="مثال: لقاء إثرائي - الفقه الشافعي" className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">التاريخ والوقت <span className="text-red-500">*</span></label>
                <input type="datetime-local" value={sessionForm.date} onChange={(e) => setSessionForm(p => ({ ...p, date: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">السنة الدراسية</label>
                <select value={sessionForm.academicYear} className={inp} disabled>
                  <option value={teacherYear}>{yearMap[teacherYear]}</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">رابط Zoom <span className="text-red-500">*</span></label>
                <input value={sessionForm.zoomLink} onChange={(e) => setSessionForm(p => ({ ...p, zoomLink: e.target.value }))} placeholder="https://zoom.us/j/..." className={inp} />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={sessionForm.isActive} onChange={(e) => setSessionForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-[var(--gold)]" />
                  <span className="text-sm text-[var(--lux-black)]">نشطة (تظهر للطلاب)</span>
                </label>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button onClick={saveSession} disabled={saving} className="flex-1 bg-[var(--gold)] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-60">
                  {saving ? "جاري الحفظ..." : editingSession ? "حفظ التعديلات" : "إضافة الجلسة"}
                </button>
                {editingSession && (
                  <button onClick={() => { setEditingSession(null); setSessionForm({ title: "", date: "", zoomLink: "", academicYear: teacherYear, isActive: true }); setActiveTab("sessions"); }}
                    className="border border-gray-200 text-[var(--text-gray)] px-6 py-3 rounded-lg hover:bg-gray-50 transition">إلغاء</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-gray-50 pb-1">
      <span className="text-[var(--text-gray)]">{label}</span>
      <span className="font-medium text-[var(--lux-black)]">{value}</span>
    </div>
  );
}