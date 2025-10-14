import nodemailer from 'nodemailer';

// Test with the exact configuration that will be on Render
const EMAIL_USER = 'jefor16@gmail.com';
const EMAIL_FROM = 'jefor16@gmail.com';
const EMAIL_PASSWORD = 'yhtykpskbzomlwib';
const RECIPIENT = 'cashier.employe01@gmail.com';

async function testFinalConfig() {
  console.log('🔧 Testing FINAL Email Configuration for Render...\n');
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD
      }
    });
    
    console.log('📧 Sending test email with proper sender format...');
    
    const result = await transporter.sendMail({
      from: `"ESCA Shop" <${EMAIL_FROM}>`, // This is the format we're now using
      to: RECIPIENT,
      subject: 'Final Configuration Test - Password Reset',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2>Password Reset Request</h2>
          <p>Dear Cashier,</p>
          <p>You have requested to reset your password for your EscaShop Optical account.</p>
          <p>Please click the button below to reset your password:</p>
          <a href="https://escashop-frontend.onrender.com/reset-password/test-token-123" 
             style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you did not request this password reset, please ignore this email or contact your administrator.</p>
          <br>
          <p>Best regards,<br>EscaShop Optical Team</p>
        </div>
      `
    });
    
    console.log('\n✅ SUCCESS! Email sent with final configuration!');
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);
    console.log('\n📨 Email details:');
    console.log('  From: "ESCA Shop" <jefor16@gmail.com>');
    console.log('  To:', RECIPIENT);
    console.log('  Subject: Final Configuration Test - Password Reset');
    console.log('\n👉 Check the inbox of', RECIPIENT);
    console.log('   (Also check spam/junk folder)\n');
    
  } catch (error: any) {
    console.error('\n❌ FAILED! Email configuration test failed:');
    console.error('Error:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.response) console.error('Server response:', error.response);
    console.log('\n💡 This means there is still an issue with the email configuration.');
    console.log('   Please check:');
    console.log('   1. Gmail App Password is correct');
    console.log('   2. 2-Step Verification is enabled on jefor16@gmail.com');
    console.log('   3. Gmail account is not locked or suspended\n');
  }
}

testFinalConfig();
