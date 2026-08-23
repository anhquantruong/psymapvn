require("dotenv").config();

const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3000;


// =========================================================
// REQUIRED ENV VARS
// =========================================================
//
// SESSION_SECRET        random long string (see .env.example)
// ADMIN_USERNAME         plain text username, e.g. "admin"
// ADMIN_PASSWORD_HASH    bcrypt hash of the real password
// DATABASE_URL           postgres connection string, ví dụ:
//                         postgres://user:pass@host:5432/dbname
//                         (Supabase/Railway/Neon/RDS đều cung cấp sẵn)
//
// None of these ever get sent to the browser — they only ever
// live in the server process.
// =========================================================

const {
  SESSION_SECRET,
  ADMIN_USERNAME,
  ADMIN_PASSWORD_HASH,
  DATABASE_URL
} = process.env;

if (!SESSION_SECRET || !ADMIN_USERNAME || !ADMIN_PASSWORD_HASH || !DATABASE_URL) {

  console.error(
    "Thiếu SESSION_SECRET / ADMIN_USERNAME / ADMIN_PASSWORD_HASH / DATABASE_URL trong .env — server không khởi động. Xem .env.example."
  );

  process.exit(1);

}


// =========================================================
// MIDDLEWARE
// =========================================================

app.use(express.json());

// Cần thiết nếu deploy sau reverse proxy (Render, Railway, Nginx...)
// để cookie "secure" hoạt động đúng qua HTTPS.
app.set("trust proxy", 1);

app.use(
  session({
    name: "msvn.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 8 // hết hạn sau 8 giờ
    }
  })
);


// =========================================================
// DATABASE
// =========================================================
//
// pg dùng connection pool thay vì mở 1 file .db như SQLite.
// Nếu deploy lên host yêu cầu SSL (Supabase, Render, Railway...)
// thường cần bật ssl bên dưới — bỏ comment nếu gặp lỗi kết nối.
// =========================================================

const pool = new Pool({
  connectionString: DATABASE_URL,
  // ssl: { rejectUnauthorized: false }
});

pool
  .connect()
  .then(client => {

    console.log("PostgreSQL database connected.");

    client.release();

  })
  .catch(error => {

    console.error("Postgres connection failed:", error);

    process.exit(1);

  });


// =========================================================
// CREATE FEEDBACK TABLE IF NEEDED
// =========================================================
//
// Same structure as before, viết lại theo cú pháp Postgres:
// - SERIAL thay AUTOINCREMENT
// - TIMESTAMPTZ thay TEXT cho created_at/replied_at
// - is_read dùng BOOLEAN thay vì INTEGER 0/1 (tự nhiên hơn ở
//   Postgres — frontend admin.js đang check `Number(x) === 1`,
//   nên cần sửa nhẹ phía frontend, xem ghi chú cuối file)
// =========================================================

async function ensureFeedbackTable() {

  await pool.query(`
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT,
      category TEXT,
      message TEXT NOT NULL,
      page TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      status TEXT DEFAULT 'new',
      is_read BOOLEAN DEFAULT FALSE,
      reply_message TEXT,
      replied_at TIMESTAMPTZ
    )
  `);


  // ADD COLUMN IF NOT EXISTS thay cho việc tự kiểm tra
  // PRAGMA table_info như bên SQLite — Postgres hỗ trợ thẳng.

  await pool.query(`
    ALTER TABLE feedback
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE
  `);

  await pool.query(`
    ALTER TABLE feedback
    ADD COLUMN IF NOT EXISTS reply_message TEXT
  `);

  await pool.query(`
    ALTER TABLE feedback
    ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ
  `);

}

ensureFeedbackTable().catch(error => {

  console.error("Failed to ensure feedback table:", error);

  process.exit(1);

});


// =========================================================
// AUTH — LOGIN BRUTE-FORCE GUARD (per IP, in-memory)
// (Không cần đổi — vẫn giữ in-memory, không liên quan DB)
// =========================================================

const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 phút


function isLockedOut(ip) {

  const entry = loginAttempts.get(ip);

  if (!entry) return false;

  if (entry.count < MAX_ATTEMPTS) return false;

  if (Date.now() - entry.lastAttempt > LOCKOUT_MS) {

    loginAttempts.delete(ip);

    return false;

  }

  return true;

}

function registerFailedAttempt(ip) {

  const entry =
    loginAttempts.get(ip) ||
    { count: 0, lastAttempt: 0 };

  entry.count += 1;

  entry.lastAttempt = Date.now();

  loginAttempts.set(ip, entry);

}

function clearAttempts(ip) {

  loginAttempts.delete(ip);

}


