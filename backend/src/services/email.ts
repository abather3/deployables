import nodemailer from 'nodemailer';
import { config } from '../config/config';

export class EmailService {
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName: string
  ): Promise<boolean> {
    try {
      // In a real implementation, you would use a service like SendGrid, AWS SES, or Nodemailer
      // For now, we'll simulate the email sending
      
      const resetLink = `${config.FRONTEND_URL}/reset-password/${resetToken}`;
      
      console.log(`
==================================================
PASSWORD RESET EMAIL (Development Mode)
==================================================
To: ${email}
Subject: Password Reset Request - EscaShop Optical

Dear ${userName},

You have requested to reset your password for your EscaShop Optical account.

Please click the link below to reset your password:
${resetLink}

This link will expire in 1 hour for security reasons.

If you did not request this password reset, please ignore this email or contact your administrator.

Best regards,
EscaShop Optical Team
==================================================
      `);

      // Enhanced debugging information
      console.log('\n🔧 EMAIL SERVICE DEBUG INFO:');
      console.log('EMAIL_SERVICE_ENABLED:', config.EMAIL_SERVICE_ENABLED);
      console.log('EMAIL_USER:', config.EMAIL_USER);
      console.log('EMAIL_FROM:', config.EMAIL_FROM);
      console.log('EMAIL_PASSWORD:', config.EMAIL_PASSWORD ? '***CONFIGURED***' : 'NOT SET');
      console.log('FRONTEND_URL:', config.FRONTEND_URL);
      console.log('NODE_ENV:', config.NODE_ENV);
      
      if (config.EMAIL_SERVICE_ENABLED) {
        console.log('\n📧 Attempting to send actual email...');
        const result = await this.sendActualEmail(email, resetToken, userName);
        if (result) {
          console.log('✅ Password reset email sent successfully to:', email);
        } else {
          console.log('❌ Failed to send password reset email to:', email);
        }
        return result;
      } else {
        console.log('\n⚠️  Email service is DISABLED - emails will NOT be sent!');
        console.log('   To enable email sending, set EMAIL_SERVICE_ENABLED=true in your environment');
        console.log('   Also ensure EMAIL_PASSWORD is set with Gmail App Password');
        console.error('❌ Cannot send password reset email - EMAIL_SERVICE_ENABLED is not true');
        // DO NOT return true when disabled - this was misleading!
        throw new Error('Email service is disabled. Set EMAIL_SERVICE_ENABLED=true to send emails.');
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  private static async sendActualEmail(
    email: string,
    resetToken: string,
    userName: string
  ): Promise<boolean> {
    try {
      // Create transporter with Gmail configuration
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.EMAIL_USER,
          pass: config.EMAIL_PASSWORD
        }
      });

      const resetLink = `${config.FRONTEND_URL}/reset-password/${resetToken}`;
      
      const mailOptions = {
        from: `"ESCA Shop" <${config.EMAIL_FROM}>`,
        to: email,
        subject: 'Password Reset Request - EscaShop Optical',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2>Password Reset Request</h2>
            <p>Dear ${userName},</p>
            <p>You have requested to reset your password for your EscaShop Optical account.</p>
            <p>Please click the button below to reset your password:</p>
            <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you did not request this password reset, please ignore this email or contact your administrator.</p>
            <br>
            <p>Best regards,<br>EscaShop Optical Team</p>
          </div>
        `
      };

      console.log('Sending password reset email to:', email);
      console.log('Using SMTP config:', {
        service: 'gmail',
        user: config.EMAIL_USER,
        from: config.EMAIL_FROM
      });
      
      // Add timeout to prevent hanging - increased to 30 seconds
      const timeoutMs = 30000; // 30 seconds
      const sendEmailPromise = transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout after 30 seconds - check Gmail App Password and SMTP access')), timeoutMs)
      );
      
      const result = await Promise.race([sendEmailPromise, timeoutPromise]);
      console.log('✅ Password reset email sent successfully to:', email);
      console.log('Email result:', result);
      return true;
    } catch (error: any) {
      console.error('❌ Error sending actual email:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response,
        responseCode: error.responseCode,
        command: error.command,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });
      
      // Provide helpful error messages
      if (error.message?.includes('timeout')) {
        console.error('\n⚠️  SMTP Connection Timeout - Possible causes:');
        console.error('   1. Invalid Gmail App Password (check EMAIL_PASSWORD)');
        console.error('   2. Gmail blocking connection (verify 2-Step Verification is enabled)');
        console.error('   3. EMAIL_USER not matching EMAIL_FROM');
        console.error('   4. Network/firewall blocking SMTP port 587/465');
      } else if (error.code === 'EAUTH' || error.responseCode === 535) {
        console.error('\n⚠️  Authentication Failed - Gmail App Password is incorrect');
        console.error('   Generate new App Password at: https://myaccount.google.com/apppasswords');
      }
      // Return false to properly report email failure
      return false;
    }
  }

  static async sendWelcomeEmail(
    email: string,
    userName: string,
    temporaryPassword: string
  ): Promise<boolean> {
    try {
      console.log(`
==================================================
WELCOME EMAIL (Development Mode)
==================================================
To: ${email}
Subject: Welcome to EscaShop Optical - Account Created

Dear ${userName},

Welcome to EscaShop Optical! Your account has been created successfully.

Your temporary login credentials:
Email: ${email}
Temporary Password: ${temporaryPassword}

Please log in and change your password immediately for security reasons.

Login URL: ${config.FRONTEND_URL}/login

Best regards,
EscaShop Optical Team
==================================================
      `);

      // If email configuration is available, send actual email
      if (config.EMAIL_SERVICE_ENABLED) {
        return await this.sendActualWelcomeEmail(email, userName, temporaryPassword);
      }

      console.warn('⚠️  Email service is disabled - welcome email not sent');
      // For welcome emails, we don't throw error to avoid blocking user creation
      // But we return false to indicate email wasn't sent
      return false;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  private static async sendActualWelcomeEmail(
    email: string,
    userName: string,
    temporaryPassword: string
  ): Promise<boolean> {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.EMAIL_USER,
          pass: config.EMAIL_PASSWORD
        }
      });

      const mailOptions = {
        from: `"ESCA Shop" <${config.EMAIL_FROM}>`,
        to: email,
        subject: 'Welcome to EscaShop Optical - Account Created',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2>Welcome to EscaShop Optical!</h2>
            <p>Dear ${userName},</p>
            <p>Welcome to EscaShop Optical! Your account has been created successfully.</p>
            <h3>Your temporary login credentials:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
            <p><strong>Login URL:</strong> <a href="${config.FRONTEND_URL}/login">${config.FRONTEND_URL}/login</a></p>
            <p><em>Please log in and change your password immediately for security reasons.</em></p>
            <br>
            <p>Best regards,<br>EscaShop Optical Team</p>
          </div>
        `
      };

      console.log('Sending welcome email to:', email);
      
      // Add timeout to prevent hanging
      const timeoutMs = 30000; // 30 seconds
      const sendEmailPromise = transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout')), timeoutMs)
      );
      
      await Promise.race([sendEmailPromise, timeoutPromise]);
      console.log('Welcome email sent successfully to:', email);
      return true;
    } catch (error) {
      console.error('Error sending actual welcome email:', error);
      console.warn('⚠️  Welcome email failed but user creation will proceed');
      return true; // Don't block user creation if email fails
    }
  }

  static async sendNotificationEmail(
    email: string,
    subject: string,
    message: string
  ): Promise<boolean> {
    try {
      console.log(`
==================================================
NOTIFICATION EMAIL (Development Mode)
==================================================
To: ${email}
Subject: ${subject}

${message}

Best regards,
EscaShop Optical Team
==================================================
      `);

      return true;
    } catch (error) {
      console.error('Error sending notification email:', error);
      return false;
    }
  }
}
