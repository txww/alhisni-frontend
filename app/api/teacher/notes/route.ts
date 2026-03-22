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

async function verifyTeacher(jwt: string) {
  const res = await fetch(`${STRAPI_URL}/api/users/me`, { headers: { Authorization: `Bearer ${jwt}` } });
  const data = await res.json();
  if (!data?.isTeacher) return null;
  return data;
}

// GET /api/teacher/notes?studentId=X
export async function GET(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  const teacher = await verifyTeacher(jwt);
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) {
    // جلب كل ملاحظات المدرس
    const result = await pool.query(
      "SELECT * FROM teacher_student_notes WHERE teacher_id = $1",
      [teacher.id]
    );
    return NextResponse.json({ data: result.rows });
  }

  const result = await pool.query(
    "SELECT * FROM teacher_student_notes WHERE teacher_id = $1 AND student_id = $2",
    [teacher.id, studentId]
  );
  return NextResponse.json({ data: result.rows[0] || null });
}

// POST /api/teacher/notes { studentId, note }
export async function POST(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  const teacher = await verifyTeacher(jwt);
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, note } = await req.json();
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const result = await pool.query(
    `INSERT INTO teacher_student_notes (teacher_id, student_id, note, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (teacher_id, student_id)
     DO UPDATE SET note = $3, updated_at = NOW()
     RETURNING *`,
    [teacher.id, studentId, note]
  );
  return NextResponse.json({ data: result.rows[0] });
}