import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden min-h-[calc(100vh-64px)]">
      {/* صورة الخلفية */}
      <div className="absolute inset-0">
        <Image
          src="/hero.jpg"
          alt="خلفية إسلامية"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* طبقات التعتيم */}
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/70" />

      {/* المحتوى */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center px-6">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold leading-tight text-white md:text-6xl">
            معهد الإمام تقيّ الدين الحصني
            <span className="mt-3 block text-[var(--gold)]">للتفقّه الشافعي</span>
          </h1>

          <p className="mt-6 max-w-2xl leading-8 text-white/85">

معهد شافعي تخصصي يُعِد منارات علمية في التأصيل الفقهي الشافعي، أصولًا وفروعًا وقواعد، ويطمح إلى الإسهام في خدمة الساحة العلمية والشرعية عبر تخريج كفاءات علمية متمكنة وملكات فقهية رفيعة
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/study-plan"
              className="rounded-full bg-[var(--gold)] px-7 py-3 text-sm font-semibold text-black hover:opacity-90"
            >
              خطة الدراسة
            </Link>

            <Link
              href="/register"
              className="rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-semibold text-white hover:bg-white/15"
            >
              التسجيل
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
