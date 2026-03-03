import Image from "next/image";

export default function TeachersSection() {
  const teachers = [1, 2, 3];

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* العنوان */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[var(--lux-black)]">
            الكادر التدريسي
          </h2>
          <div className="mx-auto mt-4 h-1 w-20 bg-[var(--gold)]" />
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-[var(--text-gray)]">
            نخبة من المتخصصين في الفقه الشافعي والتأصيل العلمي، يجمعون بين
            التمكّن العلمي والمنهجية المنضبطة.
          </p>
        </div>

        {/* البطاقات */}
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {teachers.map((_, index) => (
            <div
              key={index}
              className="group text-center"
            >
              {/* الصورة */}
              <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-full border-4 border-[var(--gold)] shadow-md transition duration-300 group-hover:scale-105">
                <Image
                  src="/teacher-placeholder.jpg"
                  alt="عضو هيئة تدريس"
                  fill
                  className="object-cover"
                />
              </div>

              {/* الاسم (مجهول) */}
              <h3 className="mt-6 text-lg font-semibold text-[var(--lux-black)]">
                عضو هيئة تدريس
              </h3>

              <p className="mt-2 text-sm text-[var(--text-gray)]">
                متخصص في الفقه الشافعي وأصوله
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
