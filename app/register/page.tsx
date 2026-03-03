"use client";

import { useState } from "react";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gender: "",
    birthDate: "",
    nationality: "",
    residenceCountry: "",
    educationLevel: "",
    telegram: "",
    howDidYouKnow: "",
    worksFullTime: false,
    otherInstitutes: false,
    availableHours: "",
    agreeToTerms: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const value =
      target.type === "checkbox"
        ? (target as HTMLInputElement).checked
        : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
  };

  const validateStep1 = () => {
    if (!form.firstName) return "الاسم الأول مطلوب";
    if (!form.lastName) return "الاسم الأخير مطلوب";
    if (!form.email) return "البريد الإلكتروني مطلوب";
    if (!form.phone) return "رقم الهاتف مطلوب";
    if (!form.password) return "كلمة المرور مطلوبة";
    if (form.password !== form.confirmPassword) return "كلمتا المرور غير متطابقتين";
    if (form.password.length < 8) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
    return "";
  };

  const validateStep2 = () => {
    if (!form.residenceCountry) return "بلد الإقامة مطلوب";
    if (!form.telegram) return "رقم أو معرف التليجرام مطلوب";
    if (!form.agreeToTerms) return "يجب الموافقة على الشروط والأحكام";
    return "";
  };

  const handleNextStep = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
  };
