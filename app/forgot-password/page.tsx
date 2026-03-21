"use client";

import { useState } from "react";
import Link from "next/link";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email) { setError("البريد الإلكتروني مطلوب"); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${STRAPI_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        setError("حدث خطأ، تأكد من البريد الإلكتروني وحاول مجدداً");
      }
    } catch {
      setError("تعذّر الاتصال بالخادم، يرجى المحاولة لاحقاً");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--soft-white)] flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full border-4 border-[var(--gold)] flex items-center justify-center mx-auto mb-4">
            <span className="text-[var(--gold)] text-2xl">🔑</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--lux-black)] mb-1">نسيت كلمة المرور؟</h1>
          <p className="text-[var(--text-gray)] text-sm">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-lg font-bold text-[var(--lux-black)] mb-2">تم الإرسال!</h2>
            <p className="text-[var(--text-gray)] text-sm mb-6">
              تم إرسال رابط إعادة تعيين كلمة المرور إلى <span className="font-semibold text-[var(--lux-black)]">{email}</span>
            </p>
            <p className="text-xs text-[var(--text-gray)] mb-6">تحقق من صندوق الوارد أو مجلد الرسائل غير المرغوبة</p>
            <Link href="/login" className="block w-full bg-[var(--gold)] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition text-center">
              العودة لتسجيل الدخول
            </Link>
          </div>
        ) : (
          <>
            {error && <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-right">{error}</div>}

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">البريد الإلكتروني</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right text-black bg-white focus:outline-none focus:border-[var(--gold)] transition"
                  placeholder="example@email.com" />
              </div>

              <button onClick={handleSubmit} disabled={loading}
                className="w-full bg-[var(--gold)] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-60">
                {loading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
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