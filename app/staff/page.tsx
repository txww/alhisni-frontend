import Image from "next/image";

type StaffMember = {
  name: string;
  image: string;
  title?: string;
};

const staff: StaffMember[] = [
  { name: "ش. محمد سالم", image: "/teacher-placeholder.jpg" },
  { name: "ش. سعيد الجابري", image: "/teacher-placeholder.jpg" },
  { name: "د. أحمد العدوي", image: "/teacher-placeholder.jpg    " },

];

function StaffAvatarCard({ member }: { member: StaffMember }) {
  return (
    <div className="group text-center">
      {/* الدائرة */}
      <div className="mx-auto relative h-36 w-36 md:h-40 md:w-40">
        {/* هالة ذهبية */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(198,168,91,0.55),rgba(198,168,91,0.12),transparent_70%)] blur-[2px]" />

        {/* إطار */}
        <div className="absolute inset-0 rounded-full border border-[var(--gold)]/55 shadow-[0_8px_22px_rgba(0,0,0,0.10)]" />

        {/* خلفية زخرفة داخل الدائرة */}
        <div className="absolute inset-[10px] rounded-full overflow-hidden bg-[var(--soft-white)]">
          {/* بديل زخرفة بدون صورة */}
          <div className="absolute inset-0 opacity-[0.22] [background:radial-gradient(circle_at_1px_1px,rgba(198,168,91,0.9)_1px,transparent_0)] [background-size:18px_18px]" />

          {/* لو عندك ملف زخرفة حقيقي فعّل هذا */}
          {/* 
          <Image
            src="/patterns/arabesque.png"
            alt=""
            fill
            className="object-cover opacity-[0.28]"
          />
          */}

          {/* الصورة */}
          <Image
            src={member.image}
            alt={member.name}
            fill
            className="object-cover"
            sizes="160px"
          />

          {/* فاصل ناعم */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        </div>

        {/* حلقة داخلية ذهبية */}
        <div className="absolute inset-[10px] rounded-full ring-2 ring-[var(--gold)]/40 ring-offset-0 transition group-hover:ring-[var(--gold)]/70" />
      </div>

      {/* الاسم */}
      <div className="mt-4">
        <div className="text-base font-extrabold text-[var(--lux-black)]">
          {member.name}
        </div>
        {member.title ? (
          <div className="mt-1 text-sm font-semibold text-neutral-600">
            {member.title}
          </div>
        ) : null}
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

        {/* Grid */}
        <div className="mt-12 grid gap-y-12 gap-x-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {staff.map((m, i) => (
            <StaffAvatarCard key={i} member={m} />
          ))}
        </div>
      </div>
    </section>
  );
}