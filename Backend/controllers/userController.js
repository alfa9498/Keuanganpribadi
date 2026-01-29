const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { sendEmail, sendWhatsApp } = require('../services/notificationService');

const JWT_SECRET = 'your_jwt_secret_key'; // In production, use environment variable

exports.register = (req, res) => {
    const { fullName, email, phone, password, gender } = req.body;

    // VALIDATION BASIC
    if (!fullName || !email || !password) {
        return res.status(400).json({ message: "Field wajib harus diisi!" });
    }

    const query = "INSERT INTO users (full_name, email, phone, password, gender) VALUES (?, ?, ?, ?, ?)";
    db.query(query, [fullName, email, phone, password, gender || 'male'], (err, result) => {
        if (err) {
            console.error("Register Error:", err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: "Email sudah terdaftar!" });
            }
            return res.status(500).json({ message: "Terjadi kesalahan server" });
        }

        res.status(201).json({
            message: "Registrasi berhasil",
            data: { id: result.insertId, fullName, email }
        });
    });
};

exports.login = (req, res) => {
    const { email, password } = req.body;

    // VALIDATION BASIC
    if (!email || !password) {
        return res.status(400).json({ message: "Email dan password wajib diisi!" });
    }

    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error("Login Error:", err);
            return res.status(500).json({ 
                message: "Terjadi kesalahan server saat login",
                error: err.message,
                code: err.code
            });
        }


        if (results.length === 0) {
            return res.status(401).json({ message: "Email atau password salah" });
        }

        const user = results[0];

        // CHECK PASSWORD (PLAIN TEXT FOR NOW)
        if (password !== user.password) {
            return res.status(401).json({ message: "Email atau password salah" });
        }

        const userData = {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            gender: user.gender || 'male'
        };

        const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // MUST be true for Vercel (HTTPS)
            sameSite: 'none', // Needed for cross-site (preview to prod)
            maxAge: 3600000 // 1 hour
        });


        res.status(200).json({
            message: "Login berhasil",
            user: userData
        });
    });
};

exports.me = (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.status(200).json({ user: decoded });
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: "Logout successful" });
};

// --- FORGOT PASSWORD LOGIC ---

// 1. Request Reset (Generate OTP)
exports.requestPasswordReset = (req, res) => {
    const { email, phone } = req.body;

    if (!email || !phone) {
        return res.status(400).json({ message: "Email dan No. Telepon wajib diisi!" });
    }

    // Check if user exists with matching email and phone
    const query = "SELECT * FROM users WHERE email = ? AND phone = ?";
    db.query(query, [email, phone], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Server Error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "User tidak ditemukan atau data tidak cocok!" });
        }

        const user = results[0];
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
        const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes expiry

        // Save OTP to DB
        const insertQuery = "INSERT INTO password_resets (user_id, otp, expires_at) VALUES (?, ?, ?)";
        db.query(insertQuery, [user.id, otp, expiresAt], async (insertErr) => {
            if (insertErr) {
                console.error(insertErr);
                return res.status(500).json({ message: "Gagal menyimpan OTP" });
            }

            // Send Notifications
            const message = `Kode OTP Reset Password Anda: ${otp}. Berlaku selama 5 menit.`;

            // Send to Email
            sendEmail(user.email, "Reset Password OTP", message);

            // Send to WhatsApp
            sendWhatsApp(user.phone, message);

            res.json({ message: "OTP telah dikirim ke Email dan WhatsApp" });
        });
    });
};

// 2. Verify OTP
exports.verifyOtp = (req, res) => {
    const { email, otp } = req.body;

    // Get user id from email first
    const userQuery = "SELECT id FROM users WHERE email = ?";
    db.query(userQuery, [email], (err, users) => {
        if (err || users.length === 0) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        const userId = users[0].id;

        // Check Valid OTP
        const otpQuery = "SELECT * FROM password_resets WHERE user_id = ? AND otp = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1";
        db.query(otpQuery, [userId, otp], (otpErr, otpResults) => {
            if (otpErr) {
                return res.status(500).json({ message: "Server Error" });
            }

            if (otpResults.length === 0) {
                return res.status(400).json({ message: "OTP salah atau kadaluarsa" });
            }

            res.json({ message: "OTP Valid", isValid: true });
        });
    });
};

// 3. Reset Password
exports.resetPassword = (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password minimal 6 karakter" });
    }

    // Verify OTP again (security measure)
    const userQuery = "SELECT id FROM users WHERE email = ?";
    db.query(userQuery, [email], (err, users) => {
        if (err || users.length === 0) return res.status(404).json({ message: "User tidak ditemukan" });

        const userId = users[0].id;

        const otpQuery = "SELECT * FROM password_resets WHERE user_id = ? AND otp = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1";
        db.query(otpQuery, [userId, otp], (otpErr, otpResults) => {
            if (otpResults.length === 0) {
                return res.status(400).json({ message: "OTP salah atau kadaluarsa. Silakan ulangi proses." });
            }

            // Update Password
            const updateQuery = "UPDATE users SET password = ? WHERE id = ?";
            db.query(updateQuery, [newPassword, userId], (updateErr) => {
                if (updateErr) return res.status(500).json({ message: "Gagal update password" });

                // Delete used OTP
                db.query("DELETE FROM password_resets WHERE user_id = ?", [userId]);

                res.json({ message: "Password berhasil diubah! Silakan login." });
            });
        });
    });
};

// 4. Generate Telegram Link
exports.generateTelegramLink = (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        
        // Generate a special short-lived token for linking (5 mins)
        // We include fullName for Greeting message
        const linkPayload = { 
            id: userId, 
            fullName: decoded.fullName,
            type: 'telegram_link' 
        };
        const linkToken = jwt.sign(linkPayload, JWT_SECRET, { expiresIn: '5m' });

        const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'MyFinanceBot'; 
        
        res.status(200).json({ 
            linkToken: linkToken,
            url: `https://t.me/${botUsername}?start=${linkToken}`
        });

    } catch (err) {
        res.status(401).json({ message: "Invalid session" });
    }
};
