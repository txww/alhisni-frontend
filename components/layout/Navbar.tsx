"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/features", label: "المميزات" },
  { href: "/study-plan", label: "الخطة الدراسة" },
  { href: "/regulations", label: "لائحة المعهد الإدارية" },
  { href: "/staff", label: "الكادر التدريسي" },
];

interface User {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const jwt = localStorage.getItem("jwt");
    if (stored && jwt) {
      setUser(JSON.parse(stored));
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
    setUser(null);
    setDropdownOpen(false);
    router.push("/");
  };

  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "حسابي"
    : null;

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-black/70 backdrop-blur-md border-b border-[var(--gold)]/20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex h-16 items-center justify-between">

            {/* يمين: الشعار + الاسم */}
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
                <div className="text-sm font-semibold text-[var(--gold)]">
                  معهد الإمام الحصني
                </div>
                <div className="text-[11px] text-white/65">للتفقه الشافعي</div>
              </div>
            </Link>

            {/* وسط: روابط الديسكتوب */}
            <nav className="hidden lg:flex items-center gap-7 text-sm font-bold tracking-wide">
              {navLinks.map((l) => {
                const active = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={[
                      "relative py-2 transition",
                      active ? "text-[var(--gold)]" : "text-white/85 hover:text-white",
                    ].join(" ")}
                  >
                    {l.label}
                    <span
                      className={[
                        "absolute left-0 right-0 -bottom-[10px] mx-auto h-[2px] w-8 rounded-full transition",
                        active ? "bg-[var(--gold)]" : "bg-transparent",
                      ].join(" ")}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* يسار: أزرار */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-white/5 px-4 py-2 text-xs font-semibold text-[var(--gold)] hover:bg-white/10 transition"
                  >
                    <div className="w-6 h-6 rounded-full bg-[var(--gold)] flex items-center justify-center text-black font-bold text-xs">
                      {(displayName || "").charAt(0).toUpperCase()}
                    </div>
                    {displayName}
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute left-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 text-right"
                      >
                        لوحة الطالب
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full block px-4 py-3 text-sm text-red-500 hover:bg-red-50 text-right border-t border-gray-100"
                      >
                        تسجيل الخروج
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold text-white/85 hover:bg-white/10"
                  >
                    دخول
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full bg-[var(--gold)] px-6 py-2 text-xs font-semibold text-black hover:opacity-90"
                  >
                    تسجيل
                  </Link>
                </>
              )}
            </div>

            {/* زر الموبايل */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10"
              aria-label="فتح القائمة"
              aria-expanded={open}
            >
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
                  <Link
                    key={l.href}
                    href={l.href}
                    className={[
                      "rounded-xl px-4 py-3 text-sm transition",
                      active
                        ? "bg-white/10 text-[var(--gold)]"
                        : "text-white/85 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-xl border border-[var(--gold)]/40 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-[var(--gold)]"
                  >
                    لوحتي
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-xl border border-red-400/40 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-red-400"
                  >
                    خروج
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white/90 hover:bg-white/10"
                  >
                    دخول
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-xl bg-[var(--gold)] px-4 py-3 text-center text-sm font-semibold text-black hover:opacity-90"
                  >
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