// =========================================================
// AUTH — MIDDLEWARE
// =========================================================

function requireAuth(req, res, next) {

  if (req.session && req.session.isAdmin) {

    return next();

  }

  return res.status(401).json({
    error: "Unauthorized."
  });

}


// =========================================================
// AUTH — ROUTES
// =========================================================

app.post(
  "/api/admin/login",
  async (req, res) => {

    const ip = req.ip;


    if (isLockedOut(ip)) {

      return res.status(429).json({
        error:
          "Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau 15 phút."
      });

    }


    const { username, password } =
      req.body || {};


    if (!username || !password) {

      return res.status(400).json({
        error:
          "Vui lòng nhập tên đăng nhập và mật khẩu."
      });

    }


    const validUsername =
      username === ADMIN_USERNAME;

    const validPassword =
      await bcrypt.compare(
        password,
        ADMIN_PASSWORD_HASH
      );


    if (!validUsername || !validPassword) {

      registerFailedAttempt(ip);

      return res.status(401).json({
        error:
          "Sai tên đăng nhập hoặc mật khẩu."
      });

    }


    clearAttempts(ip);


    req.session.regenerate(err => {

      if (err) {

        return res.status(500).json({
          error: "Đăng nhập thất bại."
        });

      }


      req.session.isAdmin = true;

      req.session.username = username;


      res.json({
        message: "Đăng nhập thành công."
      });

    });

  }
);


app.post(
  "/api/admin/logout",
  (req, res) => {

    if (!req.session) {

      return res.json({
        message: "Đã đăng xuất."
      });

    }


    req.session.destroy(() => {

      res.clearCookie("msvn.sid");

      res.json({
        message: "Đã đăng xuất."
      });

    });

  }
);


app.get(
  "/api/admin/session",
  (req, res) => {

    res.json({
      authenticated:
        !!(req.session && req.session.isAdmin)
    });

  }
);


// =========================================================
// AUTH — PROTECT ADMIN DASHBOARD (static HTML/JS/CSS)
// =========================================================

const OPEN_ADMIN_PATHS = [
  "/login.html",
  "/login.css",
  "/login.js"
];

app.use("/admin", (req, res, next) => {

  if (OPEN_ADMIN_PATHS.includes(req.path)) {

    return next();

  }


  if (req.session && req.session.isAdmin) {

    return next();

  }


  return res.redirect("/admin/login.html");

});


// =========================================================
// AUTH — PROTECT ADMIN API
// =========================================================

app.use("/api/admin", requireAuth);


// =========================================================
// SERVE WEBSITE
// =========================================================

app.use(
  express.static(__dirname)
);


// =========================================================
// HELPER — VALIDATE CLINIC
// (Không đổi — validation logic không liên quan tới DB)
// =========================================================

