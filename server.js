const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = 3000;

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {
    res.send("MECC Backend is running successfully!");
});

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "MECC Backend is healthy"
    });
});

// ======================================================
// DATABASE TEST
// ======================================================

app.get("/database-test", (req, res) => {

    db.query("SELECT 1 AS connected", (err, result) => {

        if (err) {
            console.error("Database error:", err);

            return res.status(500).json({
                success: false,
                message: "Database connection failed",
                error: err.message
            });
        }

        res.json({
            success: true,
            message: "MECC Backend and MySQL are connected!",
            result
        });
    });
});

// ======================================================
// STUDENT REGISTER
// ======================================================

app.post("/register", (req, res) => {

    const {
        fullName,
        email,
        phone,
        course,
        password
    } = req.body;

    if (!fullName || !email || !course || !password) {
        return res.status(400).json({
            success: false,
            message: "Please fill all required fields"
        });
    }

    const sql = `
        INSERT INTO students
        (full_name, email, phone, course, password)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            fullName,
            email,
            phone || null,
            course,
            password
        ],
        (err, result) => {

            if (err) {

                console.error("Registration error:", err);

                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        success: false,
                        message: "This email is already registered"
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Registration failed",
                    error: err.message
                });
            }

            res.status(201).json({
                success: true,
                message: "Student registered successfully",
                studentId: result.insertId
            });
        }
    );
});

// ======================================================
// STUDENT LOGIN
// ======================================================

app.post("/login", (req, res) => {

    const {
        email,
        password
    } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    const sql = `
        SELECT
            id,
            full_name,
            email,
            phone,
            course
        FROM students
        WHERE email = ?
        AND password = ?
        LIMIT 1
    `;

    db.query(
        sql,
        [email, password],
        (err, results) => {

            if (err) {

                console.error("Login error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Login failed",
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }

            res.json({
                success: true,
                message: "Login successful",
                student: results[0]
            });
        }
    );
});

// ======================================================
// ADMIN LOGIN
// ======================================================

app.post("/admin-login", (req, res) => {

    const {
        email,
        password
    } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    const sql = `
        SELECT
            id,
            full_name,
            email
        FROM admins
        WHERE email = ?
        AND password = ?
        LIMIT 1
    `;

    db.query(
        sql,
        [email, password],
        (err, results) => {

            if (err) {

                console.error("Admin login error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Admin login failed",
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid admin email or password"
                });
            }

            res.json({
                success: true,
                message: "Admin login successful",
                admin: results[0]
            });
        }
    );
});

// ======================================================
// ADMIN - GET ALL STUDENTS
// ======================================================

app.get("/admin/students", (req, res) => {

    const sql = `
        SELECT
            id,
            full_name,
            email,
            phone,
            course
        FROM students
        ORDER BY id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error("Get students error:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to load students",
                error: err.message
            });
        }

        res.json({
            success: true,
            students: results
        });
    });
});

// ======================================================
// ADMIN - STUDENT COUNT
// ======================================================

app.get("/admin/student-count", (req, res) => {

    db.query(
        "SELECT COUNT(*) AS total FROM students",
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to get student count",
                    error: err.message
                });
            }

            res.json({
                success: true,
                total: results[0].total
            });
        }
    );
});

// ======================================================
// ADMIN - GET SINGLE STUDENT
// ======================================================

app.get("/admin/students/:id", (req, res) => {

    const studentId = Number(req.params.id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid student ID"
        });
    }

    db.query(
        `
        SELECT
            id,
            full_name,
            email,
            phone,
            course
        FROM students
        WHERE id = ?
        `,
        [studentId],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to load student",
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found"
                });
            }

            res.json({
                success: true,
                student: results[0]
            });
        }
    );
});

// ======================================================
// ADMIN - ADD STUDENT
// ======================================================

