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

// GET /api/sections — جلب كل الشعب مع عدد الطلاب
export async function GET(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  const admin = await verifyAdmin(jwt);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await pool.query(`
    SELECT s.*, 
      t.first_name as teacher_first, t.last_name as teacher_last,
      COUNT(u.id) as student_count
    FROM sections s
    LEFT JOIN up_users t ON t.id = s.teacher_id
    LEFT JOIN up_users u ON u.section_id = s.id
    GROUP BY s.id, t.first_name, t.last_name
    ORDER BY s.academic_year, s.gender, s.name
  `);
  return NextResponse.json({ data: result.rows });
}

// POST /api/sections — إنشاء شعبة جديدة
export async function POST(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  const admin = await verifyAdmin(jwt);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, academicYear, gender, teacherId, maxStudents } = await req.json();
  if (!name || !academicYear || !gender) {
    return NextResponse.json({ error: "name, academicYear, gender required" }, { status: 400 });
  }

  const result = await pool.query(
    `INSERT INTO sections (name, academic_year, gender, teacher_id, max_students)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, academicYear, gender, teacherId || null, maxStudents || 50]
  );
  return NextResponse.json({ data: result.rows[0] });
}

// PUT /api/sections — تعديل شعبة
export async function PUT(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  const admin = await verifyAdmin(jwt);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, academicYear, gender, teacherId, maxStudents } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const result = await pool.query(
    `UPDATE sections SET name=$1, academic_year=$2, gender=$3, teacher_id=$4, max_students=$5
     WHERE id=$6 RETURNING *`,
    [name, academicYear, gender, teacherId || null, maxStudents || 50, id]
  );
  return NextResponse.json({ data: result.rows[0] });
}

// DELETE /api/sections?id=X
export async function DELETE(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  const admin = await verifyAdmin(jwt);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // فك ربط الطلاب أولاً
  await pool.query("UPDATE up_users SET section_id = NULL WHERE section_id = $1", [id]);
  await pool.query("DELETE FROM sections WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}