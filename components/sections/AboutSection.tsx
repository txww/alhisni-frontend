export default function AboutSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">

        {/* العنوان */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[var(--lux-black)]">
            عن المعهد
          </h2>
          <div className="mx-auto mt-4 h-1 w-20 bg-[var(--gold)]" />
        </div>

        {/* النص التعريفي */}
        <div className="mx-auto mt-10 max-w-4xl text-center leading-9 text-[var(--text-gray)]">
          معهد شافعي تخصصي يُعِد منارات علمية في التأصيل الفقهي الشافعي،
          أصولًا وفروعًا وقواعد، ويسعى إلى الإسهام في خدمة الساحة العلمية
          والشرعية عبر تخريج كفاءات علمية متمكنة وملكات فقهية راسخة.
        </div>

        {/* الرؤية + الرسالة */}
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          
          <div className="rounded-2xl border border-black/10 bg-[var(--soft-white)] p-8">
            <h3 className="text-xl font-semibold text-[var(--gold)]">
              الرؤية
            </h3>
            <p className="mt-4 leading-8 text-neutral-700">
              الريادة في التأصيل الفقهي الشافعي، وبناء جيلٍ علميٍّ متمكن
              يمتلك ملكة فقهية راسخة، ويسهم بفاعلية في خدمة العلم الشرعي والمجتمع.
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-[var(--soft-white)] p-8">
            <h3 className="text-xl font-semibold text-[var(--gold)]">
              الرسالة
            </h3>
            <p className="mt-4 leading-8 text-neutral-700">
              تقديم تعليم فقهي تخصصي يقوم على المذهب الشافعي في أصوله وفروعه
              وقواعده، وفق منهج علمي مؤصّل، يهدف إلى إعداد كوادر علمية مؤهلة.
            </p>
          </div>

        </div>

        {/* الأهداف */}
        <div className="mt-20">
          <h3 className="text-center text-2xl font-semibold text-[var(--lux-black)]">
            أهداف المعهد
          </h3>
          <div className="mx-auto mt-4 h-1 w-16 bg-[var(--gold)]" />

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              "ترسيخ التأصيل الفقهي على منهج المذهب الشافعي أصولًا وفروعًا وقواعد.",
              "إعداد طلاب علم يمتلكون كفاءة علمية عالية وملكة فقهية راسخة.",
              "المحافظة على التراث الفقهي الشافعي والعناية به دراسةً وتحقيقًا.",
              "تنمية مهارات البحث الفقهي والاستنباط لدى الدارسين.",
              "غرس الانضباط الخُلقي في سلوك طالب العلم داخل البيئة التعليمية وخارجها.",
              "ترسيخ احترام الخلاف الفقهي وآدابه والابتعاد عن التعصب.",
              " الاهتمام بتزكية النفس وإصلاح القلب وتنمية الفكر والقلب",  
            ].map((goal, index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-xl border border-black/10 bg-[var(--soft-white)] p-6"
              >
                <div className="mt-1 h-2 w-2 rounded-full bg-[var(--gold)]" />
                <p className="leading-8 text-neutral-700">{goal}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
