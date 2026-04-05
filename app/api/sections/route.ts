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

export async function GET(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  const admin = await verifyAdmin(jwt);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await pool.query(`
    SELECT s.*,
      COUNT(DISTINCT u.id) as student_count,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'teacher_id', st.teacher_id,
            'subject', st.subject,
            'first_name', t.first_name,
            'last_name', t.last_name
          )
        ) FILTER (WHERE st.teacher_id IS NOT NULL),
        '[]'
      ) as teachers
    FROM sections s
    LEFT JOIN up_users u ON u.section_id = s.id
    LEFT JOIN section_teachers st ON st.section_id = s.id
    LEFT JOIN up_users t ON t.id = st.teacher_id
    GROUP BY s.id
    ORDER BY s.academic_year, s.level, s.gender, s.name
  `);
  return NextResponse.json({ data: result.rows });
}

export async function POST(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  const admin = await verifyAdmin(jwt);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, academicYear, level, gender, maxStudents } = await req.json();
  if (!name || !academicYear || !gender) return NextResponse.json({ error: "name, academicYear, gender required" }, { status: 400 });

  const result = await pool.query(
    `INSERT INTO sections (name, academic_year, level, gender, max_students)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, academicYear, level || "مبتدئ", gender, maxStudents || 50]
  );
  return NextResponse.json({ data: result.rows[0] });
}

export async function PUT(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  const admin = await verifyAdmin(jwt);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, academicYear, level, gender, maxStudents } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const result = await pool.query(
    `UPDATE sections SET name=$1, academic_year=$2, level=$3, gender=$4, max_students=$5
     WHERE id=$6 RETURNING *`,
    [name, academicYear, level || "مبتدئ", gender, maxStudents || 50, id]
  );
  return NextResponse.json({ data: result.rows[0] });
}

export async function DELETE(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  const admin = await verifyAdmin(jwt);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await pool.query("UPDATE up_users SET section_id = NULL WHERE section_id = $1", [id]);
  await pool.query("DELETE FROM sections WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}