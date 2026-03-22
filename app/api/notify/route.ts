import { NextRequest, NextResponse } from "next/server";

const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN || "";
const TG_CHAT_ID = process.env.TG_CHAT_ID || "";
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, telegramMessage, emailTo, emailSubject, emailBody, jwt } = body;

  // إرسال تلقرام من السيرفر
  if ((type === "telegram" || type === "both") && telegramMessage) {
    try {
      await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TG_CHAT_ID, text: telegramMessage, parse_mode: "HTML" }),
      });
    } catch { /* silent */ }
  }

  // إرسال إيميل عبر Strapi من السيرفر
  if ((type === "email" || type === "both") && emailTo) {
    try {
      await fetch(`${STRAPI_URL}/api/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ to: emailTo, subject: emailSubject, html: emailBody }),
      });
    } catch { /* silent */ }
  }

  return NextResponse.json({ ok: true });
}