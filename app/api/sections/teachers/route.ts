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

// GET /api/sections/teachers?sectionId=X
export async function GET(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  const user = await fetch(`${STRAPI_URL}/api/users/me`, { headers: { Authorization: `Bearer ${jwt}` } }).then(r => r.json());
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sectionId = req.nextUrl.searchParams.get("sectionId");
  if (!sectionId) return NextResponse.json({ error: "sectionId required" }, { status: 400 });

  const result = await pool.query(
    `SELECT st.*, u.first_name, u.last_name, u.email
     FROM section_teachers st
     JOIN up_users u ON u.id = st.teacher_id
     WHERE st.section_id = $1
     ORDER BY st.subject`,
    [sectionId]
  );
  return NextResponse.json({ data: result.rows });
}

// POST /api/sections/teachers { sectionId, teacherId, subject }
export async function POST(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  const admin = await verifyAdmin(jwt);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sectionId, teacherId, subject } = await req.json();
  if (!sectionId || !teacherId) return NextResponse.json({ error: "sectionId and teacherId required" }, { status: 400 });

  const result = await pool.query(
    `INSERT INTO section_teachers (section_id, teacher_id, subject)
     VALUES ($1, $2, $3)
     ON CONFLICT (section_id, teacher_id) DO UPDATE SET subject = $3
     RETURNING *`,
    [sectionId, teacherId, subject || null]
  );
  return NextResponse.json({ data: result.rows[0] });
}

// DELETE /api/sections/teachers?sectionId=X&teacherId=Y
export async function DELETE(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  const admin = await verifyAdmin(jwt);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sectionId = req.nextUrl.searchParams.get("sectionId");
  const teacherId = req.nextUrl.searchParams.get("teacherId");
  if (!sectionId || !teacherId) return NextResponse.json({ error: "sectionId and teacherId required" }, { status: 400 });

  await pool.query("DELETE FROM section_teachers WHERE section_id = $1 AND teacher_id = $2", [sectionId, teacherId]);
  return NextResponse.json({ ok: true });
}