app.post("/admin/students", (req, res) => {

    const {
        fullName,
        email,
        phone,
        course,
        password
    } = req.body;

    if (!fullName || !email || !course || !password) {
        return res.status(400).json({
            success: false,
            message: "Name, email, course and password are required"
        });
    }

    db.query(
        `
        INSERT INTO students
        (full_name, email, phone, course, password)
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            fullName,
            email,
            phone || null,
            course,
            password
        ],
        (err, result) => {

            if (err) {

                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        success: false,
                        message: "This email is already registered"
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Unable to add student",
                    error: err.message
                });
            }

            res.status(201).json({
                success: true,
                message: "Student added successfully",
                studentId: result.insertId
            });
        }
    );
});

// ======================================================
// ADMIN - UPDATE STUDENT
// ======================================================

app.put("/admin/students/:id", (req, res) => {

    const studentId = Number(req.params.id);

    const {
        fullName,
        email,
        phone,
        course,
        password
    } = req.body;

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid student ID"
        });
    }

    if (!fullName || !email || !course) {
        return res.status(400).json({
            success: false,
            message: "Name, email and course are required"
        });
    }

    let sql;
    let values;

    if (password && password.trim() !== "") {

        sql = `
            UPDATE students
            SET
                full_name = ?,
                email = ?,
                phone = ?,
                course = ?,
                password = ?
            WHERE id = ?
        `;

        values = [
            fullName,
            email,
            phone || null,
            course,
            password,
            studentId
        ];

    } else {

        sql = `
            UPDATE students
            SET
                full_name = ?,
                email = ?,
                phone = ?,
                course = ?
            WHERE id = ?
        `;

        values = [
            fullName,
            email,
            phone || null,
            course,
            studentId
        ];
    }

    db.query(sql, values, (err, result) => {

        if (err) {

            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    success: false,
                    message: "This email is already registered"
                });
            }

            return res.status(500).json({
                success: false,
                message: "Unable to update student",
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.json({
            success: true,
            message: "Student updated successfully"
        });
    });
});

// ======================================================
// ADMIN - DELETE STUDENT
// ======================================================

app.delete("/admin/students/:id", (req, res) => {

    const studentId = Number(req.params.id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid student ID"
        });
    }

    db.query(
        "DELETE FROM attendance WHERE student_id = ?",
        [studentId],
        (attendanceErr) => {

            if (attendanceErr) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to delete attendance",
                    error: attendanceErr.message
                });
            }

            db.query(
                "DELETE FROM fees WHERE student_id = ?",
                [studentId],
                (feesErr) => {

                    if (feesErr) {
                        return res.status(500).json({
                            success: false,
                            message: "Unable to delete fees",
                            error: feesErr.message
                        });
                    }

                    db.query(
                        "DELETE FROM test_scores WHERE student_id = ?",
                        [studentId],
                        (scoreErr) => {

                            if (scoreErr) {
                                return res.status(500).json({
                                    success: false,
                                    message: "Unable to delete test scores",
                                    error: scoreErr.message
                                });
                            }

                            db.query(
                                "DELETE FROM students WHERE id = ?",
                                [studentId],
                                (studentErr, result) => {

                                    if (studentErr) {
                                        return res.status(500).json({
                                            success: false,
                                            message: "Unable to delete student",
                                            error: studentErr.message
                                        });
                                    }

                                    if (result.affectedRows === 0) {
                                        return res.status(404).json({
                                            success: false,
                                            message: "Student not found"
                                        });
                                    }

                                    res.json({
                                        success: true,
                                        message: "Student deleted successfully"
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

// ======================================================
// NOTIFICATION HELPER
// ======================================================

function sendCourseNotification(
    course,
    title,
    message,
    type = "general"
) {

    const sql = `
        INSERT INTO notifications
        (
            student_id,
            title,
            message,
            type
        )
        SELECT
            id,
            ?,
            ?,
            ?
        FROM students
        WHERE course = ?
    `;

    db.query(
        sql,
        [
            title,
            message,
            type,
            course
        ],
        (err) => {

            if (err) {
                console.error(
                    "Notification error:",
                    err.message
                );
            } else {
                console.log(
                    "Notification sent to students of:",
                    course
                );
            }
        }
    );
}

// ======================================================
// STUDENT NOTIFICATIONS - GET ALL
// ======================================================

app.get("/notifications/:studentId", (req, res) => {

    const studentId = Number(req.params.studentId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid student ID"
        });
    }

    db.query(
        `
        SELECT
            id,
            student_id,
            title,
            message,
            type,
            is_read,
            created_at
        FROM notifications
        WHERE student_id = ?
        ORDER BY created_at DESC, id DESC
        `,
        [studentId],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to load notifications",
                    error: err.message
                });
            }

            res.json({
                success: true,
                notifications: results
            });
        }
    );
});

// ======================================================
// STUDENT NOTIFICATIONS - UNREAD COUNT
// ======================================================

app.get("/notifications/:studentId/count", (req, res) => {

    const studentId = Number(req.params.studentId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid student ID"
        });
    }

    db.query(
        `
        SELECT COUNT(*) AS unread
        FROM notifications
        WHERE student_id = ?
        AND is_read = FALSE
        `,
        [studentId],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to get notification count",
                    error: err.message
                });
            }

            res.json({
                success: true,
                unread: results[0].unread
            });
        }
    );
});

// ======================================================
// MARK SINGLE NOTIFICATION AS READ
// ======================================================

app.put("/notifications/:id/read", (req, res) => {

    const notificationId = Number(req.params.id);

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid notification ID"
        });
    }

    db.query(
        `
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = ?
        `,
        [notificationId],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to mark notification as read",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Notification not found"
                });
            }

            res.json({
                success: true,
                message: "Notification marked as read"
            });
        }
    );
});

// ======================================================
// MARK ALL NOTIFICATIONS AS READ
// ======================================================

app.put(
    "/notifications/student/:studentId/read-all",
    (req, res) => {

        const studentId = Number(req.params.studentId);

        if (!Number.isInteger(studentId) || studentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        db.query(
            `
            UPDATE notifications
            SET is_read = TRUE
            WHERE student_id = ?
            AND is_read = FALSE
            `,
            [studentId],
            (err) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: "Unable to mark notifications as read",
                        error: err.message
                    });
                }

                res.json({
                    success: true,
                    message: "All notifications marked as read"
                });
            }
        );
    }
);

// ======================================================
// ATTENDANCE - GET
// ======================================================

app.get("/attendance/:studentId", (req, res) => {

    const studentId = Number(req.params.studentId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid student ID"
        });
    }

    db.query(
        `
        SELECT
            id,
            student_id,
            attendance_date,
            status,
            subject
        FROM attendance
        WHERE student_id = ?
        ORDER BY attendance_date DESC, id DESC
        `,
        [studentId],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to load attendance",
                    error: err.message
                });
            }

            res.json({
                success: true,
                attendance: results
            });
        }
    );
});

// ======================================================
// ATTENDANCE - ADD
// ======================================================

app.post("/attendance", (req, res) => {

    const studentId = Number(req.body.studentId);

    const attendanceDate =
        req.body.attendanceDate ||
        req.body.attendance_date ||
        req.body.date;

    const status = req.body.status;
    const subject = req.body.subject;

    if (
        !studentId ||
        !attendanceDate ||
        !status ||
        !subject
    ) {
        return res.status(400).json({
            success: false,
            message: "All attendance fields are required"
        });
    }

    if (
        !["Present", "Absent", "Leave"].includes(status)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Attendance status must be Present, Absent or Leave"
        });
    }

    db.query(
        `
        INSERT INTO attendance
        (
            student_id,
            attendance_date,
            status,
            subject
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            studentId,
            attendanceDate,
            status,
            subject
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to add attendance",
                    error: err.message
                });
            }

            res.status(201).json({
                success: true,
                message: "Attendance added successfully",
                attendanceId: result.insertId
            });
        }
    );
});

