"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const ADMIN_EMAIL = "admin@hisni.com";

interface Student {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  telegram?: string;
  nationality?: string;
  residenceCountry?: string;
  educationLevel?: string;
  gender?: string;
  registrationStatus?: string;
  academicYear?: string;
  birthDate?: string;
  isTeacher?: boolean;
}

interface Teacher {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  teacherYear?: string;
  teacherSubject?: string;
  isTeacher?: boolean;
}

interface ZoomSession {
  id: number;
  title: string;
  date: string;
  zoomLink: string;
  academicYear: string;
  isActive: boolean;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: "قيد المراجعة", color: "text-yellow-700", bg: "bg-yellow-100" },
  approved: { label: "مقبول",        color: "text-green-700",  bg: "bg-green-100"  },
  rejected: { label: "مرفوض",        color: "text-red-700",    bg: "bg-red-100"    },
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

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition text-sm";

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<"students" | "sessions" | "teachers">("students");

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [updating, setUpdating] = useState(false);

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

  // التحقق من الجلسة عند التحميل
  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) { setChecking(false); router.push("/login"); return; }

    fetch(`${STRAPI_URL}/api/users/me`, { headers: { Authorization: `Bearer ${jwt}` } })
      .then(r => r.json())
      .then(data => {
        if (data?.email === ADMIN_EMAIL) {
          setAuthed(true);
        } else {
          // ليس المدير — أعد التوجيه
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setChecking(false));
  }, [router]);

  useEffect(() => {
    if (authed) { fetchStudents(); fetchSessions(); fetchTeachers(); }
  }, [authed]);

  const getJwt = () => localStorage.getItem("jwt") || "";

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
    setSessions(Array.isArray(data?.data)
      ? data.data.map((s: ZoomSession & { documentId?: string }) => ({ id: s.id, title: s.title, date: s.date, zoomLink: s.zoomLink, academicYear: s.academicYear, isActive: s.isActive }))
      : []);
    setLoadingSessions(false);
  };

  const handleLogout = () => {
localStorage.removeItem("jwt");
localStorage.removeItem("user");
document.cookie = "jwt=; path=/; max-age=0";
    router.push("/login");
  };

  const updateStudent = async (studentId: number, updates: Partial<Student>) => {
    setUpdating(true);
    await fetch(`${STRAPI_URL}/api/users/${studentId}`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getJwt()}` },
      body: JSON.stringify(updates),
    });
    await fetchStudents();
    setSelected((prev) => prev ? { ...prev, ...updates } : null);
    setUpdating(false);
  };

  const saveTeacher = async () => {
    if (!teacherForm.firstName || !teacherForm.lastName || !teacherForm.email) { setTeacherMsg("يرجى ملء الاسم والإيميل"); return; }
    if (!editingTeacher && !teacherForm.password) { setTeacherMsg("كلمة المرور مطلوبة لإنشاء حساب جديد"); return; }
    setSavingTeacher(true);

    if (editingTeacher) {
      const body: Record<string, unknown> = { firstName: teacherForm.firstName, lastName: teacherForm.lastName, phone: teacherForm.phone, teacherYear: teacherForm.teacherYear, teacherSubject: teacherForm.teacherSubject, isTeacher: true };
      if (teacherForm.password) body.password = teacherForm.password;
      const res = await fetch(`${STRAPI_URL}/api/users/${editingTeacher.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getJwt()}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { setTeacherMsg("حدث خطأ في التعديل"); setSavingTeacher(false); return; }
      setTeacherMsg("تم تعديل بيانات المدرس ✓");
    } else {
      const registerRes = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: teacherForm.email, email: teacherForm.email, password: teacherForm.password }),
      });
      const registerData = await registerRes.json();
      if (!registerRes.ok) { setTeacherMsg(registerData?.error?.message || "حدث خطأ"); setSavingTeacher(false); return; }
      await fetch(`${STRAPI_URL}/api/users/${registerData.user.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getJwt()}` },
        body: JSON.stringify({ firstName: teacherForm.firstName, lastName: teacherForm.lastName, phone: teacherForm.phone, isTeacher: true, teacherYear: teacherForm.teacherYear, teacherSubject: teacherForm.teacherSubject }),
      });
      setTeacherMsg("تم إنشاء حساب المدرس بنجاح ✓");
    }

    setTeacherForm({ firstName: "", lastName: "", email: "", password: "", phone: "", teacherYear: "year1", teacherSubject: "" });
    setEditingTeacher(null);
    setShowTeacherForm(false);
    await fetchTeachers();
    setSavingTeacher(false);
    setTimeout(() => setTeacherMsg(""), 4000);
  };

  const deleteTeacher = async (teacher: Teacher) => {
    if (!confirm(`هل تريد حذف حساب ${teacher.firstName || teacher.email}؟`)) return;
    await fetch(`${STRAPI_URL}/api/users/${teacher.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getJwt()}` } });
    await fetchTeachers();
  };

  const startEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setTeacherForm({ firstName: teacher.firstName || "", lastName: teacher.lastName || "", email: teacher.email, password: "", phone: teacher.phone || "", teacherYear: teacher.teacherYear || "year1", teacherSubject: teacher.teacherSubject || "" });
    setShowTeacherForm(true);
  };

  const saveSession = async () => {
    if (!sessionForm.title || !sessionForm.date || !sessionForm.zoomLink) { setSessionMsg("يرجى ملء جميع الحقول المطلوبة"); return; }
    setSavingSession(true);
    const url = editingSession ? `${STRAPI_URL}/api/zoom-sessions/${editingSession.id}` : `${STRAPI_URL}/api/zoom-sessions`;
    await fetch(url, {
      method: editingSession ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getJwt()}` },
      body: JSON.stringify({ data: sessionForm }),
    });
    setSessionMsg(editingSession ? "تم تعديل الجلسة ✓" : "تمت إضافة الجلسة ✓");
    setSessionForm({ title: "", date: "", zoomLink: "", academicYear: "year1", isActive: true });
    setEditingSession(null);
    await fetchSessions();
    setSavingSession(false);
    setTimeout(() => setSessionMsg(""), 3000);
  };

  const deleteSession = async (id: number) => {
    if (!confirm("هل تريد حذف هذه الجلسة؟")) return;
    await fetch(`${STRAPI_URL}/api/zoom-sessions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getJwt()}` } });
    await fetchSessions();
  };

  const startEditSession = (session: ZoomSession) => {
    setEditingSession(session);
    setSessionForm({ title: session.title, date: session.date ? session.date.slice(0, 16) : "", zoomLink: session.zoomLink || "", academicYear: session.academicYear || "year1", isActive: session.isActive ?? true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filtered = students.filter((s) => {
    const matchesFilter = filter === "all" || s.registrationStatus === filter;
    return matchesFilter && `${s.firstName || ""} ${s.lastName || ""} ${s.email}`.toLowerCase().includes(search.toLowerCase());
  });

  if (checking) return (
    <main className="min-h-screen bg-[var(--lux-black)] flex items-center justify-center">
      <div className="text-[var(--gold)] text-lg">جاري التحقق...</div>
    </main>
  );

  if (!authed) return null;

  return (
    <main className="min-h-screen bg-[var(--soft-white)] py-8 px-4">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--lux-black)]">لوحة الإدارة</h1>
            <p className="text-[var(--text-gray)] text-sm">معهد الإمام تقي الدين الحصني</p>
          </div>
          <button onClick={handleLogout} className="border border-gray-300 text-[var(--text-gray)] px-5 py-2 rounded-lg text-sm hover:bg-gray-100 transition">خروج</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "إجمالي الطلاب", value: students.length, color: "text-[var(--lux-black)]" },
            { label: "قيد المراجعة", value: students.filter(s => s.registrationStatus === "pending").length, color: "text-yellow-600" },
            { label: "مقبولون", value: students.filter(s => s.registrationStatus === "approved").length, color: "text-green-600" },
            { label: "المدرسون", value: teachers.length, color: "text-purple-600" },
            { label: "الجلسات", value: sessions.length, color: "text-blue-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[var(--text-gray)] text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[{ id: "students", label: "الطلاب", icon: "👥" }, { id: "teachers", label: "المدرسون", icon: "👨‍🏫" }, { id: "sessions", label: "جلسات Zoom", icon: "🎥" }].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as "students" | "sessions" | "teachers")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? "bg-[var(--gold)] text-white" : "bg-white border border-gray-200 text-[var(--text-gray)]"}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* الطلاب */}
        {activeTab === "students" && (
          <>
            <div className="flex flex-wrap gap-3 mb-5">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الإيميل..."
                className="border border-gray-200 rounded-lg px-4 py-2 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition flex-1 min-w-48" />
              {["all", "pending", "approved", "rejected"].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f ? "bg-[var(--gold)] text-white" : "bg-white border border-gray-200 text-[var(--text-gray)]"}`}>
                  {f === "all" ? "الكل" : f === "pending" ? "قيد المراجعة" : f === "approved" ? "مقبولون" : "مرفوضون"}
                </button>
              ))}
              <button onClick={() => exportCSV(filtered)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition">📥 تصدير Excel</button>
            </div>
            <div className="flex gap-5">
              <div className="flex-1">
                {loadingStudents ? <div className="text-center py-10 text-[var(--gold)]">جاري التحميل...</div>
                  : filtered.length === 0 ? <div className="text-center py-10 text-[var(--text-gray)]">لا يوجد طلاب</div>
                  : (
                    <div className="flex flex-col gap-3">
                      {filtered.map((student) => {
                        const st = statusMap[student.registrationStatus || "pending"];
                        const name = `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.email;
                        return (
                          <div key={student.id} onClick={() => setSelected(student)}
                            className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition border-2 ${selected?.id === student.id ? "border-[var(--gold)]" : "border-transparent"}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-[var(--lux-black)]">{name}</p>
                                <p className="text-sm text-[var(--text-gray)]">{student.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {student.phone && <p className="text-xs text-[var(--text-gray)]">{student.phone}</p>}
                                  {student.academicYear && <span className="text-xs bg-[var(--gold)]/10 text-[var(--gold)] px-2 py-0.5 rounded-full">{yearMap[student.academicYear]}</span>}
                                </div>
                              </div>
                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${st.bg} ${st.color}`}>{st.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
              {selected && (
                <div className="w-80 bg-white rounded-2xl shadow-sm p-6 h-fit sticky top-8">
                  <div className="text-center mb-5">
                    <div className="w-14 h-14 rounded-full bg-[var(--lux-black)] flex items-center justify-center mx-auto mb-3">
                      <span className="text-[var(--gold)] text-xl font-bold">{(`${selected.firstName || ""} ${selected.lastName || ""}`.trim() || selected.email).charAt(0)}</span>
                    </div>
                    <h3 className="font-bold text-[var(--lux-black)]">{`${selected.firstName || ""} ${selected.lastName || ""}`.trim() || selected.email}</h3>
                    <p className="text-sm text-[var(--text-gray)]">{selected.email}</p>
                  </div>
                  <div className="flex flex-col gap-2 mb-4 text-sm">
                    {selected.birthDate && <Detail label="العمر" value={`${calcAge(selected.birthDate)} سنة`} />}
                    {selected.gender && <Detail label="الجنس" value={genderMap[selected.gender] || selected.gender} />}
                    {selected.phone && <Detail label="الهاتف" value={selected.phone} />}
                    {selected.telegram && <Detail label="تليجرام" value={selected.telegram} />}
                    {selected.nationality && <Detail label="الجنسية" value={selected.nationality} />}
                    {selected.residenceCountry && <Detail label="بلد الإقامة" value={selected.residenceCountry} />}
                    {selected.educationLevel && <Detail label="المؤهل" value={educationMap[selected.educationLevel] || selected.educationLevel} />}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[var(--lux-black)] mb-2">السنة الدراسية</label>
                    <select value={selected.academicYear || ""} onChange={(e) => updateStudent(selected.id, { academicYear: e.target.value })}
                      disabled={updating} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition text-sm">
                      <option value="">غير محدد</option>
                      {Object.entries(yearMap).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => updateStudent(selected.id, { registrationStatus: "approved" })} disabled={updating || selected.registrationStatus === "approved"}
                      className="w-full bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-40">✓ قبول</button>
                    <button onClick={() => updateStudent(selected.id, { registrationStatus: "rejected" })} disabled={updating || selected.registrationStatus === "rejected"}
                      className="w-full bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-40">✗ رفض</button>
                    <button onClick={() => updateStudent(selected.id, { registrationStatus: "pending" })} disabled={updating || selected.registrationStatus === "pending"}
                      className="w-full border border-gray-200 text-[var(--text-gray)] py-2 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-40">إعادة للمراجعة</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* المدرسون */}
        {activeTab === "teachers" && (
          <div className="flex gap-5">
            <div className="flex-1">
              {teacherMsg && (
                <div className={`mb-4 p-3 rounded-lg text-sm text-center ${teacherMsg.includes("خطأ") || teacherMsg.includes("يرجى") ? "bg-red-50 border border-red-200 text-red-600" : "bg-green-50 border border-green-200 text-green-600"}`}>
                  {teacherMsg}
                </div>
              )}
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[var(--lux-black)]">قائمة المدرسين ({teachers.length})</h3>
                <button onClick={() => { setShowTeacherForm(true); setEditingTeacher(null); setTeacherForm({ firstName: "", lastName: "", email: "", password: "", phone: "", teacherYear: "year1", teacherSubject: "" }); }}
                  className="bg-[var(--gold)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">+ إضافة مدرس</button>
              </div>
              {loadingTeachers ? <div className="text-center py-10 text-[var(--gold)]">جاري التحميل...</div>
                : teachers.length === 0 ? <div className="text-center py-10 text-[var(--text-gray)]">لا يوجد مدرسون بعد</div>
                : (
                  <div className="flex flex-col gap-3">
                    {teachers.map((teacher) => {
                      const name = `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() || teacher.email;
                      return (
                        <div key={teacher.id} className="bg-white rounded-xl p-4 shadow-sm border-2 border-transparent hover:border-[var(--gold)]/30 transition">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[var(--lux-black)] flex items-center justify-center shrink-0">
                                <span className="text-[var(--gold)] font-bold text-sm">{name.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-[var(--lux-black)]">{name}</p>
                                <p className="text-sm text-[var(--text-gray)]">{teacher.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {teacher.teacherSubject && <span className="text-xs text-[var(--text-gray)]">{teacher.teacherSubject}</span>}
                                  {teacher.teacherYear && <span className="text-xs bg-[var(--gold)]/10 text-[var(--gold)] px-2 py-0.5 rounded-full">{yearMap[teacher.teacherYear]}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => startEditTeacher(teacher)} className="text-xs border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50 transition text-[var(--text-gray)]">تعديل</button>
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
              <div className="w-80 shrink-0">
                <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
                  <h3 className="font-bold text-[var(--lux-black)] mb-4">{editingTeacher ? "تعديل بيانات المدرس" : "إضافة مدرس جديد"}</h3>
                  <div className="flex flex-col gap-3">
                    <div><label className="block text-xs font-medium text-[var(--text-gray)] mb-1">الاسم الأول *</label><input value={teacherForm.firstName} onChange={(e) => setTeacherForm(p => ({ ...p, firstName: e.target.value }))} placeholder="الاسم الأول" className={inp} /></div>
                    <div><label className="block text-xs font-medium text-[var(--text-gray)] mb-1">الاسم الأخير *</label><input value={teacherForm.lastName} onChange={(e) => setTeacherForm(p => ({ ...p, lastName: e.target.value }))} placeholder="الاسم الأخير" className={inp} /></div>
                    <div><label className="block text-xs font-medium text-[var(--text-gray)] mb-1">البريد الإلكتروني *</label><input type="email" value={teacherForm.email} onChange={(e) => setTeacherForm(p => ({ ...p, email: e.target.value }))} placeholder="teacher@example.com" className={inp} disabled={!!editingTeacher} /></div>
                    <div><label className="block text-xs font-medium text-[var(--text-gray)] mb-1">{editingTeacher ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور *"}</label><input type="password" value={teacherForm.password} onChange={(e) => setTeacherForm(p => ({ ...p, password: e.target.value }))} placeholder="6 أحرف على الأقل" className={inp} /></div>
                    <div><label className="block text-xs font-medium text-[var(--text-gray)] mb-1">رقم الهاتف</label><input value={teacherForm.phone} onChange={(e) => setTeacherForm(p => ({ ...p, phone: e.target.value }))} placeholder="+963..." className={inp} /></div>
                    <div><label className="block text-xs font-medium text-[var(--text-gray)] mb-1">السنة الدراسية *</label>
                      <select value={teacherForm.teacherYear} onChange={(e) => setTeacherForm(p => ({ ...p, teacherYear: e.target.value }))} className={inp}>
                        {Object.entries(yearMap).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-xs font-medium text-[var(--text-gray)] mb-1">المادة التي يدرّسها</label><input value={teacherForm.teacherSubject} onChange={(e) => setTeacherForm(p => ({ ...p, teacherSubject: e.target.value }))} placeholder="مثال: أصول الفقه" className={inp} /></div>
                    <div className="flex gap-2 mt-1">
                      <button onClick={saveTeacher} disabled={savingTeacher} className="flex-1 bg-[var(--gold)] text-white py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-60 text-sm">
                        {savingTeacher ? "جاري الحفظ..." : editingTeacher ? "حفظ" : "إنشاء الحساب"}
                      </button>
                      <button onClick={() => { setShowTeacherForm(false); setEditingTeacher(null); }} className="border border-gray-200 text-[var(--text-gray)] px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">إلغاء</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* الجلسات */}
        {activeTab === "sessions" && (
          <div className="flex gap-5">
            <div className="w-80 shrink-0">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-[var(--lux-black)] mb-4">{editingSession ? "تعديل الجلسة" : "إضافة جلسة جديدة"}</h3>
                {sessionMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm text-center">{sessionMsg}</div>}
                <div className="flex flex-col gap-3">
                  <div><label className="block text-xs font-medium text-[var(--text-gray)] mb-1">عنوان الجلسة *</label><input value={sessionForm.title} onChange={(e) => setSessionForm(p => ({ ...p, title: e.target.value }))} placeholder="مثال: لقاء إثرائي" className={inp} /></div>
                  <div><label className="block text-xs font-medium text-[var(--text-gray)] mb-1">التاريخ والوقت *</label><input type="datetime-local" value={sessionForm.date} onChange={(e) => setSessionForm(p => ({ ...p, date: e.target.value }))} className={inp} /></div>
                  <div><label className="block text-xs font-medium text-[var(--text-gray)] mb-1">رابط Zoom *</label><input value={sessionForm.zoomLink} onChange={(e) => setSessionForm(p => ({ ...p, zoomLink: e.target.value }))} placeholder="https://zoom.us/j/..." className={inp} /></div>
                  <div><label className="block text-xs font-medium text-[var(--text-gray)] mb-1">السنة الدراسية</label>
                    <select value={sessionForm.academicYear} onChange={(e) => setSessionForm(p => ({ ...p, academicYear: e.target.value }))} className={inp}>
                      {Object.entries(yearMap).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={sessionForm.isActive} onChange={(e) => setSessionForm(p => ({ ...p, isActive: e.target.checked }))} className="accent-[var(--gold)]" /><span className="text-sm text-[var(--lux-black)]">نشطة (تظهر للطلاب)</span></label>
                  <button onClick={saveSession} disabled={savingSession} className="w-full bg-[var(--gold)] text-white py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-60">{savingSession ? "جاري الحفظ..." : editingSession ? "حفظ التعديلات" : "إضافة الجلسة"}</button>
                  {editingSession && <button onClick={() => { setEditingSession(null); setSessionForm({ title: "", date: "", zoomLink: "", academicYear: "year1", isActive: true }); }} className="w-full border border-gray-200 text-[var(--text-gray)] py-2 rounded-lg font-semibold hover:bg-gray-50 transition text-sm">إلغاء التعديل</button>}
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
                        <div key={session.id} className={`bg-white rounded-xl p-4 shadow-sm border-2 ${isPast ? "border-gray-100 opacity-70" : "border-transparent"}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-[var(--lux-black)]">{session.title}</p>
                                {!session.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">مخفية</span>}
                                {isPast && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">انتهت</span>}
                              </div>
                              <p className="text-sm text-[var(--text-gray)]">{new Date(session.date).toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-[var(--gold)]/10 text-[var(--gold)] px-2 py-0.5 rounded-full">{yearMap[session.academicYear]}</span>
                                <a href={session.zoomLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate max-w-48">{session.zoomLink}</a>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => startEditSession(session)} className="text-xs border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50 transition text-[var(--text-gray)]">تعديل</button>
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
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-gray-50 pb-1">
      <span className="text-[var(--text-gray)]">{label}</span>
      <span className="font-medium text-[var(--lux-black)]">{value}</span>
    </div>
  );
}