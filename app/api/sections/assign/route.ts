import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "hisnidb",
  user: process.env.DB_USER || "hisniuser",
  password: process.env.DB_PASSWORD || "",
});

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const ADMIN_EMAIL = "admin@hisni.com";

async function verifyAdmin(jwt: string) {
  const res = await fetch(`${STRAPI_URL}/api/users/me`, { headers: { Authorization: `Bearer ${jwt}` } });
  const data = await res.json();
  if (data?.email !== ADMIN_EMAIL) return null;
  return data;
}

// POST /api/sections/assign { studentId, sectionId }
export async function POST(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  const admin = await verifyAdmin(jwt);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, sectionId } = await req.json();
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  // تحقق من عدد الطلاب في الشعبة
  if (sectionId) {
    const countRes = await pool.query(
      "SELECT COUNT(*) as cnt, s.max_students FROM up_users u JOIN sections s ON s.id = $1 WHERE u.section_id = $1 GROUP BY s.max_students",
      [sectionId]
    );
    const row = countRes.rows[0];
    if (row && parseInt(row.cnt) >= parseInt(row.max_students)) {
      return NextResponse.json({ error: "الشعبة ممتلئة" }, { status: 400 });
    }
  }

  await pool.query(
    "UPDATE up_users SET section_id = $1 WHERE id = $2",
    [sectionId || null, studentId]
  );

  return NextResponse.json({ ok: true });
}