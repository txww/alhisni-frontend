export default function ServicesSection() {
  const items = [
    "منصة إلكترونية شاملة مرتبة الدروس بمواعيدها واختبارات دورية ومتابعة للإنجاز.",
    "خطة علمية محكمة معدّة من قبل متخصصين مع تدرج مناسب لأغلب أحوال الناس.",
    "تأهيل الدارس لاستخراج الضوابط والفروق الفقهية ومعرفة الإشكالات وطريقة حلّها.",
    "تدرّج في دراسة الكتب الفقهية المعتمدة مع مراجعة وحفظ ما يلزم وفق آلية واضحة.",
  ];

  return (
    <section className="bg-[var(--soft-white)] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[var(--lux-black)]">
            ما نقدمه لك
          </h2>
          <div className="mx-auto mt-4 h-1 w-20 bg-[var(--gold)]" />
          <p className="mx-auto mt-5 max-w-3xl text-[var(--text-gray)] leading-8">
            باقة تعليمية منظمة تساعد الطالب على بناء التأصيل الفقهي وتطوير الملكة العلمية
            ضمن مسار واضح ومتابعة مستمرة.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {items.map((text, i) => (
            <div
              key={i}
              className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gold)] text-black">
                  ✦
                </span>
                <p className="leading-8 text-neutral-800">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
