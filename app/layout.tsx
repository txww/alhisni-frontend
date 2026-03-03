import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "معهد الإمام تقي الدين الحصني",
  description: "الموقع الرسمي لمعهد الإمام تقي الدين الحصني للتفقه الشافعي",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[var(--soft-white)] text-neutral-900 antialiased">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
