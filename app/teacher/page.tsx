"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

const yearMap: Record<string, string> = {
  all: "جميع السنوات", year1: "السنة الأولى", year2: "السنة الثانية",
  year3: "السنة الثالثة", year4: "السنة الرابعة", year5: "السنة الخامسة",
};
const statusMap: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:  { label: "قيد المراجعة", color: "text-yellow-700", bg: "bg-yellow-50",  border: "border-yellow-200" },
  approved: { label: "مقبول",        color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200"  },
  rejected: { label: "مرفوض",        color: "text-red-700",    bg: "bg-red-50",     border: "border-red-200"    },
};

interface Student {
  id: number; email: string; firstName?: string; lastName?: string; phone?: string;
  telegram?: string; nationality?: string; residenceCountry?: string; registrationStatus?: string; academicYear?: string; isTeacher?: boolean;
}
interface ZoomSession {
  id: number; documentId?: string; title: string; date: string; zoomLink: string; academicYear: string; isActive: boolean;
}
interface TeacherInfo {
  id: number; firstName?: string; lastName?: string; teacherYear?: string; teacherSubject?: string; email: string; isTeacher?: boolean;
}
interface AttendanceRecord { session_id: number; student_id: number; attended: boolean; }
interface NoteRecord { student_id: number; note: string; }

type Tab = "students" | "sessions" | "attendance" | "add";

