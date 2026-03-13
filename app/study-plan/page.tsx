"use client";
import { useState } from "react";

const studyPlan = [
  {
    year: "السنة الأولى",
    semesters: [
      {
        title: "الفصل الأول",
        subjects: [
          { name: "الفقه", memorization: "", core: "متن  الغاية والتقريب\nتحقيق ماجد الحموي", supplementary: "", enrichment: "" },
          { name: "أصول الفقه", memorization: "الورقات", core: "الورقات في أصول الفقه\nت: عبدالمحسن القاسم", supplementary: "", enrichment: "" },
          { name: "القواعد الفقهية", memorization: "", core: "الخلاصة في القواعد الفقهية عند الشافعية\nلعبد الله بن سعيد المخاشن", supplementary: "", enrichment: "" },
          { name: "النحو", memorization: "", core: "حقيبة المشجرات والتمرينات على الآجرومية ونظمها\nمركز تميز، دار مفكرون بلا حدود", supplementary: "", enrichment: "" },
          { name: "المذهب", memorization: "", core: "", supplementary: "- التعليق على المدخل إلى مذهب الإمام الشافعي\nدار الخير (إندونيسيا)\n- توالي التأسيس لمعالي محمد بن إدريس\nدار الكتب العلمية", enrichment: "" },
          { name: "الآداب", memorization: "", core: "", supplementary: "", enrichment: "التربية النبوية\nلمحمد عبدالله الدرويش طبعة دار اليقين" },
          { name: "متفرقات", memorization: "", core: "", supplementary: "", enrichment: "- صفحات من صبر العلماء\nعبدالفتاح أبو غدة\nدار السلام / دار البشائر" },
        ],
      },
      {
        title: "الفصل الثاني",
        subjects: [
          { name: "الفقه", memorization: "مختصر أبي شجاع (1)\nدار المنهاج", core: "فتح القريب المجيب (2)\nدار المنهاج/ دار ابن حزم", supplementary: "", enrichment: "" },
          { name: "أصول الفقه", memorization: "", core: "شرح المحلي على الورقات\nدار ابن حزم", supplementary: "", enrichment: "" },
          { name: "الصرف", memorization: "", core: "الصرف الصغير\nسليمان العيوني، دار طيبة الخضراء", supplementary: "", enrichment: "" },
          { name: "الإملاء", memorization: "", core: "قواعد الإملاء\nعبدالسلام هارون، دار الطلائع", supplementary: "", enrichment: "" },
          { name: "المنطق", memorization: "", core: "إيساغوجي\nالمكتبة الهاشمية", supplementary: "ضوابط المعرفة\nدار القلم", enrichment: "" },
          { name: "البحث والمناظرة", memorization: "", core: "", supplementary: "رسالة الآداب لطاشكبري زادة\nت: حايف النبهان، دار الظاهرية", enrichment: "" },
          { name: "الآداب", memorization: "", core: "", supplementary: "", enrichment: "حرمة أهل العلم\nمحمد المقدم، دار الإيمان" },
          { name: "متفرقات", memorization: "", core: "", supplementary: "", enrichment: "- إصلاح الفقيه\nهيثم الرومي، مركز نماء\n- فقه تاريخ الفقه\nهيثم الرومي" },
        ],
      },
    ],
  },
  {
    year: "السنة الثانية",
    semesters: [
      {
        title: "الفصل الأول",
        subjects: [
          { name: "الفقه", memorization: "مختصر أبي شجاع (2)\nدار المنهاج", core: "عمدة السالك وعدة الناسك (1)\nدار المنهاج", supplementary: "", enrichment: "" },
          { name: "أصول الفقه", memorization: "", core: "دروس أصول الفقه المكية (1)\nدائرة الأوقاف (دبي)", supplementary: "لطائف الإشارات على تسهيل الطرقات\nدار الفتح/ مركز تفكر", enrichment: "" },
          { name: "النحو", memorization: "", core: "شرح قطر الندى وبل الصدى (1)\nالمكتبة العصرية/ دار الطلائع", supplementary: "", enrichment: "" },
          { name: "البلاغة", memorization: "", core: "زبدة البلاغة\nمحمد نصيف، دار طيبة الخضراء", supplementary: "", enrichment: "" },
          { name: "المذهب", memorization: "", core: "", supplementary: "الفوائد المكية فيما يحتاجه طلبة الشافعية\nت: حميد الحالمي، مركز النور", enrichment: "المدخل إلى المذهب الشافعي\nدار الإمتاء الأردنية" },
          { name: "متفرقات", memorization: "", core: "", supplementary: "", enrichment: "- الماجريات\nإبراهيم السكران، دار الحضارة\n- المجالس الفقهية\nهيثم الرومي، مركز تكوين" },
        ],
      },
      {
        title: "الفصل الثاني",
        subjects: [
          { name: "الفقه", memorization: "مختصر أبي شجاع (3)\nدار المنهاج", core: "عمدة السالك وعدة الناسك (2)\nدار المنهاج", supplementary: "", enrichment: "" },
          { name: "أصول الفقه", memorization: "", core: "دروس أصول الفقه المكية (2)\nدائرة الأوقاف (دبي)", supplementary: "المدخل إلى أصول الإمام الشافعي\nمرتضى الداغستاني، دار الفاتح", enrichment: "" },
          { name: "القواعد الفقهية", memorization: "", core: "الفرائد البهية في الفوائد القواعد الفقهية\nت: أنور أبو زيد، دار الميمنة", supplementary: "إيضاح القواعد الفقهية\nلطلاب المدرسة الصولتية\nت: أحمد الحداد، دار الضياء", enrichment: "" },
          { name: "النحو", memorization: "", core: "شرح قطر الندى وبل الصدى (2)\nالمكتبة العصرية/ دار الطلائع", supplementary: "", enrichment: "" },
          { name: "مصطلحات", memorization: "", core: "", supplementary: "", enrichment: "" },
          { name: "التزكية", memorization: "", core: "", supplementary: "", enrichment: "مطهرة القلوب\nمن قترة العيوب (1)\nمحمد مولود بن أحمد فال" },
          { name: "متفرقات", memorization: "", core: "", supplementary: "", enrichment: "- مسلكيات\nإبراهيم السكران، دار الحضارة\n- صناعة التفكير الفقهي\nمشاري الشثري، مركز تكوين" },
        ],
      },
    ],
  },
  {
    year: "السنة الثالثة",
    semesters: [
      {
        title: "الفصل الأول",
        subjects: [
          { name: "الفقه", memorization: "العبادات من المنهاج (1)\nدار المنهاج", core: "منهاج الطالبين وعمدة المفتين (1)\nدار المنهاج", supplementary: "الديباج شرح المنهاج (1)\nدار المنهاج", enrichment: "" },
          { name: "أصول الفقه", memorization: "", core: "دروس أصول الفقه المكية (3)\nدائرة الأوقاف (دبي)", supplementary: "", enrichment: "" },
          { name: "النحو", memorization: "", core: "شرح قطر الندى وبل الصدى (3)\nالمكتبة العصرية/ دار الطلائع", supplementary: "", enrichment: "" },
          { name: "تخريج الفروع", memorization: "", core: "", supplementary: "مفتاح الوصول إلى بناء الفروع على الأصول (1)\nت: محمد علي فركوس، مؤسسة الريان", enrichment: "التخريج عند الفقهاء والأصوليين (1)\nيعقوب الباحسين، مكتبة الرشد" },
          { name: "مصطلحات", memorization: "", core: "", supplementary: "تبصرة المحتاج بما خفي من مصطلح المنهاج\nدار الضياء", enrichment: "" },
          { name: "التزكية", memorization: "", core: "", supplementary: "", enrichment: "مطهرة القلوب\nمن قترة العيوب (2)\nمحمد مولود بن أحمد فال" },
          { name: "التراجم", memorization: "", core: "", supplementary: "", enrichment: "العقد المذهب\nفي طبقات حملة المذهب (1)\nدار الكتب العلمية" },
        ],
      },
      {
        title: "الفصل الثاني",
        subjects: [
          { name: "الفقه", memorization: "العبادات من المنهاج (2)\nدار المنهاج", core: "منهاج الطالبين وعمدة المفتين (2)\nدار المنهاج", supplementary: "الديباج شرح المنهاج (2)\nدار المنهاج", enrichment: "" },
          { name: "أصول الفقه", memorization: "", core: "لب الأصول في أصول الفقه (1)\nت: آصف جيلاني الجاوي", supplementary: "", enrichment: "" },
          { name: "الفرائض", memorization: "", core: "شرح الرحبية في علم الفرائض\nسبط الماردينى، دار القلم", supplementary: "", enrichment: "" },
          { name: "تخريج الفروع", memorization: "", core: "", supplementary: "مفتاح الوصول إلى بناء الفروع على الأصول (2)\nت: محمد علي فركوس، مؤسسة الريان", enrichment: "التخريج عند الفقهاء والأصوليين (2)\nيعقوب الباحسين، مكتبة الرشد" },
          { name: "مصطلحات", memorization: "", core: "", supplementary: "الفوائد المدنية فيمن يفتي بقوله من أئمة الشافعية\nت: بسام الجابي، دار نور الصباح", enrichment: "" },
          { name: "التزكية", memorization: "", core: "", supplementary: "", enrichment: "مطهرة القلوب\nمن قترة العيوب (3)\nمحمد مولود بن أحمد فال" },
          { name: "التراجم", memorization: "", core: "", supplementary: "", enrichment: "العقد المذهب\nفي طبقات حملة المذهب (2)\nدار الكتب العلمية" },
        ],
      },
    ],
  },
  {
    year: "السنة الرابعة",
    semesters: [
      {
        title: "الفصل الأول",
        subjects: [
          { name: "الفقه", memorization: "العبادات من المنهاج (3)\nدار المنهاج", core: "منهاج الطالبين وعمدة المفتين (3)\nدار المنهاج", supplementary: "الديباج شرح المنهاج (3)\nدار المنهاج", enrichment: "" },
          { name: "أصول الفقه", memorization: "", core: "لب الأصول في أصول الفقه (2)\nت: آصف جيلاني الجاوي", supplementary: "", enrichment: "" },
          { name: "تخريج الفروع", memorization: "", core: "التمهيد في تخريج الفروع على الأصول\nجمال الدين الإسنوي، مؤسسة الرسالة", supplementary: "", enrichment: "" },
          { name: "متفرقات", memorization: "", core: "", supplementary: "مختارات من المجموع للنووي\nت: محمد المطيعي، مكتبة الإرشاد", enrichment: "- مختارات من تفسير الكيا الهراسي\n- الفكر السامي في تاريخ الفقه الإسلامي (1)\nالمكتبة العلمية (المدينة)" },
        ],
      },
      {
        title: "الفصل الثاني",
        subjects: [
          { name: "الفقه", memorization: "العبادات من المنهاج (4)\nدار المنهاج", core: "منهاج الطالبين وعمدة المفتين (4)\nدار المنهاج", supplementary: "الديباج شرح المنهاج (4)\nدار المنهاج", enrichment: "" },
          { name: "أصول الفقه", memorization: "", core: "جمع الجوامع (1)\nت: عبدالله الداغستاني، دار طيبة الخضراء", supplementary: "", enrichment: "" },
          { name: "المقاصد", memorization: "", core: "مختصر الفوائد في اختصار المقاصد\nت: إياد خالد الطباع، دار الفكر", supplementary: "", enrichment: "" },
          { name: "الجدل", memorization: "", core: "", supplementary: "المعونة في الجدل\nت: علي العميريني، جمعية إحياء التراث الإسلامي\n/ ت: عبدالمجيد تركي، دار الغرب الإسلامي", enrichment: "" },
          { name: "متفرقات", memorization: "", core: "", supplementary: "مختارات من المعاملات من موسوعة الفقه الإسلامي والقضايا المعاصرة\nوهبة الزحيلي، دار الفكر", enrichment: "- معركة النص\nمهد العجلان، آفاق المعرفة\n- الفكر السامي في تاريخ الفقه الإسلامي (2)\nالمكتبة العلمية (المدينة)" },
        ],
      },
    ],
  },
  {
    year: "السنة الخامسة",
    semesters: [
      {
        title: "الفصل الأول",
        subjects: [
          { name: "الفقه", memorization: "العبادات من المنهاج (5)\nدار المنهاج", core: "منهاج الطالبين وعمدة المفتين (5)\nدار المنهاج", supplementary: "الديباج شرح المنهاج (5)\nدار المنهاج", enrichment: "" },
          { name: "أصول الفقه", memorization: "", core: "جمع الجوامع (2)\nت: عبدالله الداغستاني، دار طيبة الخضراء", supplementary: "", enrichment: "" },
          { name: "أحاديث الأحكام", memorization: "", core: "متع العلام بشرح أحاديث الأحكام (1)\nدار المنع", supplementary: "", enrichment: "" },
          { name: "التراجم", memorization: "", core: "", supplementary: "عماد الرضا ببيان أدب الجيرة بعدن (1)\nمطبعه صناء الجيرة بعدن (اليمن)", enrichment: "مختارات من\nطبقات الشافعية الكبرى (1)\nت: عبدالفتاح الحلو، محمود الطناحي" },
          { name: "متفرقات", memorization: "", core: "", supplementary: "- جماع العلام للإمام الشافعي\nت: أحمد محمد شاكر\n- مختارات من تحصين المأخذ عن الغزالي\nدار أسمار (الكويت)", enrichment: "التمذهب دراسة نظرية نقدية (1)\nدار التدمرية" },
        ],
      },
      {
        title: "الفصل الثاني",
        subjects: [
          { name: "الفقه", memorization: "العبادات من المنهاج (6)\nدار المنهاج", core: "منهاج الطالبين وعمدة المفتين (6)\nدار المنهاج", supplementary: "الديباج شرح المنهاج (6)\nدار المنهاج", enrichment: "" },
          { name: "أصول الفقه", memorization: "", core: "جمع الجوامع (3)\nت: عبدالله الداغستاني، دار طيبة الخضراء", supplementary: "", enrichment: "" },
          { name: "أحاديث الأحكام", memorization: "", core: "متع العلام بشرح أحاديث الأحكام (2)\nدار المنع", supplementary: "", enrichment: "" },
          { name: "القضاء", memorization: "", core: "", supplementary: "عماد الرضا ببيان أدب الجيرة بعدن (2)\nمطبعه صناء الجيرة بعدن (اليمن)", enrichment: "" },
          { name: "التراجم", memorization: "", core: "", supplementary: "", enrichment: "مختارات من\nطبقات الشافعية الكبرى (2)\nت: عبدالفتاح الحلو، محمود الطناحي" },
          { name: "متفرقات", memorization: "", core: "- التخريج عند الفقهاء والأصوليين\nيعقوب الباحسين، مكتبة الرشد\n- دلالات الألفاظ في مناهج الأصوليين\nالتدمرية", supplementary: "", enrichment: "التمذهب دراسة نظرية نقدية (2)\nدار التدمرية" },
        ],
      },
    ],
  },
];