// ======================================================
// FEES - GET
// ======================================================

app.get("/fees/:studentId", (req, res) => {

    const studentId = Number(req.params.studentId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid student ID"
        });
    }

    db.query(
        `
        SELECT
            id,
            student_id,
            total_fees,
            paid_fees,
            pending_fees,
            payment_status,
            last_payment_date
        FROM fees
        WHERE student_id = ?
        ORDER BY id DESC
        `,
        [studentId],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to load fees",
                    error: err.message
                });
            }

            res.json({
                success: true,
                fees: results
            });
        }
    );
});

// ======================================================
// FEES - ADD
// ======================================================

app.post("/fees", (req, res) => {

    const studentId = Number(req.body.studentId);
    const totalFees = Number(req.body.totalFees);
    const paidFees = Number(req.body.paidFees);

    const lastPaymentDate =
        req.body.lastPaymentDate ||
        req.body.last_payment_date ||
        null;

    if (
        !studentId ||
        !Number.isFinite(totalFees) ||
        !Number.isFinite(paidFees)
    ) {
        return res.status(400).json({
            success: false,
            message: "Required fee details are missing"
        });
    }

    if (totalFees < 0 || paidFees < 0) {
        return res.status(400).json({
            success: false,
            message: "Fees cannot be negative"
        });
    }

    if (paidFees > totalFees) {
        return res.status(400).json({
            success: false,
            message: "Paid fees cannot be greater than total fees"
        });
    }

    const pendingFees = totalFees - paidFees;

    let paymentStatus = "Pending";

    if (pendingFees === 0) {
        paymentStatus = "Paid";
    } else if (paidFees > 0) {
        paymentStatus = "Partial";
    }

    db.query(
        `
        INSERT INTO fees
        (
            student_id,
            total_fees,
            paid_fees,
            pending_fees,
            payment_status,
            last_payment_date
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            studentId,
            totalFees,
            paidFees,
            pendingFees,
            paymentStatus,
            lastPaymentDate
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to add fees",
                    error: err.message
                });
            }

            res.status(201).json({
                success: true,
                message: "Fees added successfully",
                feeId: result.insertId
            });
        }
    );
});

// ======================================================
// COURSES - GET ALL
// ======================================================

app.get("/courses", (req, res) => {

    db.query(
        `
        SELECT
            id,
            course_name,
            course_code,
            duration,
            total_fees,
            description,
            created_at
        FROM courses
        ORDER BY id DESC
        `,
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to load courses",
                    error: err.message
                });
            }

            res.json({
                success: true,
                courses: results
            });
        }
    );
});

// ======================================================
// COURSE - GET SINGLE
// ======================================================

app.get("/courses/:id", (req, res) => {

    const courseId = Number(req.params.id);

    db.query(
        `
        SELECT *
        FROM courses
        WHERE id = ?
        `,
        [courseId],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to load course",
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Course not found"
                });
            }

            res.json({
                success: true,
                course: results[0]
            });
        }
    );
});

// ======================================================
// COURSE - ADD
// ======================================================

app.post("/courses", (req, res) => {

    const courseName =
        req.body.courseName ??
        req.body.course_name;

    const courseCode =
        req.body.courseCode ??
        req.body.course_code;

    const duration = req.body.duration;

    const totalFees =
        req.body.totalFees ??
        req.body.total_fees;

    const description =
        req.body.description;

    if (!courseName) {
        return res.status(400).json({
            success: false,
            message: "Course name is required"
        });
    }

    db.query(
        `
        INSERT INTO courses
        (
            course_name,
            course_code,
            duration,
            total_fees,
            description
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            courseName,
            courseCode || null,
            duration || null,
            Number(totalFees) || 0,
            description || null
        ],
        (err, result) => {

            if (err) {

                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        success: false,
                        message: "Course code already exists"
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Unable to add course",
                    error: err.message
                });
            }

            res.status(201).json({
                success: true,
                message: "Course added successfully",
                courseId: result.insertId
            });
        }
    );
});

