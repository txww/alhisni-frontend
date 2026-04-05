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

export async function GET(req: NextRequest) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  const res = await fetch(`${STRAPI_URL}/api/users/me`, { headers: { Authorization: `Bearer ${jwt}` } });
  const user = await res.json();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.isTeacher) {
    // المدرس — شعبه المربوطة به مع طلابها
    const sections = await pool.query(
      `SELECT s.*,
        COUNT(DISTINCT u.id) as student_count,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'teacher_id', st2.teacher_id,
              'subject', st2.subject,
              'first_name', t2.first_name,
              'last_name', t2.last_name
            )
          ) FILTER (WHERE st2.teacher_id IS NOT NULL),
          '[]'
        ) as teachers
       FROM section_teachers st
       JOIN sections s ON s.id = st.section_id
       LEFT JOIN up_users u ON u.section_id = s.id
       LEFT JOIN section_teachers st2 ON st2.section_id = s.id
       LEFT JOIN up_users t2 ON t2.id = st2.teacher_id
       WHERE st.teacher_id = $1
       GROUP BY s.id
       ORDER BY s.academic_year, s.level, s.name`,
      [user.id]
    );

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
    // الطالب — شعبته مع مدرسيها
    const section = await pool.query(
      `SELECT s.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'teacher_id', st.teacher_id,
              'subject', st.subject,
              'first_name', t.first_name,
              'last_name', t.last_name,
              'email', t.email
            )
          ) FILTER (WHERE st.teacher_id IS NOT NULL),
          '[]'
        ) as teachers,
        COUNT(DISTINCT u2.id) as student_count
       FROM up_users u
       JOIN sections s ON s.id = u.section_id
       LEFT JOIN section_teachers st ON st.section_id = s.id
       LEFT JOIN up_users t ON t.id = st.teacher_id
       LEFT JOIN up_users u2 ON u2.section_id = s.id
       WHERE u.id = $1
       GROUP BY s.id`,
      [user.id]
    );
    return NextResponse.json({ type: "student", data: section.rows[0] || null });
  }
}