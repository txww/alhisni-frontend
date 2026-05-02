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
  telegram?: string; nationality?: string; residenceCountry?: string;
  registrationStatus?: string; academicYear?: string; isTeacher?: boolean; gender?: string;
}
interface SectionWithStudents {
  id: number; name: string; academic_year: string; gender: string;
  max_students: number; student_count: number; students: Student[];
}
interface Session {
  id: number; title: string; date: string; zoom_link: string; section_id: number; is_active: boolean;
}
interface Lesson {
  id: number; title: string; video_url: string; section_id: number;
  subject: string; description?: string; duration?: string; order: number;
  quiz_question?: string; quiz_answer?: string; pdf_url?: string;
}
interface TeacherInfo {
  id: number; firstName?: string; lastName?: string; teacherYear?: string;
  teacherSubject?: string; email: string; isTeacher?: boolean;
}
interface AttendanceRecord { session_id: number; student_id: number; attended: boolean; }
interface NoteRecord { student_id: number; note: string; }

type Tab = "sections" | "students" | "sessions" | "lessons" | "attendance" | "add_session" | "add_lesson";

export default function TeacherPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("sections");

  const [mySections, setMySections] = useState<SectionWithStudents[]>([]);
  const [selectedSection, setSelectedSectionState] = useState<SectionWithStudents | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState("");

  const [notes, setNotes] = useState<Record<number, string>>({});
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState<Session | null>(null);
  const [attendance, setAttendance] = useState<Record<number, boolean>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceMsg, setAttendanceMsg] = useState("");

  // نموذج إضافة جلسة
  const [sessionForm, setSessionForm] = useState({ title: "", date: "", zoomLink: "", sectionId: "", isActive: true });
  const [savingSession, setSavingSession] = useState(false);
  const [sessionMsg, setSessionMsg] = useState("");
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  // نموذج إضافة درس
  const [lessonForm, setLessonForm] = useState({ title: "", videoUrl: "", sectionId: "", subject: "", description: "", duration: "", order: "0", quizQuestion: "", quizAnswer: "", pdfUrl: "" });
  const [savingLesson, setSavingLesson] = useState(false);
  const [lessonMsg, setLessonMsg] = useState("");

  const getJwt = () => localStorage.getItem("jwt") || "";
  const inp = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition text-sm";

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) { setChecking(false); router.push("/login"); return; }
    fetch(`${STRAPI_URL}/api/users/me`, { headers: { Authorization: `Bearer ${jwt}` } })
      .then(r => r.json())
      .then(data => {
        if (data?.isTeacher === true) { setTeacherInfo(data); setAuthed(true); }
        else { router.push("/login"); }
      })
      .catch(() => router.push("/login"))
      .finally(() => setChecking(false));
  }, [router]);

  const fetchMySections = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/sections/my", { headers: { Authorization: `Bearer ${getJwt()}` } });
    const data = await res.json();
    if (data?.type === "teacher" && Array.isArray(data.data)) {
      setMySections(data.data);
      const allS: Student[] = data.data.flatMap((s: SectionWithStudents) => s.students || []);
      setAllStudents(allS);
      if (data.data.length > 0 && !selectedSection) setSelectedSectionState(data.data[0]);
    }
    setLoading(false);
  }, []);

  const fetchSessions = useCallback(async () => {
    if (!teacherInfo) return;
    // جلب جلسات شعب المدرس
    const results: Session[] = [];
    for (const section of mySections) {
      const res = await fetch(`/api/sessions?sectionId=${section.id}`, { headers: { Authorization: `Bearer ${getJwt()}` } });
      const data = await res.json();
      if (Array.isArray(data?.data)) results.push(...data.data);
    }
    setSessions(results);
  }, [teacherInfo, mySections]);

  const fetchLessons = useCallback(async () => {
    if (!teacherInfo) return;
    const results: Lesson[] = [];
    for (const section of mySections) {
      const res = await fetch(`/api/lessons?sectionId=${section.id}`, { headers: { Authorization: `Bearer ${getJwt()}` } });
      const data = await res.json();
      if (Array.isArray(data?.data)) results.push(...data.data);
    }
    setLessons(results);
  }, [teacherInfo, mySections]);

  const fetchNotes = useCallback(async () => {
    const res = await fetch("/api/teacher/notes", { headers: { Authorization: `Bearer ${getJwt()}` } });
    const data = await res.json();
    if (Array.isArray(data?.data)) {
      const map: Record<number, string> = {};
      data.data.forEach((n: NoteRecord) => { map[n.student_id] = n.note; });
      setNotes(map);
    }
  }, []);

  useEffect(() => {
    if (authed && teacherInfo) { fetchMySections(); fetchNotes(); }
  }, [authed, teacherInfo, fetchMySections, fetchNotes]);

  useEffect(() => {
    if (mySections.length > 0) { fetchSessions(); fetchLessons(); }
  }, [mySections, fetchSessions, fetchLessons]);

  const fetchAttendance = async (sessionId: number) => {
    const res = await fetch(`/api/teacher/attendance?sessionId=${sessionId}`, { headers: { Authorization: `Bearer ${getJwt()}` } });
    const data = await res.json();
    const map: Record<number, boolean> = {};
    if (Array.isArray(data?.data)) data.data.forEach((a: AttendanceRecord) => { map[a.student_id] = a.attended; });
    setAttendance(map);
  };

  const saveNote = async (studentId: number) => {
    setSavingNote(true);
    await fetch("/api/teacher/notes", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getJwt()}` }, body: JSON.stringify({ studentId, note: noteText }) });
    setNotes(p => ({ ...p, [studentId]: noteText }));
    setEditingNote(null); setSavingNote(false);
  };

  const saveAttendance = async () => {
    if (!selectedSessionForAttendance) return;
    const students = selectedSection?.students || allStudents;
    setSavingAttendance(true);
    await Promise.all(students.map(s => fetch("/api/teacher/attendance", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getJwt()}` }, body: JSON.stringify({ sessionId: selectedSessionForAttendance.id, studentId: s.id, attended: attendance[s.id] ?? false }) })));
    setAttendanceMsg("تم حفظ الحضور ✓");
    setTimeout(() => setAttendanceMsg(""), 3000);
    setSavingAttendance(false);
  };

  const saveSession = async () => {
    if (!sessionForm.title || !sessionForm.date || !sessionForm.zoomLink || !sessionForm.sectionId) {
      setSessionMsg("يرجى ملء جميع الحقول"); return;
    }
    setSavingSession(true);
    const method = editingSession ? "PUT" : "POST";
    const body = editingSession
      ? { id: editingSession.id, title: sessionForm.title, date: sessionForm.date, zoomLink: sessionForm.zoomLink, sectionId: parseInt(sessionForm.sectionId), isActive: sessionForm.isActive }
      : { title: sessionForm.title, date: sessionForm.date, zoomLink: sessionForm.zoomLink, sectionId: parseInt(sessionForm.sectionId), isActive: sessionForm.isActive };

    const res = await fetch("/api/sessions", { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${getJwt()}` }, body: JSON.stringify(body) });
    if (!res.ok) { setSessionMsg("حدث خطأ"); setSavingSession(false); return; }
    setSessionMsg(editingSession ? "تم التعديل ✓" : "تمت الإضافة ✓");
    setSessionForm({ title: "", date: "", zoomLink: "", sectionId: mySections[0]?.id?.toString() || "", isActive: true });
    setEditingSession(null);
    await fetchSessions();
    setSavingSession(false);
    setTimeout(() => { setSessionMsg(""); setActiveTab("sessions"); }, 1500);
  };

  const deleteSession = async (id: number) => {
    if (!confirm("حذف هذه الجلسة؟")) return;
    await fetch(`/api/sessions?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getJwt()}` } });
    await fetchSessions();
  };

  const saveLesson = async () => {
    if (!lessonForm.title || !lessonForm.videoUrl || !lessonForm.sectionId) {
      setLessonMsg("يرجى ملء العنوان والرابط والشعبة"); return;
    }
    setSavingLesson(true);
    const res = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getJwt()}` },
      body: JSON.stringify({
        title: lessonForm.title, videoUrl: lessonForm.videoUrl, sectionId: parseInt(lessonForm.sectionId),
        subject: lessonForm.subject, description: lessonForm.description, duration: lessonForm.duration,
        order: parseInt(lessonForm.order) || 0, quizQuestion: lessonForm.quizQuestion || null,
        quizAnswer: lessonForm.quizAnswer || null, pdfUrl: lessonForm.pdfUrl || null,
      }),
    });
    if (!res.ok) { setLessonMsg("حدث خطأ"); setSavingLesson(false); return; }
    setLessonMsg("تمت إضافة الدرس ✓");
    setLessonForm({ title: "", videoUrl: "", sectionId: mySections[0]?.id?.toString() || "", subject: "", description: "", duration: "", order: "0", quizQuestion: "", quizAnswer: "", pdfUrl: "" });
    await fetchLessons();
    setSavingLesson(false);
    setTimeout(() => { setLessonMsg(""); setActiveTab("lessons"); }, 1500);
  };

  const deleteLesson = async (id: number) => {
    if (!confirm("حذف هذا الدرس؟")) return;
    await fetch(`/api/lessons?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getJwt()}` } });
    await fetchLessons();
  };

  const handleLogout = () => { localStorage.removeItem("jwt"); localStorage.removeItem("user"); document.cookie = "jwt=; path=/; max-age=0"; router.push("/login"); };

  const teacherName = `${teacherInfo?.firstName || ""} ${teacherInfo?.lastName || ""}`.trim() || teacherInfo?.email || "";
  const displayStudents = selectedSection ? selectedSection.students : allStudents;
  const filteredStudents = displayStudents.filter(s => `${s.firstName || ""} ${s.lastName || ""} ${s.email}`.toLowerCase().includes(search.toLowerCase()));

  const sidebarItems = [
    { id: "sections" as Tab, label: "شعبي", icon: "🏫", badge: mySections.length },
    { id: "students" as Tab, label: "طلابي", icon: "👥", badge: allStudents.length },
    { id: "sessions" as Tab, label: "الجلسات", icon: "📡", badge: sessions.length },
    { id: "lessons" as Tab, label: "الدروس", icon: "🎬", badge: lessons.length },
    { id: "attendance" as Tab, label: "الحضور", icon: "✅", badge: 0 },
    { id: "add_session" as Tab, label: "إضافة جلسة", icon: "➕", badge: 0 },
    { id: "add_lesson" as Tab, label: "إضافة درس", icon: "🎬", badge: 0 },
  ];

  useEffect(() => {
    if (mySections.length > 0) {
      setSessionForm(p => ({ ...p, sectionId: mySections[0].id.toString() }));
      setLessonForm(p => ({ ...p, sectionId: mySections[0].id.toString() }));
    }
  }, [mySections]);

  if (checking) return <main className="min-h-screen bg-[var(--lux-black)] flex items-center justify-center"><div className="text-[var(--gold)]">جاري التحقق...</div></main>;
  if (!authed) return null;

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
            <p className="text-white text-sm font-semibold">{teacherName}</p>
            <p className="text-[var(--gold)]/70 text-xs">{teacherInfo?.teacherSubject}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[var(--gold)] flex items-center justify-center text-black font-bold text-sm shrink-0">{teacherName.charAt(0)}</div>
        </div>
      </header>

      <div className="flex flex-1">
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <aside className={`fixed lg:sticky top-16 h-[calc(100vh-4rem)] w-64 bg-[var(--lux-black)] border-l border-[var(--gold)]/10 flex flex-col z-30 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
          <div className="p-5 border-b border-[var(--gold)]/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-[var(--gold)]/10 border-2 border-[var(--gold)]/30 flex items-center justify-center shrink-0">
                <span className="text-[var(--gold)] text-lg font-bold">{teacherName.charAt(0)}</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{teacherName}</p>
                <p className="text-[var(--gold)]/70 text-xs">{teacherInfo?.teacherSubject}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 rounded-xl p-2.5 text-center"><p className="text-[var(--gold)] font-bold text-lg">{mySections.length}</p><p className="text-white/50 text-xs">شعبة</p></div>
              <div className="bg-white/5 rounded-xl p-2.5 text-center"><p className="text-green-400 font-bold text-lg">{allStudents.length}</p><p className="text-white/50 text-xs">طالب</p></div>
              <div className="bg-white/5 rounded-xl p-2.5 text-center"><p className="text-blue-400 font-bold text-lg">{lessons.length}</p><p className="text-white/50 text-xs">درس</p></div>
            </div>
          </div>

          <nav className="flex-1 p-3 overflow-y-auto">
            <p className="text-[var(--gold)]/40 text-xs font-medium px-3 mb-1">القائمة</p>
            {sidebarItems.map((item) => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition mb-1 text-right ${activeTab === item.id ? "bg-[var(--gold)] text-black" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
                <span>{item.icon}</span>
                {item.label}
                {item.badge > 0 && (
                  <span className={`mr-auto text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === item.id ? "bg-black/20 text-black" : "bg-[var(--gold)] text-black"}`}>{item.badge}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-[var(--gold)]/10">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition text-right"><span>🚪</span> تسجيل الخروج</button>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">

          {/* شعبي */}
          {activeTab === "sections" && (
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-xl font-bold text-[var(--lux-black)]">🏫 شعبي</h2>
              {loading ? <div className="text-center py-10 text-[var(--gold)]">جاري التحميل...</div>
                : mySections.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl"><p className="text-4xl mb-3">🏫</p><p className="font-semibold text-[var(--lux-black)]">لم يتم تعيينك في شعبة بعد</p></div>
                ) : mySections.map(section => (
                  <div key={section.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-[var(--lux-black)]">{section.name}</h3>
                        <p className="text-xs text-[var(--text-gray)] mt-0.5">{yearMap[section.academic_year]}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-[var(--gold)]">{section.student_count}</p>
                        <p className="text-xs text-[var(--text-gray)]">طالب</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { setSelectedSectionState(section); setActiveTab("students"); }} className="text-xs bg-[var(--gold)]/10 text-[var(--gold)] px-3 py-1.5 rounded-lg hover:bg-[var(--gold)]/20 transition">👥 الطلاب</button>
                      <button onClick={() => { setSessionForm(p => ({ ...p, sectionId: section.id.toString() })); setActiveTab("add_session"); }} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">➕ جلسة</button>
                      <button onClick={() => { setLessonForm(p => ({ ...p, sectionId: section.id.toString() })); setActiveTab("add_lesson"); }} className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 transition">🎬 درس</button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* طلابي */}
          {activeTab === "students" && (
            <div className="flex gap-5 max-w-4xl">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[var(--lux-black)] mb-4">👥 طلابي</h2>
                {mySections.length > 1 && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <button onClick={() => setSelectedSectionState(null)} className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${!selectedSection ? "bg-[var(--gold)] text-black" : "bg-white border border-gray-200 text-[var(--text-gray)]"}`}>الكل ({allStudents.length})</button>
                    {mySections.map(s => <button key={s.id} onClick={() => setSelectedSectionState(s)} className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${selectedSection?.id === s.id ? "bg-[var(--gold)] text-black" : "bg-white border border-gray-200 text-[var(--text-gray)]"}`}>{s.name} ({s.student_count})</button>)}
                  </div>
                )}
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 بحث..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition mb-4 text-sm" />
                {loading ? <div className="text-center py-10 text-[var(--gold)]">جاري التحميل...</div>
                  : filteredStudents.length === 0 ? <div className="text-center py-10 text-[var(--text-gray)]">لا يوجد طلاب</div>
                  : (
                    <div className="flex flex-col gap-2">
                      {filteredStudents.map((student) => {
                        const st = statusMap[student.registrationStatus || "pending"];
                        const name = `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.email;
                        return (
                          <div key={student.id} onClick={() => { setSelectedStudent(selectedStudent?.id === student.id ? null : student); setEditingNote(null); }}
                            className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition border-2 ${selectedStudent?.id === student.id ? "border-[var(--gold)]" : "border-transparent hover:border-gray-200"}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[var(--lux-black)] flex items-center justify-center shrink-0"><span className="text-[var(--gold)] font-bold text-sm">{name.charAt(0)}</span></div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-[var(--lux-black)] text-sm">{name}</p>
                                    {notes[student.id] && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">📝</span>}
                                  </div>
                                  <p className="text-xs text-[var(--text-gray)]">{student.email}</p>
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
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-[var(--lux-black)]">📝 ملاحظاتي</p>
                        <button onClick={() => { setEditingNote(selectedStudent.id); setNoteText(notes[selectedStudent.id] || ""); }} className="text-xs text-[var(--gold)] hover:underline">{notes[selectedStudent.id] ? "تعديل" : "إضافة"}</button>
                      </div>
                      {editingNote === selectedStudent.id ? (
                        <div className="flex flex-col gap-2">
                          <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="اكتب ملاحظاتك..." rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition text-xs resize-none" />
                          <div className="flex gap-2">
                            <button onClick={() => saveNote(selectedStudent.id)} disabled={savingNote} className="flex-1 bg-[var(--gold)] text-black py-1.5 rounded-lg font-bold hover:opacity-90 transition disabled:opacity-60 text-xs">{savingNote ? "..." : "حفظ"}</button>
                            <button onClick={() => setEditingNote(null)} className="border border-gray-200 text-[var(--text-gray)] px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition">إلغاء</button>
                          </div>
                        </div>
                      ) : notes[selectedStudent.id] ? (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3"><p className="text-xs text-blue-800 leading-relaxed">{notes[selectedStudent.id]}</p></div>
                      ) : <p className="text-xs text-[var(--text-gray)] text-center py-2">لا توجد ملاحظات بعد</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* الجلسات */}
          {activeTab === "sessions" && (
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[var(--lux-black)]">📡 الجلسات</h2>
                <button onClick={() => setActiveTab("add_session")} className="bg-[var(--gold)] text-black px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition">+ إضافة</button>
              </div>
              {sessions.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl"><p className="text-4xl mb-3">📡</p><p className="font-semibold text-[var(--lux-black)]">لا توجد جلسات بعد</p></div>
              ) : (
                <div className="flex flex-col gap-3">
                  {sessions.map(session => {
                    const isPast = new Date(session.date) < new Date();
                    const sectionName = mySections.find(s => s.id === session.section_id)?.name || "";
                    return (
                      <div key={session.id} className={`bg-white rounded-xl p-4 shadow-sm border ${isPast ? "border-gray-100 opacity-70" : "border-[var(--gold)]/20"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-semibold text-[var(--lux-black)] text-sm">{session.title}</p>
                            <p className="text-xs text-[var(--text-gray)] mt-0.5">{new Date(session.date).toLocaleDateString("ar-SA", { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {sectionName && <span className="text-xs bg-[var(--gold)]/10 text-[var(--gold)] px-2 py-0.5 rounded-full">{sectionName}</span>}
                              {isPast ? <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">انتهت</span> : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">قادمة</span>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button onClick={() => { setActiveTab("attendance"); setSelectedSessionForAttendance(session); fetchAttendance(session.id); }} className="text-xs bg-[var(--gold)]/10 text-[var(--gold)] px-3 py-1 rounded-lg hover:bg-[var(--gold)]/20 transition">✅ حضور</button>
                            <button onClick={() => { setEditingSession(session); setSessionForm({ title: session.title, date: session.date?.slice(0,16) || "", zoomLink: session.zoom_link, sectionId: session.section_id.toString(), isActive: session.is_active }); setActiveTab("add_session"); }} className="text-xs border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50 transition text-[var(--text-gray)]">تعديل</button>
                            <button onClick={() => deleteSession(session.id)} className="text-xs border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition text-red-500">حذف</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* الدروس */}
          {activeTab === "lessons" && (
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[var(--lux-black)]">🎬 الدروس</h2>
                <button onClick={() => setActiveTab("add_lesson")} className="bg-[var(--gold)] text-black px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition">+ إضافة</button>
              </div>
              {lessons.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl"><p className="text-4xl mb-3">🎬</p><p className="font-semibold text-[var(--lux-black)]">لا توجد دروس بعد</p></div>
              ) : (
                <div className="flex flex-col gap-3">
                  {lessons.map(lesson => {
                    const sectionName = mySections.find(s => s.id === lesson.section_id)?.name || "";
                    return (
                      <div key={lesson.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 overflow-hidden">
                            <p className="font-semibold text-[var(--lux-black)] text-sm">{lesson.title}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {sectionName && <span className="text-xs bg-[var(--gold)]/10 text-[var(--gold)] px-2 py-0.5 rounded-full">{sectionName}</span>}
                              {lesson.subject && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{lesson.subject}</span>}
                              {lesson.quiz_question && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">📝 اختبار</span>}
                              {lesson.pdf_url && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">📄 PDF</span>}
                            </div>
                            {lesson.description && <p className="text-xs text-[var(--text-gray)] mt-0.5 truncate">{lesson.description}</p>}
                          </div>
                          <button onClick={() => deleteLesson(lesson.id)} className="text-xs border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition text-red-500 shrink-0">حذف</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* إضافة جلسة */}
          {activeTab === "add_session" && (
            <div className="max-w-lg">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h3 className="font-bold text-[var(--lux-black)] mb-5">{editingSession ? "✏️ تعديل الجلسة" : "➕ إضافة جلسة جديدة"}</h3>
                {sessionMsg && <div className={`mb-4 p-3 rounded-xl text-sm text-center ${sessionMsg.includes("خطأ") || sessionMsg.includes("يرجى") ? "bg-red-50 border border-red-200 text-red-600" : "bg-green-50 border border-green-200 text-green-600"}`}>{sessionMsg}</div>}
                <div className="flex flex-col gap-4">
                  <div><label className="block text-sm font-medium text-[var(--lux-black)] mb-1">الشعبة *</label>
                    <select value={sessionForm.sectionId} onChange={(e) => setSessionForm(p => ({ ...p, sectionId: e.target.value }))} className={inp}>
                      {mySections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-[var(--lux-black)] mb-1">عنوان الجلسة *</label><input value={sessionForm.title} onChange={(e) => setSessionForm(p => ({ ...p, title: e.target.value }))} placeholder="مثال: درس أصول الفقه" className={inp} /></div>
                  <div><label className="block text-sm font-medium text-[var(--lux-black)] mb-1">التاريخ والوقت *</label><input type="datetime-local" value={sessionForm.date} onChange={(e) => setSessionForm(p => ({ ...p, date: e.target.value }))} className={inp} /></div>
                  <div><label className="block text-sm font-medium text-[var(--lux-black)] mb-1">رابط Meet/Zoom *</label><input value={sessionForm.zoomLink} onChange={(e) => setSessionForm(p => ({ ...p, zoomLink: e.target.value }))} placeholder="https://meet.google.com/..." className={inp} /></div>
                  <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={sessionForm.isActive} onChange={(e) => setSessionForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-[var(--gold)]" /><span className="text-sm text-[var(--lux-black)]">نشطة (تظهر للطلاب)</span></label>
                  <div className="flex gap-3">
                    <button onClick={saveSession} disabled={savingSession} className="flex-1 bg-[var(--gold)] text-black py-3 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-60">{savingSession ? "جاري الحفظ..." : editingSession ? "حفظ التعديلات" : "إضافة الجلسة"}</button>
                    {editingSession && <button onClick={() => { setEditingSession(null); setSessionForm({ title: "", date: "", zoomLink: "", sectionId: mySections[0]?.id?.toString() || "", isActive: true }); }} className="border border-gray-200 text-[var(--text-gray)] px-6 py-3 rounded-xl hover:bg-gray-50 transition text-sm">إلغاء</button>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* إضافة درس */}
          {activeTab === "add_lesson" && (
            <div className="max-w-lg">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h3 className="font-bold text-[var(--lux-black)] mb-5">🎬 إضافة درس جديد</h3>
                {lessonMsg && <div className={`mb-4 p-3 rounded-xl text-sm text-center ${lessonMsg.includes("خطأ") || lessonMsg.includes("يرجى") ? "bg-red-50 border border-red-200 text-red-600" : "bg-green-50 border border-green-200 text-green-600"}`}>{lessonMsg}</div>}
                <div className="flex flex-col gap-4">
                  <div><label className="block text-sm font-medium text-[var(--lux-black)] mb-1">الشعبة *</label>
                    <select value={lessonForm.sectionId} onChange={(e) => setLessonForm(p => ({ ...p, sectionId: e.target.value }))} className={inp}>
                      {mySections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-[var(--lux-black)] mb-1">عنوان الدرس *</label><input value={lessonForm.title} onChange={(e) => setLessonForm(p => ({ ...p, title: e.target.value }))} placeholder="مثال: مقدمة في أصول الفقه" className={inp} /></div>
                  <div><label className="block text-sm font-medium text-[var(--lux-black)] mb-1">رابط الفيديو *</label><input value={lessonForm.videoUrl} onChange={(e) => setLessonForm(p => ({ ...p, videoUrl: e.target.value }))} placeholder="https://youtube.com/..." className={inp} /></div>
                  <div><label className="block text-sm font-medium text-[var(--lux-black)] mb-1">المادة</label><input value={lessonForm.subject} onChange={(e) => setLessonForm(p => ({ ...p, subject: e.target.value }))} placeholder="مثال: أصول الفقه" className={inp} /></div>
                  <div><label className="block text-sm font-medium text-[var(--lux-black)] mb-1">الوصف</label><textarea value={lessonForm.description} onChange={(e) => setLessonForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف مختصر للدرس..." rows={2} className={`${inp} resize-none`} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-[var(--lux-black)] mb-1">المدة</label><input value={lessonForm.duration} onChange={(e) => setLessonForm(p => ({ ...p, duration: e.target.value }))} placeholder="مثال: 45 دقيقة" className={inp} /></div>
                    <div><label className="block text-sm font-medium text-[var(--lux-black)] mb-1">الترتيب</label><input type="number" value={lessonForm.order} onChange={(e) => setLessonForm(p => ({ ...p, order: e.target.value }))} min="0" className={inp} /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-[var(--lux-black)] mb-1">رابط PDF (اختياري)</label><input value={lessonForm.pdfUrl} onChange={(e) => setLessonForm(p => ({ ...p, pdfUrl: e.target.value }))} placeholder="https://drive.google.com/..." className={inp} /></div>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm font-bold text-[var(--lux-black)] mb-3">📝 اختبار تأكيد الحضور (اختياري)</p>
                    <div className="flex flex-col gap-3">
                      <div><label className="block text-sm text-[var(--text-gray)] mb-1">السؤال</label><input value={lessonForm.quizQuestion} onChange={(e) => setLessonForm(p => ({ ...p, quizQuestion: e.target.value }))} placeholder="مثال: ما هو تعريف أصول الفقه؟" className={inp} /></div>
                      <div><label className="block text-sm text-[var(--text-gray)] mb-1">الإجابة الصحيحة</label><input value={lessonForm.quizAnswer} onChange={(e) => setLessonForm(p => ({ ...p, quizAnswer: e.target.value }))} placeholder="الإجابة التي يجب أن يكتبها الطالب" className={inp} /></div>
                    </div>
                  </div>
                  <button onClick={saveLesson} disabled={savingLesson} className="w-full bg-[var(--gold)] text-black py-3 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-60">{savingLesson ? "جاري الحفظ..." : "إضافة الدرس 🎬"}</button>
                </div>
              </div>
            </div>
          )}

          {/* الحضور */}
          {activeTab === "attendance" && (
            <div className="space-y-5 max-w-2xl">
              <h2 className="text-xl font-bold text-[var(--lux-black)]">✅ الحضور</h2>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-[var(--lux-black)] mb-4">اختر جلسة</h3>
                <div className="flex flex-col gap-2">
                  {sessions.map(session => (
                    <div key={session.id} onClick={() => { setSelectedSessionForAttendance(session); fetchAttendance(session.id); setAttendanceMsg(""); }}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition ${selectedSessionForAttendance?.id === session.id ? "border-[var(--gold)] bg-[var(--gold)]/5" : "border-gray-100 hover:border-[var(--gold)]/30 bg-[var(--soft-white)]"}`}>
                      <p className="font-semibold text-[var(--lux-black)] text-sm">{session.title}</p>
                      <p className="text-xs text-[var(--text-gray)] mt-0.5">{new Date(session.date).toLocaleDateString("ar-SA", { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  ))}
                  {sessions.length === 0 && <p className="text-[var(--text-gray)] text-sm text-center py-4">لا توجد جلسات بعد</p>}
                </div>
              </div>

              {selectedSessionForAttendance && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[var(--lux-black)]">📋 {selectedSessionForAttendance.title}</h3>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-green-600">{Object.values(attendance).filter(Boolean).length}</p>
                      <p className="text-xs text-[var(--text-gray)]">من {(selectedSection?.students || allStudents).length}</p>
                    </div>
                  </div>
                  {attendanceMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm text-center">{attendanceMsg}</div>}
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => { const all: Record<number, boolean> = {}; (selectedSection?.students || allStudents).forEach(s => { all[s.id] = true; }); setAttendance(all); }} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition">✓ تحديد الكل</button>
                    <button onClick={() => setAttendance({})} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">✗ إلغاء الكل</button>
                  </div>
                  <div className="flex flex-col gap-2 mb-5">
                    {(selectedSection?.students || allStudents).map(student => {
                      const name = `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.email;
                      const isPresent = attendance[student.id] ?? false;
                      return (
                        <div key={student.id} onClick={() => setAttendance(p => ({ ...p, [student.id]: !p[student.id] }))}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition border-2 ${isPresent ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100 hover:border-gray-200"}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isPresent ? "bg-green-500" : "bg-gray-300"}`}>
                              <span className="text-white font-bold text-xs">{isPresent ? "✓" : name.charAt(0)}</span>
                            </div>
                            <p className={`font-medium text-sm ${isPresent ? "text-green-800" : "text-[var(--lux-black)]"}`}>{name}</p>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${isPresent ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>{isPresent ? "حاضر" : "غائب"}</span>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={saveAttendance} disabled={savingAttendance} className="w-full bg-[var(--gold)] text-black py-3 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-60">
                    {savingAttendance ? "جاري الحفظ..." : "💾 حفظ الحضور"}
                  </button>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
