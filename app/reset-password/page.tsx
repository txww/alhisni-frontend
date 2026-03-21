"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) setError("رابط غير صالح أو منتهي الصلاحية");
  }, [code]);

  const handleSubmit = async () => {
    if (!form.password) { setError("كلمة المرور مطلوبة"); return; }
    if (form.password.length < 6) { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (form.password !== form.confirmPassword) { setError("كلمتا المرور غير متطابقتين"); return; }
    if (!code) { setError("رابط غير صالح"); return; }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${STRAPI_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, password: form.password, passwordConfirmation: form.confirmPassword }),
      });

      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError("حدث خطأ، الرابط منتهي الصلاحية أو غير صالح");
      }
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--soft-white)] flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full border-4 border-[var(--gold)] flex items-center justify-center mx-auto mb-4">
            <span className="text-[var(--gold)] text-2xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--lux-black)] mb-1">إعادة تعيين كلمة المرور</h1>
          <p className="text-[var(--text-gray)] text-sm">أدخل كلمة المرور الجديدة</p>
        </div>

        {done ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-lg font-bold text-[var(--lux-black)] mb-2">تم التغيير بنجاح!</h2>
            <p className="text-[var(--text-gray)] text-sm mb-6">سيتم توجيهك لصفحة الدخول تلقائياً...</p>
            <Link href="/login" className="block w-full bg-[var(--gold)] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition text-center">
              تسجيل الدخول الآن
            </Link>
          </div>
        ) : (
          <>
            {error && <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-right">{error}</div>}

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">كلمة المرور الجديدة</label>
                <input type="password" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition"
                  placeholder="6 أحرف على الأقل" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">تأكيد كلمة المرور</label>
                <input type="password" value={form.confirmPassword} onChange={(e) => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition"
                  placeholder="أعد إدخال كلمة المرور" />
              </div>

              <button onClick={handleSubmit} disabled={loading || !code}
                className="w-full bg-[var(--gold)] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-60">
                {loading ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
              </button>

              <Link href="/login" className="text-center text-sm text-[var(--text-gray)] hover:text-[var(--gold)] transition">
                ← العودة لتسجيل الدخول
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[var(--soft-white)] flex items-center justify-center"><div className="text-[var(--gold)]">جاري التحميل...</div></main>}>
      <ResetPasswordForm />
    </Suspense>
  );
}