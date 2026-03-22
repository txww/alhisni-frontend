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

// GET /api/teacher/attendance?sessionId=X
export async function GET(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  const teacher = await verifyTeacher(jwt);
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const result = await pool.query(
    "SELECT * FROM session_attendance WHERE session_id = $1",
    [sessionId]
  );
  return NextResponse.json({ data: result.rows });
}

// POST /api/teacher/attendance { sessionId, studentId, attended }
export async function POST(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  const teacher = await verifyTeacher(jwt);
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId, studentId, attended } = await req.json();
  if (!sessionId || !studentId) return NextResponse.json({ error: "sessionId and studentId required" }, { status: 400 });

  const result = await pool.query(
    `INSERT INTO session_attendance (session_id, student_id, attended, marked_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (session_id, student_id)
     DO UPDATE SET attended = $3, marked_at = NOW()
     RETURNING *`,
    [sessionId, studentId, attended]
  );
  return NextResponse.json({ data: result.rows[0] });
}