export default function TeacherPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("students");

  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<ZoomSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState("");

  // ملاحظات
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // الحضور
  const [selectedSession, setSelectedSession] = useState<ZoomSession | null>(null);
  const [attendance, setAttendance] = useState<Record<number, boolean>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceMsg, setAttendanceMsg] = useState("");

  // جلسة
  const [sessionForm, setSessionForm] = useState({ title: "", date: "", zoomLink: "", academicYear: "year1", isActive: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [editingSession, setEditingSession] = useState<ZoomSession | null>(null);

  const getJwt = () => localStorage.getItem("jwt") || "";
  const inp = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition text-sm";

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
        } else { router.push("/login"); }
      })
      .catch(() => router.push("/login"))
      .finally(() => setChecking(false));
  }, [router]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${STRAPI_URL}/api/users?populate=*`, { headers: { Authorization: `Bearer ${getJwt()}` } });
    const data = await res.json();
    const yr = teacherInfo?.teacherYear || "year1";
    const all: Student[] = Array.isArray(data) ? data.filter((u: Student) => !u.isTeacher && u.email !== "admin@hisni.com") : [];
    setStudents(all.filter(s => s.academicYear === yr));
    setLoading(false);
  }, [teacherInfo]);

  const fetchSessions = useCallback(async () => {
    const res = await fetch(`${STRAPI_URL}/api/zoom-sessions?sort=date:desc`, { headers: { Authorization: `Bearer ${getJwt()}` } });
    const data = await res.json();
    const yr = teacherInfo?.teacherYear || "year1";
    const all: ZoomSession[] = Array.isArray(data?.data) ? data.data.map((s: ZoomSession) => ({ id: s.id, documentId: s.documentId, title: s.title, date: s.date, zoomLink: s.zoomLink, academicYear: s.academicYear, isActive: s.isActive })) : [];
    setSessions(all.filter(s => s.academicYear === yr));
  }, [teacherInfo]);

  const fetchNotes = useCallback(async () => {
    const res = await fetch("/api/teacher/notes", { headers: { Authorization: `Bearer ${getJwt()}` } });
    const data = await res.json();
    if (Array.isArray(data?.data)) {
      const map: Record<number, string> = {};
      data.data.forEach((n: NoteRecord) => { map[n.student_id] = n.note; });
      setNotes(map);
    }
  }, []);

  useEffect(() => { if (authed && teacherInfo) { fetchStudents(); fetchSessions(); fetchNotes(); } }, [authed, teacherInfo, fetchStudents, fetchSessions, fetchNotes]);

  const fetchAttendance = async (sessionId: number) => {
    const res = await fetch(`/api/teacher/attendance?sessionId=${sessionId}`, { headers: { Authorization: `Bearer ${getJwt()}` } });
    const data = await res.json();
    const map: Record<number, boolean> = {};
    if (Array.isArray(data?.data)) data.data.forEach((a: AttendanceRecord) => { map[a.student_id] = a.attended; });
    setAttendance(map);
  };

  const saveNote = async (studentId: number) => {
    setSavingNote(true);
    await fetch("/api/teacher/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getJwt()}` },
      body: JSON.stringify({ studentId, note: noteText }),
    });
    setNotes(p => ({ ...p, [studentId]: noteText }));
    setEditingNote(null);
    setSavingNote(false);
  };

  const toggleAttendance = (studentId: number) => {
    setAttendance(p => ({ ...p, [studentId]: !p[studentId] }));
  };

  const saveAttendance = async () => {
    if (!selectedSession) return;
    setSavingAttendance(true);
    await Promise.all(
      students.map(s =>
        fetch("/api/teacher/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getJwt()}` },
          body: JSON.stringify({ sessionId: selectedSession.id, studentId: s.id, attended: attendance[s.id] ?? false }),
        })
      )
    );
    setAttendanceMsg("تم حفظ الحضور ✓");
    setTimeout(() => setAttendanceMsg(""), 3000);
    setSavingAttendance(false);
  };

  const saveSession = async () => {
    if (!sessionForm.title || !sessionForm.date || !sessionForm.zoomLink) { setMsg("يرجى ملء جميع الحقول"); return; }
    setSaving(true);
    const id = editingSession?.documentId || editingSession?.id;
    const url = editingSession ? `${STRAPI_URL}/api/zoom-sessions/${id}` : `${STRAPI_URL}/api/zoom-sessions`;
    const res = await fetch(url, { method: editingSession ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getJwt()}` }, body: JSON.stringify({ data: sessionForm }) });
    if (!res.ok) { setMsg("حدث خطأ"); setSaving(false); return; }
    setMsg(editingSession ? "تم التعديل ✓" : "تمت الإضافة ✓");
    setSessionForm({ title: "", date: "", zoomLink: "", academicYear: teacherInfo?.teacherYear || "year1", isActive: true });
    setEditingSession(null); setActiveTab("sessions"); await fetchSessions(); setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const deleteSession = async (session: ZoomSession) => {
    if (!confirm("حذف هذه الجلسة؟")) return;
    await fetch(`${STRAPI_URL}/api/zoom-sessions/${session.documentId || session.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getJwt()}` } });
    await fetchSessions();
  };

  const handleLogout = () => { localStorage.removeItem("jwt"); localStorage.removeItem("user"); document.cookie = "jwt=; path=/; max-age=0"; router.push("/login"); };

  const teacherName = `${teacherInfo?.firstName || ""} ${teacherInfo?.lastName || ""}`.trim() || teacherInfo?.email || "";
  const teacherYear = teacherInfo?.teacherYear || "year1";
  const filteredStudents = students.filter(s => `${s.firstName || ""} ${s.lastName || ""} ${s.email}`.toLowerCase().includes(search.toLowerCase()));
  const upcomingSessions = sessions.filter(s => new Date(s.date) >= new Date());

  // إحصائيات الحضور لكل جلسة
  const getAttendanceStats = (sessionId: number) => {
    // نحسب من البيانات المحملة حالياً
    return null; // سيُحسب عند فتح تبويب الحضور
  };

  const sidebarItems = [
    { id: "students" as Tab, label: "طلابي", icon: "👥", badge: students.length },
    { id: "sessions" as Tab, label: "جلساتي", icon: "🎥", badge: upcomingSessions.length },
    { id: "attendance" as Tab, label: "الحضور", icon: "✅", badge: 0 },
    { id: "add" as Tab, label: editingSession ? "تعديل جلسة" : "إضافة جلسة", icon: "➕", badge: 0 },
  ];

  if (checking) return <main className="min-h-screen bg-[var(--lux-black)] flex items-center justify-center"><div className="text-[var(--gold)]">جاري التحقق...</div></main>;
  if (!authed) return null;

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
            <p className="text-white text-sm font-semibold">{teacherName}</p>
            <p className="text-[var(--gold)]/70 text-xs">{teacherInfo?.teacherSubject} — {yearMap[teacherYear]}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[var(--gold)] flex items-center justify-center text-black font-bold text-sm shrink-0">{teacherName.charAt(0)}</div>
        </div>
      </header>

      <div className="flex flex-1">
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-16 h-[calc(100vh-4rem)] w-64 bg-[var(--lux-black)] border-l border-[var(--gold)]/10 flex flex-col z-30 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
          <div className="p-5 border-b border-[var(--gold)]/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[var(--gold)]/10 border-2 border-[var(--gold)]/30 flex items-center justify-center shrink-0">
                <span className="text-[var(--gold)] text-lg font-bold">{teacherName.charAt(0)}</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{teacherName}</p>
                <p className="text-[var(--gold)]/70 text-xs">{teacherInfo?.teacherSubject}</p>
                <span className="text-xs bg-[var(--gold)]/10 text-[var(--gold)] px-2 py-0.5 rounded-full mt-0.5 inline-block">{yearMap[teacherYear]}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 rounded-xl p-2.5 text-center">
                <p className="text-[var(--gold)] font-bold text-lg">{students.length}</p>
                <p className="text-white/50 text-xs">طالب</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 text-center">
                <p className="text-green-400 font-bold text-lg">{students.filter(s => s.registrationStatus === "approved").length}</p>
                <p className="text-white/50 text-xs">مقبول</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 text-center">
                <p className="text-blue-400 font-bold text-lg">{sessions.length}</p>
                <p className="text-white/50 text-xs">جلسة</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3">
            <p className="text-[var(--gold)]/40 text-xs font-medium px-3 mb-2">القائمة</p>
            {sidebarItems.map((item) => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); if (item.id !== "add") setEditingSession(null); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition mb-1 text-right ${activeTab === item.id ? "bg-[var(--gold)] text-black" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
                <span>{item.icon}</span>
                {item.label}
                {item.badge > 0 && (
                  <span className={`mr-auto text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === item.id ? "bg-black/20 text-black" : "bg-[var(--gold)] text-black"}`}>{item.badge}</span>
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
            <h1 className="text-xl font-bold text-[var(--lux-black)]">
              {sidebarItems.find(i => i.id === activeTab)?.icon} {sidebarItems.find(i => i.id === activeTab)?.label}
            </h1>
            <p className="text-[var(--text-gray)] text-sm">{yearMap[teacherYear]} — {teacherInfo?.teacherSubject}</p>
          </div>

          {/* ===== طلابي مع ملاحظات ===== */}
          {activeTab === "students" && (
            <div className="flex gap-5">
              <div className="flex-1">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 بحث بالاسم أو الإيميل..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition mb-4 text-sm" />
                {loading ? <div className="text-center py-10 text-[var(--gold)]">جاري التحميل...</div>
                  : filteredStudents.length === 0 ? (
                    <div className="text-center py-10"><p className="text-4xl mb-2">👥</p><p className="text-[var(--text-gray)]">لا يوجد طلاب في سنتك</p></div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {filteredStudents.map((student) => {
                        const st = statusMap[student.registrationStatus || "pending"];
                        const name = `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.email;
                        const hasNote = !!notes[student.id];
                        return (
                          <div key={student.id} onClick={() => { setSelectedStudent(selectedStudent?.id === student.id ? null : student); setEditingNote(null); }}
                            className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition border-2 ${selectedStudent?.id === student.id ? "border-[var(--gold)]" : "border-transparent hover:border-gray-200"}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[var(--lux-black)] flex items-center justify-center shrink-0">
                                  <span className="text-[var(--gold)] font-bold text-sm">{name.charAt(0)}</span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-[var(--lux-black)] text-sm">{name}</p>
                                    {hasNote && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">📝 ملاحظة</span>}
                                  </div>
                                  <p className="text-xs text-[var(--text-gray)]">{student.email}</p>
                                  {student.phone && <p className="text-xs text-[var(--text-gray)]">{student.phone}</p>}
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

              {/* بطاقة الطالب مع الملاحظات */}
              {selectedStudent && (
                <div className="w-72 shrink-0">
                  <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-6 border border-gray-100">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-[var(--lux-black)] border-2 border-[var(--gold)] flex items-center justify-center mx-auto mb-2">
                        <span className="text-[var(--gold)] text-lg font-bold">{(`${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`.trim() || selectedStudent.email).charAt(0)}</span>
                      </div>
                      <h3 className="font-bold text-[var(--lux-black)] text-sm">{`${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`.trim() || selectedStudent.email}</h3>
                      <p className="text-xs text-[var(--text-gray)]">{selectedStudent.email}</p>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs mb-4">
                      {selectedStudent.phone && <InfoRow label="الهاتف" value={selectedStudent.phone} />}
                      {selectedStudent.telegram && <InfoRow label="تليجرام" value={selectedStudent.telegram} />}
                      {selectedStudent.nationality && <InfoRow label="الجنسية" value={selectedStudent.nationality} />}
                      {selectedStudent.residenceCountry && <InfoRow label="بلد الإقامة" value={selectedStudent.residenceCountry} />}
                      <InfoRow label="الحالة" value={statusMap[selectedStudent.registrationStatus || "pending"].label} />
                    </div>

                    {/* ملاحظات المدرس */}
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-[var(--lux-black)]">📝 ملاحظاتي الخاصة</p>
                        <button onClick={() => { setEditingNote(selectedStudent.id); setNoteText(notes[selectedStudent.id] || ""); }}
                          className="text-xs text-[var(--gold)] hover:underline">
                          {notes[selectedStudent.id] ? "تعديل" : "إضافة"}
                        </button>
                      </div>

                      {editingNote === selectedStudent.id ? (
                        <div className="flex flex-col gap-2">
                          <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
                            placeholder="اكتب ملاحظاتك هنا..." rows={4}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition text-xs resize-none" />
                          <div className="flex gap-2">
                            <button onClick={() => saveNote(selectedStudent.id)} disabled={savingNote}
                              className="flex-1 bg-[var(--gold)] text-black py-1.5 rounded-lg font-bold hover:opacity-90 transition disabled:opacity-60 text-xs">
                              {savingNote ? "..." : "حفظ"}
                            </button>
                            <button onClick={() => setEditingNote(null)} className="border border-gray-200 text-[var(--text-gray)] px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition">إلغاء</button>
                          </div>
                        </div>
                      ) : notes[selectedStudent.id] ? (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                          <p className="text-xs text-blue-800 leading-relaxed">{notes[selectedStudent.id]}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--text-gray)] text-center py-2">لا توجد ملاحظات بعد</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== الحضور ===== */}
          {activeTab === "attendance" && (
            <div className="space-y-5">
              {/* اختيار الجلسة */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-[var(--lux-black)] mb-4">اختر جلسة لتسجيل الحضور</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sessions.map(session => {
                    const isPast = new Date(session.date) < new Date();
                    return (
                      <div key={session.id} onClick={() => { setSelectedSession(session); fetchAttendance(session.id); setAttendanceMsg(""); }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition ${selectedSession?.id === session.id ? "border-[var(--gold)] bg-[var(--gold)]/5" : "border-gray-100 hover:border-[var(--gold)]/30 bg-[var(--soft-white)]"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-[var(--lux-black)] text-sm">{session.title}</p>
                            <p className="text-xs text-[var(--text-gray)] mt-0.5">
                              {new Date(session.date).toLocaleDateString("ar-SA", { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isPast ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>
                            {isPast ? "انتهت" : "قادمة"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {sessions.length === 0 && <p className="text-[var(--text-gray)] text-sm col-span-2 text-center py-4">لا توجد جلسات بعد</p>}
                </div>
              </div>

              {/* تسجيل الحضور */}
              {selectedSession && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-bold text-[var(--lux-black)]">📋 تسجيل حضور: {selectedSession.title}</h3>
                      <p className="text-xs text-[var(--text-gray)] mt-0.5">
                        {new Date(selectedSession.date).toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-green-600">{Object.values(attendance).filter(Boolean).length}</p>
                      <p className="text-xs text-[var(--text-gray)]">حاضر من {students.length}</p>
                    </div>
                  </div>

                  {attendanceMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm text-center">{attendanceMsg}</div>}

                  {/* أزرار سريعة */}
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => { const all: Record<number, boolean> = {}; students.forEach(s => { all[s.id] = true; }); setAttendance(all); }}
                      className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition">✓ تحديد الكل</button>
                    <button onClick={() => setAttendance({})}
                      className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">✗ إلغاء الكل</button>
                  </div>

                  <div className="flex flex-col gap-2 mb-5">
                    {students.map(student => {
                      const name = `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.email;
                      const isPresent = attendance[student.id] ?? false;
                      return (
                        <div key={student.id} onClick={() => toggleAttendance(student.id)}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition border-2 ${isPresent ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100 hover:border-gray-200"}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isPresent ? "bg-green-500" : "bg-gray-300"}`}>
                              <span className="text-white font-bold text-xs">{isPresent ? "✓" : name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className={`font-medium text-sm ${isPresent ? "text-green-800" : "text-[var(--lux-black)]"}`}>{name}</p>
                              <p className="text-xs text-[var(--text-gray)]">{student.email}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${isPresent ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                            {isPresent ? "حاضر" : "غائب"}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <button onClick={saveAttendance} disabled={savingAttendance}
                    className="w-full bg-[var(--gold)] text-black py-3 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-60">
                    {savingAttendance ? "جاري الحفظ..." : "💾 حفظ الحضور"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===== جلساتي ===== */}
          {activeTab === "sessions" && (
            <div>
              {sessions.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl">
                  <p className="text-4xl mb-3">🎥</p>
                  <p className="text-[var(--lux-black)] font-semibold mb-1">لا توجد جلسات بعد</p>
                  <button onClick={() => setActiveTab("add")} className="bg-[var(--gold)] text-black px-6 py-2 rounded-xl font-bold hover:opacity-90 transition text-sm mt-3">إضافة جلسة</button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {sessions.map((session) => {
                    const isPast = new Date(session.date) < new Date();
                    return (
                      <div key={session.id} className={`bg-white rounded-xl p-4 shadow-sm border ${isPast ? "border-gray-100 opacity-70" : "border-[var(--gold)]/20"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-[var(--lux-black)] text-sm">{session.title}</p>
                              {!isPast && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">قادمة</span>}
                              {isPast && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">انتهت</span>}
                            </div>
                            <p className="text-xs text-[var(--text-gray)]">{new Date(session.date).toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button onClick={() => { setActiveTab("attendance"); setSelectedSession(session); fetchAttendance(session.id); }}
                              className="text-xs bg-[var(--gold)]/10 text-[var(--gold)] px-3 py-1 rounded-lg hover:bg-[var(--gold)]/20 transition font-medium">✅ حضور</button>
                            <button onClick={() => { setEditingSession(session); setSessionForm({ title: session.title || "", date: session.date?.slice(0, 16) || "", zoomLink: session.zoomLink || "", academicYear: session.academicYear || "year1", isActive: session.isActive ?? true }); setActiveTab("add"); }}
                              className="text-xs border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50 transition text-[var(--text-gray)]">تعديل</button>
                            <button onClick={() => deleteSession(session)} className="text-xs border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition text-red-500">حذف</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== إضافة جلسة ===== */}
          {activeTab === "add" && (
            <div className="max-w-lg">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h3 className="font-bold text-[var(--lux-black)] mb-5">{editingSession ? "✏️ تعديل الجلسة" : "➕ إضافة جلسة جديدة"}</h3>
                {msg && <div className={`mb-4 p-3 rounded-xl text-sm text-center ${msg.includes("خطأ") || msg.includes("يرجى") ? "bg-red-50 border border-red-200 text-red-600" : "bg-green-50 border border-green-200 text-green-600"}`}>{msg}</div>}
                <div className="flex flex-col gap-4">
                  <div><label className="block text-sm font-medium text-[var(--lux-black)] mb-1">عنوان الجلسة <span className="text-red-500">*</span></label><input value={sessionForm.title} onChange={(e) => setSessionForm(p => ({ ...p, title: e.target.value }))} placeholder="مثال: لقاء إثرائي" className={inp} /></div>
                  <div><label className="block text-sm font-medium text-[var(--lux-black)] mb-1">التاريخ والوقت <span className="text-red-500">*</span></label><input type="datetime-local" value={sessionForm.date} onChange={(e) => setSessionForm(p => ({ ...p, date: e.target.value }))} className={inp} /></div>
                  <div><label className="block text-sm font-medium text-[var(--lux-black)] mb-1">السنة الدراسية</label><div className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-right text-[var(--text-gray)] bg-gray-50 text-sm">{yearMap[teacherYear]}</div></div>
                  <div><label className="block text-sm font-medium text-[var(--lux-black)] mb-1">رابط Zoom <span className="text-red-500">*</span></label><input value={sessionForm.zoomLink} onChange={(e) => setSessionForm(p => ({ ...p, zoomLink: e.target.value }))} placeholder="https://zoom.us/j/..." className={inp} /></div>
                  <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={sessionForm.isActive} onChange={(e) => setSessionForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-[var(--gold)]" /><span className="text-sm text-[var(--lux-black)]">نشطة (تظهر للطلاب)</span></label>
                  <div className="flex gap-3">
                    <button onClick={saveSession} disabled={saving} className="flex-1 bg-[var(--gold)] text-black py-3 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-60">{saving ? "جاري الحفظ..." : editingSession ? "حفظ التعديلات" : "إضافة الجلسة"}</button>
                    {editingSession && <button onClick={() => { setEditingSession(null); setSessionForm({ title: "", date: "", zoomLink: "", academicYear: teacherYear, isActive: true }); setActiveTab("sessions"); }} className="border border-gray-200 text-[var(--text-gray)] px-6 py-3 rounded-xl hover:bg-gray-50 transition text-sm">إلغاء</button>}
                  </div>
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
    <div className="flex items-center justify-between py-1 border-b border-gray-50">
      <span className="text-[var(--text-gray)]">{label}</span>
      <span className="font-medium text-[var(--lux-black)]">{value}</span>
    </div>
  );
}