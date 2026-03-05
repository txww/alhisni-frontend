import Image from "next/image";

const staff = [
  { name: "الشيخ المثنى بهجات الحريري", title: "مدير المعهد", image: "/staff/1.jpg" },
  { name: "د. إبراهيم يونس الحريري", title: "معاون مدير المعهد", image: "/staff/2.jpg" },
  { name: "الشيخ خالد الحسين", title: "مدرس أصول الفقه", image: "/staff/3.jpg" },
  { name: "الشيخ عمار الناصر", title: "مدرس أخلاق العلماء", image: "/staff/4.jpg" },
  { name: "الشيخ شادي القبط", title: "مدرس الفقه الشافعي", image: "/staff/5.jpg" },
  { name: "الشيخ محمد أمين علوه", title: "مدرس المدخل إلى الفقه الشافعي", image: "/staff/6.jpg" },
  { name: "الشيخ عبد الرزاق صياصنة", title: "مدرس المدخل إلى الفقه الشافعي", image: "/staff/7.jpg" },
  { name: "الشيخ يوسف اللكود", title: "مدرس القواعد الفقهية", image: "/staff/8.jpg" },
  { name: "د. سامر قنبس", title: "مدرس اللغة العربية", image: "/staff/9.jpg" },
  { name: "د. أسامة المقداد", title: "مدرس السلوك والأخلاق", image: "/staff/10.jpg" },
    { name:"الشيخ وهيب الحسنين", title:"مدرس القواعد الفقهية", image: "/staff/11.jpg" },
];

export default function TeachersSection() {
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
        <div className="mt-14 grid gap-10 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {staff.map((member, index) => (
            <div key={index} className="group text-center">
              {/* الصورة */}
              <div className="relative mx-auto h-36 w-36 md:h-40 md:w-40 overflow-hidden rounded-full border-4 border-[var(--gold)] shadow-md transition duration-300 group-hover:scale-105">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover object-top"
                  sizes="160px"
                />
              </div>

              {/* الاسم */}
              <h3 className="mt-5 text-sm font-bold text-[var(--lux-black)] leading-snug px-1">
                {member.name}
              </h3>

              <p className="mt-1 text-xs font-semibold text-[var(--gold)] leading-snug px-1">
                {member.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}