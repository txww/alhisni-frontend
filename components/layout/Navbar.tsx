"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const ADMIN_EMAIL = "admin@hisni.com";

const navLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/features", label: "المميزات" },
  { href: "/study-plan", label: "الخطة الدراسة" },
  { href: "/regulations", label: "لائحة المعهد الإدارية" },
  { href: "/staff", label: "الكادر التدريسي" },
];

interface User {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  isTeacher?: boolean;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) { setUser(null); return; }

    // جلب بيانات المستخدم الحالية من Strapi
    fetch(`${STRAPI_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && !data.error) {
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
        } else {
          localStorage.removeItem("jwt");
          localStorage.removeItem("user");
          setUser(null);
        }
      })
      .catch(() => {
        const stored = localStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));
      });
  }, [pathname]);

  const handleLogout = () => {
localStorage.removeItem("jwt");
localStorage.removeItem("user");
document.cookie = "jwt=; path=/; max-age=0";
    setUser(null);
    setDropdownOpen(false);
    router.push("/");
  };

  const isAdmin = user?.email === ADMIN_EMAIL;
  const isTeacher = user?.isTeacher === true;

  // رابط اللوحة حسب نوع المستخدم
  const panelLink = isAdmin
    ? "/hisni-control-panel/students"
    : isTeacher
    ? "/teacher"
    : "/dashboard";

  const panelLabel = isAdmin
    ? "لوحة الإدارة"
    : isTeacher
    ? "بوابة المدرسين"
    : "لوحة الطالب";

  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "حسابي"
    : null;

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-black/70 backdrop-blur-md border-b border-[var(--gold)]/20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex h-16 items-center justify-between">

            {/* يمين: الشعار */}
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo-transparent1.png"
                alt="شعار المعهد"
                width={64}
                height={64}
                priority
                className="drop-shadow-[0_2px_14px_rgba(198,168,91,0.35)]"
              />
              <div className="leading-tight">
                <div className="text-sm font-semibold text-[var(--gold)]">معهد الإمام الحصني</div>
                <div className="text-[11px] text-white/65">للتفقه الشافعي</div>
              </div>
            </Link>

            {/* وسط: روابط */}
            <nav className="hidden lg:flex items-center gap-7 text-sm font-bold tracking-wide">
              {navLinks.map((l) => {
                const active = pathname === l.href;
                return (
                  <Link key={l.href} href={l.href}
                    className={["relative py-2 transition", active ? "text-[var(--gold)]" : "text-white/85 hover:text-white"].join(" ")}>
                    {l.label}
                    <span className={["absolute left-0 right-0 -bottom-[10px] mx-auto h-[2px] w-8 rounded-full transition", active ? "bg-[var(--gold)]" : "bg-transparent"].join(" ")} />
                  </Link>
                );
              })}
            </nav>

            {/* يسار: أزرار */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <div className="relative">
                  <button onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-white/5 px-4 py-2 text-xs font-semibold text-[var(--gold)] hover:bg-white/10 transition">
                    <div className="w-6 h-6 rounded-full bg-[var(--gold)] flex items-center justify-center text-black font-bold text-xs">
                      {(displayName || "").charAt(0).toUpperCase()}
                    </div>
                    {displayName}
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                      <Link href={panelLink} onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 text-right">
                        {isAdmin ? "🏛️" : isTeacher ? "👨‍🏫" : "🎓"}
                        <span>{panelLabel}</span>
                      </Link>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 text-right border-t border-gray-100">
                        🚪 <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login"
                    className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold text-white/85 hover:bg-white/10">
                    دخول
                  </Link>
                  <Link href="/register"
                    className="rounded-full bg-[var(--gold)] px-6 py-2 text-xs font-semibold text-black hover:opacity-90">
                    تسجيل
                  </Link>
                </>
              )}
            </div>

            {/* زر الموبايل */}
            <button type="button" onClick={() => setOpen((v) => !v)}
              className="lg:hidden inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10"
              aria-label="فتح القائمة" aria-expanded={open}>
              {open ? "إغلاق" : "القائمة"}
            </button>
          </div>
        </div>
      </div>

      {/* قائمة الموبايل */}
      {open && (
        <div className="lg:hidden border-b border-[var(--gold)]/15 bg-black/85 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <nav className="grid gap-2">
              {navLinks.map((l) => {
                const active = pathname === l.href;
                return (
                  <Link key={l.href} href={l.href}
                    className={["rounded-xl px-4 py-3 text-sm transition", active ? "bg-white/10 text-[var(--gold)]" : "text-white/85 hover:bg-white/10 hover:text-white"].join(" ")}>
                    {l.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {user ? (
                <>
                  <Link href={panelLink}
                    className="rounded-xl border border-[var(--gold)]/40 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-[var(--gold)]">
                    {panelLabel}
                  </Link>
                  <button onClick={handleLogout}
                    className="rounded-xl border border-red-400/40 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-red-400">
                    خروج
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login"
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white/90 hover:bg-white/10">
                    دخول
                  </Link>
                  <Link href="/register"
                    className="rounded-xl bg-[var(--gold)] px-4 py-3 text-center text-sm font-semibold text-black hover:opacity-90">
                    تسجيل
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}