// ======================================================
// COURSE - UPDATE
// ======================================================

app.put("/courses/:id", (req, res) => {

    const courseId = Number(req.params.id);

    const courseName =
        req.body.courseName ??
        req.body.course_name;

    const courseCode =
        req.body.courseCode ??
        req.body.course_code;

    const duration = req.body.duration;

    const totalFees =
        req.body.totalFees ??
        req.body.total_fees;

    const description =
        req.body.description;

    if (!courseName) {
        return res.status(400).json({
            success: false,
            message: "Course name is required"
        });
    }

    db.query(
        `
        UPDATE courses
        SET
            course_name = ?,
            course_code = ?,
            duration = ?,
            total_fees = ?,
            description = ?
        WHERE id = ?
        `,
        [
            courseName,
            courseCode || null,
            duration || null,
            Number(totalFees) || 0,
            description || null,
            courseId
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to update course",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Course not found"
                });
            }

            res.json({
                success: true,
                message: "Course updated successfully"
            });
        }
    );
});

// ======================================================
// COURSE - DELETE
// ======================================================

app.delete("/courses/:id", (req, res) => {

    const courseId = Number(req.params.id);

    db.query(
        "DELETE FROM courses WHERE id = ?",
        [courseId],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to delete course",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Course not found"
                });
            }

            res.json({
                success: true,
                message: "Course deleted successfully"
            });
        }
    );
});

// ======================================================
// LECTURE SCHEDULE - STUDENT
// ======================================================

