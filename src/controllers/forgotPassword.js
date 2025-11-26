const User = require("../models/user");
const transporter = require("../utils/mailer");

// Store verification codes in memory (in production, use Redis or database)
const verificationCodes = new Map();

// Send verification code to email
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if user exists (vendor or customer)
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Email not found. Please check your email address."
            });
        }

        // Generate 6-digit verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store code with expiration (10 minutes)
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        verificationCodes.set(normalizedEmail, {
            code,
            expiresAt,
            verified: false
        });

        // Send email with code
        const SENDER_EMAIL = process.env.SMTP_USER?.trim() || "password@oveventz.com";
        const html = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #4f46e5;">Password Reset Verification Code</h2>
                <p>Hello,</p>
                <p>You requested to reset your password. Please use the verification code below:</p>
                <div style="background-color: #f7f7f7; border: 2px solid #4f46e5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #4f46e5; font-size: 32px; letter-spacing: 5px; margin: 0;">${code}</h1>
                </div>
                <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <p>Thank you,<br><strong>oveventz Team</strong></p>
            </div>
        `;

        const mailOptions = {
            from: SENDER_EMAIL,
            to: normalizedEmail,
            subject: "Password Reset Verification Code",
            html,
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error(`❌ Email error: ${err.message}`);
                return res.status(500).json({
                    success: false,
                    message: "Failed to send verification code. Please try again.",
                    error: err.message,
                });
            }
            console.log(`✅ Verification code sent to: ${normalizedEmail}`);
            res.status(200).json({
                success: true,
                message: "Verification code sent to your email",
            });
        });
    } catch (error) {
        console.error("forgotPassword error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Verify code
const verifyCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: "Email and code are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const storedData = verificationCodes.get(normalizedEmail);

        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired code. Please request a new code."
            });
        }

        if (Date.now() > storedData.expiresAt) {
            verificationCodes.delete(normalizedEmail);
            return res.status(400).json({
                success: false,
                message: "Code has expired. Please request a new code."
            });
        }

        if (storedData.code !== code) {
            return res.status(400).json({
                success: false,
                message: "Invalid code. Please check and try again."
            });
        }

        // Mark code as verified
        storedData.verified = true;
        verificationCodes.set(normalizedEmail, storedData);

        return res.status(200).json({
            success: true,
            message: "Code verified successfully"
        });
    } catch (error) {
        console.error("verifyCode error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Reset password with verified code
const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email, code, and new password are required"
            });
        }

        // Validate password
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const storedData = verificationCodes.get(normalizedEmail);

        if (!storedData || !storedData.verified) {
            return res.status(400).json({
                success: false,
                message: "Please verify your code first"
            });
        }

        if (storedData.code !== code) {
            return res.status(400).json({
                success: false,
                message: "Invalid code"
            });
        }

        if (Date.now() > storedData.expiresAt) {
            verificationCodes.delete(normalizedEmail);
            return res.status(400).json({
                success: false,
                message: "Code has expired. Please request a new code."
            });
        }

        // Find user and update password
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        await user.save();

        // Delete verification code after successful reset
        verificationCodes.delete(normalizedEmail);

        return res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });
    } catch (error) {
        console.error("resetPassword error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

module.exports = {
    forgotPassword,
    verifyCode,
    resetPassword
};

