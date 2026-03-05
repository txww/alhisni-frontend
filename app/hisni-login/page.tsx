"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/hisni-control-panel/students");
    } else {
      setError("كلمة المرور غير صحيحة");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[var(--lux-black)] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full border-4 border-[var(--gold)] flex items-center justify-center mx-auto mb-4">
          <span className="text-[var(--gold)] text-2xl font-bold">ح</span>
        </div>
        <h2 className="text-xl font-bold text-[var(--lux-black)] mb-1">لوحة الإدارة</h2>
        <p className="text-[var(--text-gray)] text-sm mb-6">معهد الإمام تقي الدين الحصني</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          placeholder="كلمة المرور"
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-center text-black bg-white focus:outline-none focus:border-[var(--gold)] transition mb-4"
        />
        <button onClick={handleLogin} disabled={loading}
          className="w-full bg-[var(--gold)] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-60">
          {loading ? "جاري التحقق..." : "دخول"}
        </button>
      </div>
    </main>
  );
}