app.get("/schedule/:course", (req, res) => {

    const course = req.params.course;

    db.query(
        `
        SELECT
            id,
            course,
            subject,
            teacher_name,
            lecture_date,
            start_time,
            end_time,
            room,
            description
        FROM lecture_schedule
        WHERE course = ?
        ORDER BY lecture_date ASC, start_time ASC
        `,
        [course],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to load lecture schedule",
                    error: err.message
                });
            }

            res.json({
                success: true,
                schedules: results
            });
        }
    );
});

// ======================================================
// ADMIN - GET ALL LECTURE SCHEDULES
// ======================================================

app.get("/admin/schedule", (req, res) => {

    db.query(
        `
        SELECT
            id,
            course,
            subject,
            teacher_name,
            lecture_date,
            start_time,
            end_time,
            room,
            description,
            created_at
        FROM lecture_schedule
        ORDER BY lecture_date ASC, start_time ASC
        `,
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to load schedules",
                    error: err.message
                });
            }

            res.json({
                success: true,
                schedules: results
            });
        }
    );
});

// ======================================================
// ADMIN - GET SINGLE SCHEDULE
// ======================================================

app.get("/admin/schedule/:id", (req, res) => {

    const scheduleId = Number(req.params.id);

    db.query(
        "SELECT * FROM lecture_schedule WHERE id = ?",
        [scheduleId],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to load schedule",
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Schedule not found"
                });
            }

            res.json({
                success: true,
                schedule: results[0]
            });
        }
    );
});

// ======================================================
// ADMIN - ADD SCHEDULE + NOTIFICATION
// ======================================================