export default function StudyPlanPage() {
  const [activeYear, setActiveYear] = useState(0);

  const year = studyPlan[activeYear];

  return (
    <main className="min-h-screen bg-[var(--soft-white)]">

      {/* Hero */}
      <div className="bg-[var(--lux-black)] py-14 px-4 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">خطة الدراسة</h1>
        <div className="w-12 h-0.5 bg-[var(--gold)] mx-auto mb-3" />
        <p className="text-gray-400 text-sm">معهد الإمام تقي الدين الحصني للتفقه الشافعي</p>
      </div>

      {/* Year Tabs */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 flex overflow-x-auto">
          {studyPlan.map((y, i) => (
            <button key={i} onClick={() => setActiveYear(i)}
              className={`px-5 py-4 text-sm font-medium whitespace-nowrap transition border-b-2 ${
                activeYear === i
                  ? "border-[var(--gold)] text-[var(--gold)]"
                  : "border-transparent text-[var(--text-gray)] hover:text-[var(--lux-black)]"
              }`}>
              {y.year}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-10">
          {year.semesters.map((semester, si) => (
            <div key={si}>
              {/* Semester Header */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 rounded-full bg-[var(--gold)] flex items-center justify-center text-white font-bold shrink-0">
                  {si + 1}
                </div>
                <h2 className="text-xl font-bold text-[var(--lux-black)]">{semester.title}</h2>
                <div className="flex-1 h-px bg-[var(--gold)]/20" />
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {semester.subjects.map((subject, idx) => (
                  <div key={idx} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                    {/* Card Header */}
                    <div className="bg-[var(--lux-black)] px-5 py-3 flex items-center justify-between">
                      <span className="text-white font-bold">{subject.name}</span>
                      <div className="flex gap-1">
                        {subject.memorization && <span className="text-xs bg-[var(--gold)] text-black px-2 py-0.5 rounded-full font-medium">حفظ</span>}
                        {subject.core && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">أساسي</span>}
                        {subject.supplementary && <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full font-medium">تكميلي</span>}
                        {subject.enrichment && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">إثرائي</span>}
                      </div>
                    </div>
                    {/* Card Body */}
                    <div className="p-4 flex flex-col gap-3">
                      {subject.memorization && (
                        <div className="flex gap-3">
                          <span className="text-xs font-bold text-[var(--gold)] bg-[var(--gold)]/10 px-2 py-1 rounded-lg h-fit whitespace-nowrap">حفظ</span>
                          <p className="text-sm text-[var(--lux-black)] leading-relaxed whitespace-pre-line">{subject.memorization}</p>
                        </div>
                      )}
                      {subject.core && (
                        <div className="flex gap-3">
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg h-fit whitespace-nowrap">أساسي</span>
                          <p className="text-sm text-[var(--lux-black)] leading-relaxed whitespace-pre-line">{subject.core}</p>
                        </div>
                      )}
                      {subject.supplementary && (
                        <div className="flex gap-3">
                          <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg h-fit whitespace-nowrap">تكميلي</span>
                          <p className="text-sm text-[var(--lux-black)] leading-relaxed whitespace-pre-line">{subject.supplementary}</p>
                        </div>
                      )}
                      {subject.enrichment && (
                        <div className="flex gap-3">
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg h-fit whitespace-nowrap">إثرائي</span>
                          <p className="text-sm text-[var(--lux-black)] leading-relaxed whitespace-pre-line">{subject.enrichment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </main>
  );
}