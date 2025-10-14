import nodemailer from 'nodemailer';

const NEW_PASSWORD = 'yhtykpskbzomlwib';
const EMAIL_USER = 'jefor16@gmail.com';

async function testNewPassword() {
  try {
    console.log('🔧 Testing NEW Gmail App Password...');
    console.log('Email user:', EMAIL_USER);
    console.log('App password:', NEW_PASSWORD.substring(0, 4) + '****' + NEW_PASSWORD.substring(NEW_PASSWORD.length - 4));
    console.log('');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: NEW_PASSWORD
      }
    });
    
    console.log('📧 Sending test email...');
    
    const result = await transporter.sendMail({
      from: `ESCA Shop <${EMAIL_USER}>`,
      to: 'cashier.employe01@gmail.com',
      subject: 'Test Email - New Password Configuration',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2>✅ Email Configuration Test</h2>
          <p>This is a test email sent with the NEW Gmail App Password.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Sent from:</strong> ${EMAIL_USER}</p>
          <hr>
          <p style="color: green;">If you receive this email, the new password is working correctly!</p>
        </div>
      `
    });
    
    console.log('');
    console.log('✅ SUCCESS! Email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);
    console.log('');
    console.log('👉 Check the inbox of cashier.employe01@gmail.com');
    console.log('   (Also check spam/junk folder)');
    
  } catch (error: any) {
    console.log('');
    console.error('❌ FAILED! Email sending failed:');
    console.error('Error:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.response) console.error('Server response:', error.response);
    console.log('');
    console.log('💡 Possible issues:');
    console.log('   1. The Gmail App Password might be incorrect or revoked');
    console.log('   2. Gmail account might have security settings blocking the app');
    console.log('   3. 2-Step Verification might be disabled (required for App Passwords)');
  }
}

testNewPassword();