app.post("/admin/schedule", (req, res) => {

    const course = req.body.course;
    const subject = req.body.subject;

    const teacherName =
        req.body.teacherName ??
        req.body.teacher_name;

    const lectureDate =
        req.body.lectureDate ??
        req.body.lecture_date;

    const startTime =
        req.body.startTime ??
        req.body.start_time;

    const endTime =
        req.body.endTime ??
        req.body.end_time;

    const room = req.body.room;
    const description = req.body.description;

    if (
        !course ||
        !subject ||
        !teacherName ||
        !lectureDate ||
        !startTime ||
        !endTime
    ) {
        return res.status(400).json({
            success: false,
            message: "Required schedule fields are missing"
        });
    }

    db.query(
        `
        INSERT INTO lecture_schedule
        (
            course,
            subject,
            teacher_name,
            lecture_date,
            start_time,
            end_time,
            room,
            description
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            course,
            subject,
            teacherName,
            lectureDate,
            startTime,
            endTime,
            room || null,
            description || null
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to add schedule",
                    error: err.message
                });
            }

            sendCourseNotification(
                course,
                "📢 New Lecture Scheduled",
                `${subject} lecture has been scheduled on ${lectureDate} from ${startTime} to ${endTime}. Teacher: ${teacherName}${room ? `, Room: ${room}` : ""}.`,
                "schedule"
            );

            res.status(201).json({
                success: true,
                message: "Lecture schedule added successfully",
                scheduleId: result.insertId
            });
        }
    );
});

// ======================================================
// ADMIN - UPDATE SCHEDULE + NOTIFICATION
// ======================================================

app.put("/admin/schedule/:id", (req, res) => {

    const scheduleId = Number(req.params.id);

    const course = req.body.course;
    const subject = req.body.subject;

    const teacherName =
        req.body.teacherName ??
        req.body.teacher_name;

    const lectureDate =
        req.body.lectureDate ??
        req.body.lecture_date;

    const startTime =
        req.body.startTime ??
        req.body.start_time;

    const endTime =
        req.body.endTime ??
        req.body.end_time;

    const room = req.body.room;
    const description = req.body.description;

    if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid schedule ID"
        });
    }

    if (
        !course ||
        !subject ||
        !teacherName ||
        !lectureDate ||
        !startTime ||
        !endTime
    ) {
        return res.status(400).json({
            success: false,
            message: "Required schedule fields are missing"
        });
    }

    db.query(
        "SELECT * FROM lecture_schedule WHERE id = ?",
        [scheduleId],
        (selectErr, oldRows) => {

            if (selectErr) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to load old schedule",
                    error: selectErr.message
                });
            }

            if (oldRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Schedule not found"
                });
            }

            const oldSchedule = oldRows[0];

            db.query(
                `
                UPDATE lecture_schedule
                SET
                    course = ?,
                    subject = ?,
                    teacher_name = ?,
                    lecture_date = ?,
                    start_time = ?,
                    end_time = ?,
                    room = ?,
                    description = ?
                WHERE id = ?
                `,
                [
                    course,
                    subject,
                    teacherName,
                    lectureDate,
                    startTime,
                    endTime,
                    room || null,
                    description || null,
                    scheduleId
                ],
                (err, result) => {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Unable to update schedule",
                            error: err.message
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            success: false,
                            message: "Schedule not found"
                        });
                    }

                    sendCourseNotification(
                        course,
                        "🔔 Lecture Schedule Updated",
                        `${subject} lecture schedule has been updated. Date: ${lectureDate}, Time: ${startTime} to ${endTime}${room ? `, Room: ${room}` : ""}.`,
                        "schedule"
                    );

                    if (oldSchedule.course !== course) {

                        sendCourseNotification(
                            oldSchedule.course,
                            "🔔 Lecture Schedule Updated",
                            `${oldSchedule.subject} lecture schedule has been changed or moved. Please check the updated lecture schedule.`,
                            "schedule"
                        );
                    }

                    res.json({
                        success: true,
                        message: "Schedule updated successfully"
                    });
                }
            );
        }
    );
});

// ======================================================
// ADMIN - DELETE SCHEDULE + NOTIFICATION
// ======================================================

app.delete("/admin/schedule/:id", (req, res) => {

    const scheduleId = Number(req.params.id);

    if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid schedule ID"
        });
    }

    db.query(
        "SELECT * FROM lecture_schedule WHERE id = ?",
        [scheduleId],
        (selectErr, rows) => {

            if (selectErr) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to load schedule",
                    error: selectErr.message
                });
            }

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Schedule not found"
                });
            }

            const lecture = rows[0];

            db.query(
                "DELETE FROM lecture_schedule WHERE id = ?",
                [scheduleId],
                (err, result) => {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Unable to delete schedule",
                            error: err.message
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            success: false,
                            message: "Schedule not found"
                        });
                    }

                    sendCourseNotification(
                        lecture.course,
                        "⚠️ Lecture Cancelled",
                        `${lecture.subject} lecture scheduled on ${lecture.lecture_date} from ${lecture.start_time} to ${lecture.end_time} has been cancelled.`,
                        "schedule"
                    );

                    res.json({
                        success: true,
                        message: "Schedule deleted successfully"
                    });
                }
            );
        }
    );
});

// ======================================================
// TEST SCORES - STUDENT
// ======================================================

app.get("/test-scores/:studentId", (req, res) => {

    const studentId = Number(req.params.studentId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid student ID"
        });
    }

    db.query(
        `
        SELECT
            id,
            student_id,
            test_name,
            subject,
            total_marks,
            obtained_marks,
            exam_date,
            remarks,
            created_at
        FROM test_scores
        WHERE student_id = ?
        ORDER BY exam_date DESC, id DESC
        `,
        [studentId],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to load test scores",
                    error: err.message
                });
            }

            res.json({
                success: true,
                testScores: results,
                scores: results
            });
        }
    );
});

// ======================================================
// ADMIN - GET ALL TEST SCORES
// ======================================================

app.get("/admin/test-scores", (req, res) => {

    db.query(
        `
        SELECT
            ts.id,
            ts.student_id,
            s.full_name,
            s.course,
            ts.test_name,
            ts.subject,
            ts.total_marks,
            ts.obtained_marks,
            ts.exam_date,
            ts.remarks,
            ts.created_at
        FROM test_scores ts
        LEFT JOIN students s
            ON ts.student_id = s.id
        ORDER BY ts.exam_date DESC, ts.id DESC
        `,
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to load test scores",
                    error: err.message
                });
            }

            res.json({
                success: true,
                testScores: results,
                scores: results
            });
        }
    );
});

// ======================================================
// ADMIN - GET SINGLE TEST SCORE
// ======================================================

app.get("/admin/test-scores/:id", (req, res) => {

    const scoreId = Number(req.params.id);

    db.query(
        `
        SELECT
            ts.*,
            s.full_name,
            s.course
        FROM test_scores ts
        LEFT JOIN students s
            ON ts.student_id = s.id
        WHERE ts.id = ?
        `,
        [scoreId],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to load test score",
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Test score not found"
                });
            }

            res.json({
                success: true,
                testScore: results[0]
            });
        }
    );
});

// ======================================================
// ADMIN - ADD TEST SCORE
// ======================================================

app.post("/admin/test-scores", (req, res) => {

    const studentId = Number(req.body.studentId);

    const testName =
        req.body.testName ??
        req.body.test_name;

    const subject = req.body.subject;

    const totalMarks = Number(
        req.body.totalMarks ??
        req.body.total_marks
    );

    const obtainedMarks = Number(
        req.body.obtainedMarks ??
        req.body.obtained_marks
    );

    const examDate =
        req.body.examDate ??
        req.body.exam_date;

    const remarks = req.body.remarks;

    if (
        !studentId ||
        !testName ||
        !subject ||
        !Number.isFinite(totalMarks) ||
        !Number.isFinite(obtainedMarks) ||
        !examDate
    ) {
        return res.status(400).json({
            success: false,
            message: "All required test score fields are required"
        });
    }

    if (totalMarks <= 0) {
        return res.status(400).json({
            success: false,
            message: "Total marks must be greater than 0"
        });
    }

    if (
        obtainedMarks < 0 ||
        obtainedMarks > totalMarks
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Obtained marks must be between 0 and total marks"
        });
    }

    db.query(
        "SELECT id FROM students WHERE id = ?",
        [studentId],
        (studentErr, students) => {

            if (studentErr) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to verify student",
                    error: studentErr.message
                });
            }

            if (students.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found"
                });
            }

            db.query(
                `
                INSERT INTO test_scores
                (
                    student_id,
                    test_name,
                    subject,
                    total_marks,
                    obtained_marks,
                    exam_date,
                    remarks
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    studentId,
                    testName,
                    subject,
                    totalMarks,
                    obtainedMarks,
                    examDate,
                    remarks || null
                ],
                (err, result) => {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Unable to add test score",
                            error: err.message
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: "Test score added successfully",
                        testScoreId: result.insertId
                    });
                }
            );
        }
    );
});