function validateClinic(data) {

  const errors = [];


  if (
    !data.clinic_name ||
    typeof data.clinic_name !== "string" ||
    !data.clinic_name.trim()
  ) {

    errors.push("Clinic name is required.");

  }


  if (
    !data.clinic_type ||
    typeof data.clinic_type !== "string" ||
    !data.clinic_type.trim()
  ) {

    errors.push("Clinic type is required.");

  }


  if (
    !data.address ||
    typeof data.address !== "string" ||
    !data.address.trim()
  ) {

    errors.push("Address is required.");

  }


  if (
    data.latitude !== "" &&
    data.latitude !== null &&
    data.latitude !== undefined
  ) {

    const latitude = Number(data.latitude);


    if (
      Number.isNaN(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {

      errors.push("Latitude must be between -90 and 90.");

    }

  }


  if (
    data.longitude !== "" &&
    data.longitude !== null &&
    data.longitude !== undefined
  ) {

    const longitude = Number(data.longitude);


    if (
      Number.isNaN(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {

      errors.push("Longitude must be between -180 and 180.");

    }

  }


  if (
    data.website &&
    typeof data.website === "string"
  ) {

    try {

      new URL(data.website);

    } catch {

      errors.push("Website must be a valid URL.");

    }

  }


  return errors;

}


// =========================================================
// GET ALL CLINICS
// =========================================================

app.get(
  "/api/admin/clinics",
  async (req, res) => {

    try {

      const result = await pool.query(`
        SELECT *
        FROM clinics
        ORDER BY id DESC
      `);


      res.json(result.rows);


    } catch (error) {

      console.error("GET /api/admin/clinics error:", error);


      res.status(500).json({
        error: "Failed to load clinics."
      });

    }

  }
);


// =========================================================
// GET ONE CLINIC
// =========================================================

app.get(
  "/api/admin/clinics/:id",
  async (req, res) => {

    try {

      const id = Number(req.params.id);


      if (!Number.isInteger(id)) {

        return res.status(400).json({
          error: "Invalid clinic ID."
        });

      }


      const result = await pool.query(
        `SELECT * FROM clinics WHERE id = $1`,
        [id]
      );


      const clinic = result.rows[0];


      if (!clinic) {

        return res.status(404).json({
          error: "Clinic not found."
        });

      }


      res.json(clinic);


    } catch (error) {

      console.error("GET clinic error:", error);


      res.status(500).json({
        error: "Failed to load clinic."
      });

    }

  }
);


// =========================================================
// ADD CLINIC
// =========================================================

app.post(
  "/api/admin/clinics",
  async (req, res) => {

    try {

      const data = req.body;


      const errors = validateClinic(data);


      if (errors.length > 0) {

        return res.status(400).json({
          error: "Validation failed.",
          details: errors
        });

      }


      const latitude =
        data.latitude === "" ||
        data.latitude === null ||
        data.latitude === undefined
          ? null
          : Number(data.latitude);


      const longitude =
        data.longitude === "" ||
        data.longitude === null ||
        data.longitude === undefined
          ? null
          : Number(data.longitude);


      // $1..$18 thay cho @clinic_name kiểu SQLite. Thứ tự
      // trong mảng values PHẢI khớp đúng thứ tự $ trong câu SQL.
      const result = await pool.query(
        `
          INSERT INTO clinics (
            clinic_name, clinic_type, address, old_address,
            ward, prov, latitude, longitude, price, phone,
            website, ggmaps_link, operating_hours, license_number,
            license_issue_date, description, target_groups, service
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18
          )
          RETURNING id
        `,
        [
          data.clinic_name.trim(),
          data.clinic_type.trim(),
          data.address.trim(),
          data.old_address?.trim() || "",
          data.ward?.trim() || "",
          data.prov?.trim() || "",
          latitude,
          longitude,
          data.price?.trim() || "",
          data.phone?.trim() || "",
          data.website?.trim() || "",
          data.ggmaps_link?.trim() || "",
          data.operating_hours?.trim() || "",
          data.license_number?.trim() || "",
          data.license_issue_date || "",
          data.description?.trim() || "",
          data.target_groups?.trim() || "",
          data.service?.trim() || ""
        ]
      );


      const newId = result.rows[0].id;


      const newClinicResult = await pool.query(
        `SELECT * FROM clinics WHERE id = $1`,
        [newId]
      );


      res.status(201).json({
        message: "Clinic added successfully.",
        clinic: newClinicResult.rows[0]
      });


    } catch (error) {

      console.error("POST /api/admin/clinics error:", error);


      res.status(500).json({
        error: "Failed to add clinic."
      });

    }

  }
);


// =========================================================
// UPDATE CLINIC
// =========================================================

app.put(
  "/api/admin/clinics/:id",
  async (req, res) => {

    try {

      const id = Number(req.params.id);


      if (!Number.isInteger(id)) {

        return res.status(400).json({
          error: "Invalid clinic ID."
        });

      }


      const existingResult = await pool.query(
        `SELECT * FROM clinics WHERE id = $1`,
        [id]
      );


      if (!existingResult.rows[0]) {

        return res.status(404).json({
          error: "Clinic not found."
        });

      }


      const data = req.body;


      const errors = validateClinic(data);


      if (errors.length > 0) {

        return res.status(400).json({
          error: "Validation failed.",
          details: errors
        });

      }


      const latitude =
        data.latitude === "" ||
        data.latitude === null ||
        data.latitude === undefined
          ? null
          : Number(data.latitude);


      const longitude =
        data.longitude === "" ||
        data.longitude === null ||
        data.longitude === undefined
          ? null
          : Number(data.longitude);


      await pool.query(
        `
          UPDATE clinics
          SET
            clinic_name = $1,
            clinic_type = $2,
            address = $3,
            old_address = $4,
            ward = $5,
            prov = $6,
            latitude = $7,
            longitude = $8,
            price = $9,
            phone = $10,
            website = $11,
            ggmaps_link = $12,
            operating_hours = $13,
            license_number = $14,
            license_issue_date = $15,
            description = $16,
            target_groups = $17,
            service = $18
          WHERE id = $19
        `,
        [
          data.clinic_name.trim(),
          data.clinic_type.trim(),
          data.address.trim(),
          data.old_address?.trim() || "",
          data.ward?.trim() || "",
          data.prov?.trim() || "",
          latitude,
          longitude,
          data.price?.trim() || "",
          data.phone?.trim() || "",
          data.website?.trim() || "",
          data.ggmaps_link?.trim() || "",
          data.operating_hours?.trim() || "",
          data.license_number?.trim() || "",
          data.license_issue_date || "",
          data.description?.trim() || "",
          data.target_groups?.trim() || "",
          data.service?.trim() || "",
          id
        ]
      );


      const updatedResult = await pool.query(
        `SELECT * FROM clinics WHERE id = $1`,
        [id]
      );


      res.json({
        message: "Clinic updated successfully.",
        clinic: updatedResult.rows[0]
      });


    } catch (error) {

      console.error("PUT clinic error:", error);


      res.status(500).json({
        error: "Failed to update clinic."
      });

    }

  }
);


// =========================================================
// DELETE CLINIC
// =========================================================

app.delete(
  "/api/admin/clinics/:id",
  async (req, res) => {

    try {

      const id = Number(req.params.id);


      if (!Number.isInteger(id)) {

        return res.status(400).json({
          error: "Invalid clinic ID."
        });

      }


      // result.changes (SQLite) -> result.rowCount (pg)
      const result = await pool.query(
        `DELETE FROM clinics WHERE id = $1`,
        [id]
      );


      if (result.rowCount === 0) {

        return res.status(404).json({
          error: "Clinic not found."
        });

      }


      res.json({
        message: "Clinic deleted successfully."
      });


    } catch (error) {

      console.error("DELETE clinic error:", error);


      res.status(500).json({
        error: "Failed to delete clinic."
      });

    }

  }
);


// =========================================================
// SUBMIT USER FEEDBACK
// =========================================================

app.post(
  "/api/feedback",
  async (req, res) => {

    try {

      const {
        name,
        email,
        type,
        message
      } = req.body;


      if (
        !name ||
        typeof name !== "string" ||
        !name.trim()
      ) {

        return res.status(400).json({
          error: "Name is required."
        });

      }


      if (
        !type ||
        typeof type !== "string" ||
        !type.trim()
      ) {

        return res.status(400).json({
          error: "Feedback topic is required."
        });

      }


      if (
        !message ||
        typeof message !== "string" ||
        !message.trim()
      ) {

        return res.status(400).json({
          error: "Message is required."
        });

      }


      const result = await pool.query(
        `
          INSERT INTO feedback (name, email, category, message, page)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `,
        [
          name.trim(),
          typeof email === "string" ? email.trim() : "",
          type.trim(),
          message.trim(),
          req.headers.referer || ""
        ]
      );


      res.status(201).json({
        success: true,
        message: "Feedback submitted successfully.",
        id: result.rows[0].id
      });


    } catch (error) {

      console.error("POST /api/feedback error:", error);


      res.status(500).json({
        error: "Failed to save feedback."
      });

    }

  }
);


// =========================================================
// GET ALL FEEDBACK — ADMIN
// =========================================================

app.get(
  "/api/admin/feedback",
  async (req, res) => {

    try {

      const result = await pool.query(`
        SELECT
          id, name, email, category, message, page,
          created_at, status, is_read, reply_message, replied_at
        FROM feedback
        ORDER BY id DESC
      `);


      res.json(result.rows);


    } catch (error) {

      console.error("GET /api/admin/feedback error:", error);


      res.status(500).json({
        error: "Failed to load feedback."
      });

    }

  }
);


// =========================================================
// GET ONE FEEDBACK — ADMIN
// =========================================================

app.get(
  "/api/admin/feedback/:id",
  async (req, res) => {

    try {

      const id = Number(req.params.id);


      if (!Number.isInteger(id)) {

        return res.status(400).json({
          error: "Invalid feedback ID."
        });

      }


      const result = await pool.query(
        `
          SELECT
            id, name, email, category, message, page,
            created_at, status, is_read, reply_message, replied_at
          FROM feedback
          WHERE id = $1
        `,
        [id]
      );


      const item = result.rows[0];


      if (!item) {

        return res.status(404).json({
          error: "Feedback not found."
        });

      }


      res.json(item);


    } catch (error) {

      console.error("GET one feedback error:", error);


      res.status(500).json({
        error: "Failed to load feedback."
      });

    }

  }
);


// =========================================================
// MARK FEEDBACK AS READ — ADMIN
// =========================================================

app.post(
  "/api/admin/feedback/:id/read",
  async (req, res) => {

    try {

      const id = Number(req.params.id);


      if (!Number.isInteger(id)) {

        return res.status(400).json({
          error: "Invalid feedback ID."
        });

      }


      const result = await pool.query(
        `UPDATE feedback SET is_read = TRUE WHERE id = $1`,
        [id]
      );


      if (result.rowCount === 0) {

        return res.status(404).json({
          error: "Feedback not found."
        });

      }


      const updatedResult = await pool.query(
        `SELECT * FROM feedback WHERE id = $1`,
        [id]
      );


      res.json({
        message: "Feedback marked as read.",
        feedback: updatedResult.rows[0]
      });


    } catch (error) {

      console.error("Mark feedback read error:", error);


      res.status(500).json({
        error: "Failed to mark feedback as read."
      });

    }

  }
);


// =========================================================
// REPLY TO FEEDBACK — ADMIN
// =========================================================

app.post(
  "/api/admin/feedback/:id/reply",
  async (req, res) => {

    try {

      const id = Number(req.params.id);


      if (!Number.isInteger(id)) {

        return res.status(400).json({
          error: "Invalid feedback ID."
        });

      }


      const { reply_message } = req.body || {};


      if (
        !reply_message ||
        typeof reply_message !== "string" ||
        !reply_message.trim()
      ) {

        return res.status(400).json({
          error: "Nội dung trả lời không được để trống."
        });

      }


      const existingResult = await pool.query(
        `SELECT id FROM feedback WHERE id = $1`,
        [id]
      );


      if (!existingResult.rows[0]) {

        return res.status(404).json({
          error: "Feedback not found."
        });

      }


      await pool.query(
        `
          UPDATE feedback
          SET
            reply_message = $1,
            replied_at = NOW(),
            status = 'resolved',
            is_read = TRUE
          WHERE id = $2
        `,
        [reply_message.trim(), id]
      );


      const updatedResult = await pool.query(
        `SELECT * FROM feedback WHERE id = $1`,
        [id]
      );


      res.json({
        message: "Reply saved successfully.",
        feedback: updatedResult.rows[0]
      });


    } catch (error) {

      console.error("Reply feedback error:", error);


      res.status(500).json({
        error: "Failed to save reply."
      });

    }

  }
);


// =========================================================
// UPDATE FEEDBACK STATUS — ADMIN
// =========================================================

app.patch(
  "/api/admin/feedback/:id",
  async (req, res) => {

    try {

      const id = Number(req.params.id);


      const { status } = req.body;


      const allowedStatuses = [
        "new",
        "reviewed",
        "resolved"
      ];


      if (!Number.isInteger(id)) {

        return res.status(400).json({
          error: "Invalid feedback ID."
        });

      }


      if (!allowedStatuses.includes(status)) {

        return res.status(400).json({
          error: "Invalid feedback status."
        });

      }


      const result = await pool.query(
        `UPDATE feedback SET status = $1 WHERE id = $2`,
        [status, id]
      );


      if (result.rowCount === 0) {

        return res.status(404).json({
          error: "Feedback not found."
        });

      }


      const updatedResult = await pool.query(
        `SELECT * FROM feedback WHERE id = $1`,
        [id]
      );


      res.json({
        message: "Feedback status updated.",
        feedback: updatedResult.rows[0]
      });


    } catch (error) {

      console.error("PATCH feedback error:", error);


      res.status(500).json({
        error: "Failed to update feedback."
      });

    }

  }
);


// =========================================================
// DELETE FEEDBACK — ADMIN
// =========================================================

app.delete(
  "/api/admin/feedback/:id",
  async (req, res) => {

    try {

      const id = Number(req.params.id);


      if (!Number.isInteger(id)) {

        return res.status(400).json({
          error: "Invalid feedback ID."
        });

      }


      const result = await pool.query(
        `DELETE FROM feedback WHERE id = $1`,
        [id]
      );


      if (result.rowCount === 0) {

        return res.status(404).json({
          error: "Feedback not found."
        });

      }


      res.json({
        message: "Feedback deleted successfully."
      });


    } catch (error) {

      console.error("DELETE feedback error:", error);


      res.status(500).json({
        error: "Failed to delete feedback."
      });

    }

  }
);


// =========================================================
// PUBLIC — GET ALL CLINICS
// =========================================================

app.get(
  "/api/clinics",
  async (req, res) => {

    try {

      const result = await pool.query(`
        SELECT *
        FROM clinics
        ORDER BY id ASC
      `);


      res.json(result.rows);


    } catch (error) {

      console.error("GET /api/clinics error:", error);


      res.status(500).json({
        error: "Failed to load clinics."
      });

    }

  }
);


app.listen(
  PORT,
  () => {

    console.log(
      `MappingSiteVN running at http://localhost:${PORT}`
    );

  }
);