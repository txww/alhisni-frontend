"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const ADMIN_EMAIL = "admin@hisni.com";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.email) { setError("البريد الإلكتروني مطلوب"); return; }
    if (!form.password) { setError("كلمة المرور مطلوبة"); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${STRAPI_URL}/api/auth/local`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: form.email, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        return;
      }

      // جلب بيانات المستخدم الكاملة مع isTeacher
      const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${data.jwt}` },
      });
      const meData = await meRes.json();

      localStorage.setItem("jwt", data.jwt);
      document.cookie = `jwt=${data.jwt}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      localStorage.setItem("user", JSON.stringify(meData));

      // توجيه تلقائي حسب نوع المستخدم
      if (meData.email === ADMIN_EMAIL) {
        router.push("/hisni-control-panel/students");
      } else if (meData.isTeacher === true) {
        router.push("/teacher");
      } else {
        router.push("/dashboard");
      }

    } catch {
      setError("تعذّر الاتصال بالخادم، يرجى المحاولة لاحقاً");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--soft-white)] flex items-center justify-center px-4 py-16">
      <div className="flex gap-6 w-full max-w-3xl">

        {/* Side Panel */}
        <div className="hidden lg:flex w-72 flex-col bg-[var(--lux-black)] rounded-2xl p-8 text-white text-center justify-between">
          <div>
            <div className="w-24 h-24 rounded-full border-4 border-[var(--gold)] mx-auto mb-6 flex items-center justify-center">
              <span className="text-[var(--gold)] text-4xl font-bold">ح</span>
            </div>
            <h3 className="text-xl font-bold mb-2">أهلاً بعودتك</h3>
            <p className="text-gray-400 text-sm leading-relaxed">سجّل دخولك للوصول إلى لوحة التحكم الخاصة بك</p>
          </div>
          <div className="border-t border-gray-700 pt-6">
            <p className="text-gray-400 text-sm mb-3">ليس لديك حساب؟</p>
            <a href="/register" className="block w-full border border-[var(--gold)] text-[var(--gold)] py-2 rounded-lg text-sm font-semibold hover:bg-[var(--gold)] hover:text-white transition text-center">
              التسجيل الآن
            </a>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm p-8 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--lux-black)] mb-1">تسجيل الدخول</h1>
            <p className="text-[var(--text-gray)] text-sm">معهد الإمام تقي الدين الحصني</p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-right">{error}</div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">البريد الإلكتروني</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition"
                placeholder="example@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">كلمة المرور</label>
              <input name="password" type="password" value={form.password} onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition"
                placeholder="أدخل كلمة المرور" />
            </div>
            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-[var(--gold)] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-60 mt-2">
              {loading ? "جاري تسجيل الدخول..." : "دخول"}
            </button>
            <p className="text-center text-sm text-[var(--text-gray)] lg:hidden">
              ليس لديك حساب؟{" "}
              <a href="/register" className="text-[var(--gold)] font-semibold hover:underline">سجّل الآن</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}