// ======================================================
// ADMIN - UPDATE TEST SCORE
// ======================================================

app.put("/admin/test-scores/:id", (req, res) => {

    const scoreId = Number(req.params.id);
    const studentId = Number(req.body.studentId);

    const testName =
        req.body.testName ??
        req.body.test_name;

    const subject = req.body.subject;

    const totalMarks = Number(
        req.body.totalMarks ??
        req.body.total_marks
    );

    const obtainedMarks = Number(
        req.body.obtainedMarks ??
        req.body.obtained_marks
    );

    const examDate =
        req.body.examDate ??
        req.body.exam_date;

    const remarks = req.body.remarks;

    if (
        !studentId ||
        !testName ||
        !subject ||
        !Number.isFinite(totalMarks) ||
        !Number.isFinite(obtainedMarks) ||
        !examDate
    ) {
        return res.status(400).json({
            success: false,
            message: "All required test score fields are required"
        });
    }

    if (
        totalMarks <= 0 ||
        obtainedMarks < 0 ||
        obtainedMarks > totalMarks
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid marks"
        });
    }

    db.query(
        `
        UPDATE test_scores
        SET
            student_id = ?,
            test_name = ?,
            subject = ?,
            total_marks = ?,
            obtained_marks = ?,
            exam_date = ?,
            remarks = ?
        WHERE id = ?
        `,
        [
            studentId,
            testName,
            subject,
            totalMarks,
            obtainedMarks,
            examDate,
            remarks || null,
            scoreId
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to update test score",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Test score not found"
                });
            }

            res.json({
                success: true,
                message: "Test score updated successfully"
            });
        }
    );
});

// ======================================================
// ADMIN - DELETE TEST SCORE
// ======================================================

app.delete("/admin/test-scores/:id", (req, res) => {

    const scoreId = Number(req.params.id);

    db.query(
        "DELETE FROM test_scores WHERE id = ?",
        [scoreId],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to delete test score",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Test score not found"
                });
            }

            res.json({
                success: true,
                message: "Test score deleted successfully"
            });
        }
    );
});

// ======================================================
// NOTES - STUDENT GET BY COURSE
// ======================================================

