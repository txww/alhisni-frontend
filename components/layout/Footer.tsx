import Image from "next/image";
import Link from "next/link";

const QuickLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/about", label: "عن المعهد" },
  { href: "/study-plan", label: "الخطة الدراسية" },
  { href: "/regulations", label: "اللوائح" },
  { href: "/staff", label: "الكادر" },
];

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0" fill="none" aria-hidden="true">
      <path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0" fill="none" aria-hidden="true">
      <path
        d="M7 4h3l2 5-2 1c1.2 2.4 3.1 4.3 5.5 5.5l1-2 5 2v3c0 1.1-.9 2-2 2C10.3 21 3 13.7 3 4c0-1.1.9-2 2-2h2Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function IconLocation() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0" fill="none" aria-hidden="true">
      <path
        d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-[var(--lux-black)] text-white">
      {/* زخرفة خفيفة + glow ذهبي */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-80 w-[700px] -translate-x-1/2 rounded-full bg-[var(--gold)]/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.06] [background:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
      </div>

      {/* خط ذهبي علوي */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[var(--gold)]/80 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-transparent1.png"
                alt="شعار المعهد"
                width={54}
                height={54}
                className="drop-shadow-[0_10px_30px_rgba(198,168,91,0.18)]"
              />
              <div className="leading-tight">
                <div className="text-base font-extrabold text-[var(--gold)]">
                  معهد الإمام تقيّ الدين الحصني
                </div>
                <div className="text-xs text-white/65">للتفقّه الشافعي</div>
              </div>
            </div>

            <p className="mt-5 max-w-md text-sm leading-7 text-white/70">
              معهدٌ شافعي تخصصي يُعِد منارات علمية في التأصيل الفقهي الشافعي
              أصولًا وفروعًا وقواعد، ويسعى لتخريج كفاءات علمية متمكنة.
            </p>

            {/* شريط صغير ذهبي */}
            <div className="mt-6 h-[2px] w-24 rounded-full bg-[var(--gold)]/80" />
          </div>

          {/* Links */}
          <div className="lg:col-span-5">
            <h3 className="text-sm font-extrabold tracking-wide text-[var(--gold)]">
              روابط الموقع
            </h3>

            <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {QuickLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="group text-white/75 transition hover:text-white"
                >
                  <span className="inline-block h-[1px] w-0 bg-[var(--gold)] align-middle transition-all duration-300 group-hover:w-4" />
                  <span className="mr-2">{l.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-extrabold tracking-wide text-[var(--gold)]">
              معلومات التواصل
            </h3>

            <ul className="mt-5 space-y-4 text-sm text-white/75">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[var(--gold)]">
                  <IconMail />
                </span>
                <span>alamam.alhisniu@gmail.com</span>
              </li>

              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[var(--gold)]">
                  <IconPhone />
                </span>
                <span></span>
              </li>

              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[var(--gold)]">
                  <IconLocation />
                </span>
                <span>سوريا</span>
              </li>
            </ul>

            {/* Call to action صغير */}
            <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="text-xs font-bold text-white/80">جاهز للتسجيل؟</div>
              <Link
                href="/register"
                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[var(--gold)] px-4 py-2 text-xs font-extrabold text-black hover:opacity-90"
              >
                التسجيل الآن
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* شريط الحقوق */}
      <div className="relative border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center text-xs text-white/60">
          © {new Date().getFullYear()} معهد الإمام تقيّ الدين الحصني – جميع الحقوق محفوظة
        </div>
      </div>
    </footer>
  );
}