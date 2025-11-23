require("dotenv").config();
const nodemailer = require('nodemailer');

// Hostinger SMTP Configuration
const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER || 'password@oveventz.com';
const smtpPass = process.env.SMTP_PASS || '';

console.log('🔍 Testing Hostinger SMTP Configuration...\n');
console.log('📧 SMTP Settings:');
console.log('   Host:', smtpHost);
console.log('   Port:', smtpPort);
console.log('   User:', smtpUser);
console.log('   Pass:', smtpPass ? '***' + smtpPass.slice(-3) : '❌ NOT SET\n');

if (!smtpPass) {
    console.error('❌ ERROR: SMTP_PASS not set!');
    console.log('\n📝 Instructions:');
    console.log('   1. Hostinger Mailboxes section mein jao');
    console.log('   2. password@oveventz.com ke liye password set/reset karo');
    console.log('   3. .env file mein SMTP_PASS=your_password set karo');
    console.log('   4. Phir se script run karo: node test-smtp-hostinger.js\n');
    process.exit(1);
}

// Create transporter with Hostinger settings
const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for 587
    auth: {
        user: smtpUser,
        pass: smtpPass
    },
    tls: {
        rejectUnauthorized: false
    },
    debug: true,
    logger: true
});

console.log('🔄 Verifying Hostinger SMTP connection...\n');

// Test SMTP connection
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ SMTP Verification Failed!\n');
        console.error('Error Details:');
        console.error('   Code:', error.code);
        console.error('   Command:', error.command);
        console.error('   Message:', error.message);
        
        if (error.response) {
            console.error('   Response:', error.response);
        }
        
        console.log('\n💡 Solutions:');
        console.log('   1. Password correct hai? (Hostinger Mailboxes se verify karo)');
        console.log('   2. Port 465 try karo agar 587 fail ho:');
        console.log('      SMTP_PORT=465 (aur secure: true)');
        console.log('   3. Full email address use karo: password@oveventz.com');
        console.log('   4. Hostinger support se contact karo agar issue continue ho\n');
        
        process.exit(1);
    } else {
        console.log('✅ Hostinger SMTP Server Verified Successfully!\n');
        console.log('📤 Testing email send...\n');
        
        // Test email send
        const testEmail = smtpUser;
        const mailOptions = {
            from: `"Oveventz Test" <${smtpUser}>`,
            to: testEmail,
            subject: 'Hostinger SMTP Test - ' + new Date().toLocaleString(),
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #4f46e5;">✅ Hostinger SMTP Test Successful!</h2>
                    <p>Yeh test email hai. Agar aapko yeh email mil raha hai, toh SMTP settings sahi hain.</p>
                    <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>SMTP Host:</strong> ${smtpHost}</p>
                    <p><strong>SMTP Port:</strong> ${smtpPort}</p>
                    <p><strong>Provider:</strong> Hostinger</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">Yeh automated test email hai.</p>
                </div>
            `
        };
        
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('❌ Email Send Failed!\n');
                console.error('Error:', error.message);
                console.log('\n💡 Try Port 465:');
                console.log('   SMTP_PORT=465 (SSL)\n');
                process.exit(1);
            } else {
                console.log('✅ Test Email Sent Successfully!\n');
                console.log('📧 Email Details:');
                console.log('   To:', testEmail);
                console.log('   Message ID:', info.messageId);
                console.log('   Response:', info.response);
                console.log('\n🎉 Hostinger SMTP Configuration is working perfectly!');
                console.log('\n📝 Ab aap .env file mein yeh settings use kar sakte hain:\n');
                console.log(`SMTP_HOST=${smtpHost}`);
                console.log(`SMTP_PORT=${smtpPort}`);
                console.log(`SMTP_USER=${smtpUser}`);
                console.log(`SMTP_PASS=${smtpPass}\n`);
                console.log('✅ Production (Render/Vercel) mein bhi same settings add karo!\n');
                process.exit(0);
            }
        });
    }
});