app.get("/notes/:course", (req, res) => {

    const course = req.params.course;

    db.query(
        `
        SELECT
            id,
            course,
            subject,
            title,
            description,
            note_url,
            created_at
        FROM notes
        WHERE course = ?
        ORDER BY created_at DESC
        `,
        [course],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to load notes",
                    error: err.message
                });
            }

            res.json({
                success: true,
                notes: results
            });
        }
    );
});

// ======================================================
// NOTES - ADMIN GET ALL
// ======================================================

app.get("/admin/notes", (req, res) => {

    db.query(
        `
        SELECT
            id,
            course,
            subject,
            title,
            description,
            note_url,
            created_at
        FROM notes
        ORDER BY id DESC
        `,
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to load notes",
                    error: err.message
                });
            }

            res.json({
                success: true,
                notes: results
            });
        }
    );
});

// ======================================================
// NOTES - ADMIN ADD
// ======================================================

app.post("/admin/notes", (req, res) => {

    const course = req.body.course;
    const subject = req.body.subject;
    const title = req.body.title;
    const description = req.body.description;

    const noteUrl =
        req.body.noteUrl ??
        req.body.note_url;

    if (
        !course ||
        !subject ||
        !title ||
        !noteUrl
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Course, subject, title and note URL are required"
        });
    }

    db.query(
        `
        INSERT INTO notes
        (
            course,
            subject,
            title,
            description,
            note_url
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            course,
            subject,
            title,
            description || null,
            noteUrl
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to add note",
                    error: err.message
                });
            }

            res.status(201).json({
                success: true,
                message: "Note added successfully",
                noteId: result.insertId
            });
        }
    );
});

// ======================================================
// NOTES - ADMIN UPDATE
// ======================================================

app.put("/admin/notes/:id", (req, res) => {

    const noteId = Number(req.params.id);

    const course = req.body.course;
    const subject = req.body.subject;
    const title = req.body.title;
    const description = req.body.description;

    const noteUrl =
        req.body.noteUrl ??
        req.body.note_url;

    if (!Number.isInteger(noteId) || noteId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid note ID"
        });
    }

    if (
        !course ||
        !subject ||
        !title ||
        !noteUrl
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Course, subject, title and note URL are required"
        });
    }

    db.query(
        `
        UPDATE notes
        SET
            course = ?,
            subject = ?,
            title = ?,
            description = ?,
            note_url = ?
        WHERE id = ?
        `,
        [
            course,
            subject,
            title,
            description || null,
            noteUrl,
            noteId
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to update note",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Note not found"
                });
            }

            res.json({
                success: true,
                message: "Note updated successfully"
            });
        }
    );
});

// ======================================================
// NOTES - ADMIN DELETE
// ======================================================

app.delete("/admin/notes/:id", (req, res) => {

    const noteId = Number(req.params.id);

    if (!Number.isInteger(noteId) || noteId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid note ID"
        });
    }

    db.query(
        "DELETE FROM notes WHERE id = ?",
        [noteId],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to delete note",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Note not found"
                });
            }

            res.json({
                success: true,
                message: "Note deleted successfully"
            });
        }
    );
});

// ======================================================
// ADMIN DASHBOARD SUMMARY
// ======================================================

app.get("/admin/dashboard-summary", (req, res) => {

    const sql = `
        SELECT
            (SELECT COUNT(*) FROM students) AS students,
            (SELECT COUNT(*) FROM courses) AS courses,
            (SELECT COUNT(*) FROM attendance) AS attendance,
            (SELECT COUNT(*) FROM fees) AS fees,
            (SELECT COUNT(*) FROM lecture_schedule) AS lectures,
            (SELECT COUNT(*) FROM test_scores) AS tests
    `;

    db.query(sql, (err, rows) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Unable to load dashboard summary",
                error: err.message
            });
        }

        res.json({
            success: true,
            ...rows[0]
        });
    });
});

// ======================================================
// 404 HANDLER
// ======================================================

app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "API route not found",
        path: req.originalUrl
    });
});

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {

    console.error("Server error:", err);

    res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message
    });
});

// ======================================================
// START SERVER
// ======================================================

app.listen(PORT, () => {

    console.log("");
    console.log("==========================================");
    console.log("       MECC BACKEND SERVER");
    console.log("==========================================");

    console.log(
        "MECC Backend running at http://localhost:" + PORT
    );

    console.log("MySQL connected through db.js");

    console.log("==========================================");
    console.log("");
});