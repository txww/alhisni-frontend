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

// GET /api/sections/my — يرجع شعبة المستخدم الحالي (طالب أو مدرس)
export async function GET(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  const res = await fetch(`${STRAPI_URL}/api/users/me`, { headers: { Authorization: `Bearer ${jwt}` } });
  const user = await res.json();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.isTeacher) {
    // المدرس — شعبه المربوطة به مع طلابها
    const sections = await pool.query(
      `SELECT s.*, COUNT(u.id) as student_count
       FROM sections s
       LEFT JOIN up_users u ON u.section_id = s.id
       WHERE s.teacher_id = $1
       GROUP BY s.id
       ORDER BY s.academic_year, s.name`,
      [user.id]
    );

    // طلاب كل شعبة
    const result = [];
    for (const section of sections.rows) {
      const students = await pool.query(
        `SELECT id, email, first_name as "firstName", last_name as "lastName",
                phone, telegram, nationality, residence_country as "residenceCountry",
                registration_status as "registrationStatus", academic_year as "academicYear"
         FROM up_users
         WHERE section_id = $1 AND is_teacher = false`,
        [section.id]
      );
      result.push({ ...section, students: students.rows });
    }
    return NextResponse.json({ type: "teacher", data: result });
  } else {
    // الطالب — شعبته
    const section = await pool.query(
      `SELECT s.*, t.first_name as teacher_first, t.last_name as teacher_last,
              t.email as teacher_email, t.phone as teacher_phone
       FROM up_users u
       LEFT JOIN sections s ON s.id = u.section_id
       LEFT JOIN up_users t ON t.id = s.teacher_id
       WHERE u.id = $1`,
      [user.id]
    );
    return NextResponse.json({ type: "student", data: section.rows[0] || null });
  }
}