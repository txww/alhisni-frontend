import Image from "next/image";

type StaffMember = {
  name: string;
  image: string;
  title: string;
};

const staff: StaffMember[] = [
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

function StaffAvatarCard({ member }: { member: StaffMember }) {
  return (
    <div className="group text-center">
      <div className="mx-auto relative h-36 w-36 md:h-40 md:w-40">
        {/* هالة ذهبية */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(198,168,91,0.55),rgba(198,168,91,0.12),transparent_70%)] blur-[2px]" />
        {/* إطار */}
        <div className="absolute inset-0 rounded-full border border-[var(--gold)]/55 shadow-[0_8px_22px_rgba(0,0,0,0.10)]" />
        {/* الصورة */}
        <div className="absolute inset-[10px] rounded-full overflow-hidden bg-[var(--soft-white)]">
          <div className="absolute inset-0 opacity-[0.22] [background:radial-gradient(circle_at_1px_1px,rgba(198,168,91,0.9)_1px,transparent_0)] [background-size:18px_18px]" />
          <Image
            src={member.image}
            alt={member.name}
            fill
            className="object-cover object-top"
            sizes="160px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        </div>
        {/* حلقة داخلية ذهبية */}
        <div className="absolute inset-[10px] rounded-full ring-2 ring-[var(--gold)]/40 ring-offset-0 transition group-hover:ring-[var(--gold)]/70" />
      </div>

      {/* الاسم والمسمى */}
      <div className="mt-4 px-2">
        <div className="text-base font-extrabold text-[var(--lux-black)] leading-snug">
          {member.name}
        </div>
        <div className="mt-1 text-xs font-semibold text-[var(--gold)] leading-snug">
          {member.title}
        </div>
      </div>
    </div>
  );
}

export default function StaffSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--lux-black)]">
            أعضاء هيئة التدريس
          </h2>
          <div className="mx-auto mt-3 h-[3px] w-16 rounded-full bg-[var(--gold)]" />
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-neutral-600">
            نخبة من أهل العلم يجمعون بين التحقيق العلمي والمنهجية المنضبطة.
          </p>
        </div>

        {/* Grid - صف أول 5 ثم صف ثاني 5 */}
        <div className="mt-12 grid gap-y-12 gap-x-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {staff.map((m, i) => (
            <StaffAvatarCard key={i} member={m} />
          ))}
        </div>
      </div>
    </section>
  );
}