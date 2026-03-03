import Link from "next/link";

const features = [
  {
    title: "منهج شافعي مؤصّل",
    desc: "تعليم تخصصي في أصول المذهب الشافعي وفروعه وقواعده، وفق منهج علمي مضبوط.",
    icon: "📘",
  },
  {
    title: "تعليم إلكتروني مرن",
    desc: "متابعة الدروس في أي وقت عبر المنصة، مع خطة أسبوعية واضحة قبل بدء كل أسبوع.",
    icon: "🖥️",
  },
  {
    title: "لقاءات علمية مباشرة",
    desc: "لقاءان شهريان إثرائيان مباشرَان لتعميق الفهم وبناء الصلة العلمية.",
    icon: "🎙️",
  },
  {
    title: "أنشطة تطبيقية",
    desc: "تطبيقات مرافقة لكل درس لتعزيز الفهم وترسيخ الملكة الفقهية.",
    icon: "📝",
  },
  {
    title: "برنامج لحفظ المتون",
    desc: "مقرر حفظ منتظم بمتوسط صفحتين أسبوعيًا وفق النسخ المعتمدة من المعهد.",
    icon: "📜",
  },
  {
    title: "تنمية مهارات البحث",
    desc: "تطوير مهارات البحث والاستنباط والانضباط المنهجي لدى الدارسين.",
    icon: "🔎",
  },
];

function FeatureCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <div className="group rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--lux-black)] text-[18px] text-[var(--gold)]">
          {icon}
        </div>

        <div>
          <h3 className="text-base font-extrabold text-[var(--lux-black)]">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-7 text-neutral-600">{desc}</p>

          <div className="mt-4 h-[2px] w-10 rounded-full bg-[var(--gold)]/70 transition group-hover:w-16" />
        </div>
      </div>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <main className="bg-[var(--soft-white)]">
      {/* Header */}
      <section className="relative overflow-hidden bg-[var(--lux-black)]">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]" />
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm font-bold text-[var(--gold)]">المعهد</p>

          <h1 className="mt-3 text-3xl font-extrabold text-white md:text-4xl">
            مميزات الدراسة في المعهد
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-8 text-white/75">
            مميزات مصممة لبناء طالب علمٍ منضبطٍ منهجيًا، يجمع بين التأصيل العلمي
            والمرونة في التعلّم.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-full bg-[var(--gold)] px-6 py-3 text-sm font-extrabold text-black hover:opacity-90"
            >
              التسجيل الآن
            </Link>
            <Link
              href="/study-plan"
              className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/15"
            >
              استعرض الخطة الدراسية
            </Link>
          </div>
        </div>

        {/* خط ذهبي */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>

        {/* CTA bottom */}
        <div className="mt-12 rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-extrabold text-[var(--lux-black)]">
                هل ترغب بالانضمام؟
              </h2>
              <p className="mt-2 text-sm leading-7 text-neutral-600">
                ابدأ رحلتك العلمية بخطة واضحة ودراسة منضبطة.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/register"
                className="rounded-full bg-[var(--lux-black)] px-6 py-3 text-sm font-extrabold text-white hover:opacity-90"
              >
                التسجيل
              </Link>
              <Link
                href="/about"
                className="rounded-full border border-black/10 bg-[var(--soft-white)] px-6 py-3 text-sm font-bold text-[var(--lux-black)] hover:bg-white"
              >
                تعرّف أكثر
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}