const handleSubmit = async () => {
  const err = validateStep2();
  if (err) { setError(err); return; }
  setError("");
  setLoading(true);

  try {
    // الخطوة 1: تسجيل المستخدم
    const registerRes = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.email,
        email: form.email,
        password: form.password,
      }),
    });

    const registerData = await registerRes.json();

    if (!registerRes.ok) {
      const msg = registerData?.error?.message || "حدث خطأ، يرجى المحاولة مجدداً";
      setError(msg);
      return;
    }

    const jwt = registerData.jwt;
    const userId = registerData.user.id;

    // الخطوة 2: تحديث البيانات الإضافية
    await fetch(`${STRAPI_URL}/api/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
body: JSON.stringify({
  firstName: form.firstName,
  lastName: form.lastName,
  phone: form.phone,
  gender: form.gender || null,
  birthDate: form.birthDate || null,
  nationality: form.nationality || null,
  residenceCountry: form.residenceCountry,
  educationLevel: form.educationLevel || null,
  telegram: form.telegram,
  howDidYouKnow: form.howDidYouKnow || null,
  worksFullTime: form.worksFullTime,
  otherInstitutes: form.otherInstitutes,
  availableHours: form.availableHours || null,
  registrationStatus: "pending",
}),
    });

    localStorage.setItem("jwt", jwt);
    localStorage.setItem("user", JSON.stringify(registerData.user));

    setSuccess(true);
  } catch {
    setError("تعذّر الاتصال بالخادم، يرجى المحاولة لاحقاً");
  } finally {
    setLoading(false);
  }
};

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--soft-white)] px-4">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full bg-[var(--gold)] flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[var(--lux-black)] mb-3">تم التسجيل بنجاح!</h2>
          <p className="text-[var(--text-gray)] leading-relaxed">
            شكراً لتسجيلك في معهد الإمام تقي الدين الحصني. سيتم مراجعة طلبك والتواصل معك قريباً.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--soft-white)] py-16 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[var(--lux-black)] mb-2">التسجيل في المعهد</h1>
          <p className="text-[var(--text-gray)]">معهد الإمام تقي الدين الحصني للتفقه الشافعي</p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= 1 ? "bg-[var(--gold)] text-white" : "bg-gray-200 text-gray-500"}`}>١</div>
            <span className="text-xs text-[var(--text-gray)]">البيانات الأساسية</span>
          </div>
          <div className={`h-0.5 w-24 transition-all ${step >= 2 ? "bg-[var(--gold)]" : "bg-gray-200"}`} />
          <div className="flex flex-col items-center gap-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= 2 ? "bg-[var(--gold)] text-white" : "bg-gray-200 text-gray-500"}`}>٢</div>
            <span className="text-xs text-[var(--text-gray)]">معلومات إضافية</span>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Form */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm p-8">

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-right">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">الاسم الأول <span className="text-red-500">*</span></label>
                  <input name="firstName" value={form.firstName} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right text-[var(--lux-black)] bg-white focus:outline-none focus:border-[var(--gold)] transition" placeholder="أدخل اسمك الأول" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">الاسم الأخير <span className="text-red-500">*</span></label>
                  <input name="lastName" value={form.lastName} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right focus:outline-none focus:border-[var(--gold)] transition" placeholder="أدخل اسمك الأخير" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">البريد الإلكتروني <span className="text-red-500">*</span></label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right focus:outline-none focus:border-[var(--gold)] transition" placeholder="example@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">رقم الهاتف <span className="text-red-500">*</span></label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right focus:outline-none focus:border-[var(--gold)] transition" placeholder="+963 xxx xxx xxx" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">كلمة المرور <span className="text-red-500">*</span></label>
                  <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right focus:outline-none focus:border-[var(--gold)] transition" placeholder="8 أحرف على الأقل" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">تأكيد كلمة المرور <span className="text-red-500">*</span></label>
                  <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right focus:outline-none focus:border-[var(--gold)] transition" placeholder="أعد كتابة كلمة المرور" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">النوع</label>
                  <select name="gender" value={form.gender} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right focus:outline-none focus:border-[var(--gold)] transition bg-white">
                    <option value="">اختر</option>
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">تاريخ الميلاد</label>
                  <input name="birthDate" type="date" value={form.birthDate} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right focus:outline-none focus:border-[var(--gold)] transition" />
                </div>

                <div className="md:col-span-2 flex justify-start mt-2">
                  <button onClick={handleNextStep} className="bg-[var(--gold)] text-white px-10 py-3 rounded-lg font-semibold hover:opacity-90 transition">
                    التالي ←
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">الجنسية</label>
                  <input name="nationality" value={form.nationality} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right focus:outline-none focus:border-[var(--gold)] transition" placeholder="مثال: سوري" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">بلد الإقامة <span className="text-red-500">*</span></label>
                  <input name="residenceCountry" value={form.residenceCountry} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right focus:outline-none focus:border-[var(--gold)] transition" placeholder="مثال: تركيا" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">المستوى التعليمي</label>
                  <select name="educationLevel" value={form.educationLevel} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right focus:outline-none focus:border-[var(--gold)] transition bg-white">
                    <option value="">اختر</option>
                    <option value="primary">ابتدائي</option>
                    <option value="intermediate">إعدادي</option>
                    <option value="secondary">ثانوي</option>
                    <option value="university">جامعي</option>
                    <option value="postgraduate">دراسات عليا</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">رقم أو معرف التليجرام <span className="text-red-500">*</span></label>
                  <input name="telegram" value={form.telegram} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right focus:outline-none focus:border-[var(--gold)] transition" placeholder="@username أو رقم الهاتف" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">كيف عرفت المعهد؟</label>
                  <select name="howDidYouKnow" value={form.howDidYouKnow} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right focus:outline-none focus:border-[var(--gold)] transition bg-white">
                    <option value="">اختر</option>
                    <option value="social_media">وسائل التواصل الاجتماعي</option>
                    <option value="friend">عن طريق صديق</option>
                    <option value="search_engine">محرك البحث</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--lux-black)] mb-1">كم ساعة يمكنك توفيرها يومياً؟</label>
                  <select name="availableHours" value={form.availableHours} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-right focus:outline-none focus:border-[var(--gold)] transition bg-white">
                    <option value="">اختر</option>
                    <option value="one">ساعة واحدة</option>
                    <option value="two">ساعتان</option>
                    <option value="three">3 ساعات</option>
                    <option value="four">4 ساعات</option>
                    <option value="five_plus">5 ساعات أو أكثر</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="worksFullTime" checked={form.worksFullTime} onChange={handleChange} className="w-4 h-4 accent-[var(--gold)]" />
                    <span className="text-sm text-[var(--lux-black)]">هل تعمل بدوام كامل؟</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="otherInstitutes" checked={form.otherInstitutes} onChange={handleChange} className="w-4 h-4 accent-[var(--gold)]" />
                    <span className="text-sm text-[var(--lux-black)]">هل تشارك في برامج أو معاهد شرعية أخرى؟</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="agreeToTerms" checked={form.agreeToTerms} onChange={handleChange} className="w-4 h-4 accent-[var(--gold)]" />
                    <span className="text-sm text-[var(--lux-black)]">أوافق على سياسة الخصوصية والشروط والأحكام ولائحة المعهد <span className="text-red-500">*</span></span>
                  </label>
                </div>

                <div className="md:col-span-2 flex justify-between mt-2">
                  <button onClick={() => { setStep(1); setError(""); }} className="border border-gray-300 text-[var(--text-gray)] px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition">
                    → السابق
                  </button>
                  <button onClick={handleSubmit} disabled={loading} className="bg-[var(--gold)] text-white px-10 py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-60">
                    {loading ? "جاري التسجيل..." : "التسجيل"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="hidden lg:flex w-72 flex-col bg-[var(--lux-black)] rounded-2xl p-8 text-white text-center justify-between">
            <div>
              <div className="w-24 h-24 rounded-full border-4 border-[var(--gold)] mx-auto mb-6 flex items-center justify-center">
                <span className="text-[var(--gold)] text-4xl font-bold">ح</span>
              </div>
              <h3 className="text-xl font-bold mb-2">مرحباً بك</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                قم بملء استمارة التسجيل للانضمام إلى معهد الإمام تقي الدين الحصني
              </p>
            </div>
            <div className="border-t border-gray-700 pt-6">
              <p className="text-gray-400 text-sm mb-3">لديك حساب؟</p>
              <a href="/login" className="block w-full border border-[var(--gold)] text-[var(--gold)] py-2 rounded-lg text-sm font-semibold hover:bg-[var(--gold)] hover:text-white transition text-center">
                تسجيل الدخول
              </a>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}