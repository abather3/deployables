import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { config } from '../config/config';

const router = Router();

// Diagnostic endpoint - ONLY enable in non-production or with proper auth
router.get('/email-config', async (req: Request, res: Response): Promise<void> => {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      checks: {}
    };

    // 1. Environment Variables Check
    diagnostics.checks.environmentVariables = {
      EMAIL_SERVICE_ENABLED: config.EMAIL_SERVICE_ENABLED,
      EMAIL_USER: config.EMAIL_USER,
      EMAIL_FROM: config.EMAIL_FROM,
      EMAIL_PASSWORD: config.EMAIL_PASSWORD ? '✅ SET (hidden)' : '❌ NOT SET',
      FRONTEND_URL: config.FRONTEND_URL,
      DATABASE_URL: process.env.DATABASE_URL ? '✅ SET (hidden)' : '❌ NOT SET'
    };

    // 2. Database Connection Check
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : undefined
      });

      const dbResult = await pool.query('SELECT NOW() as server_time');
      diagnostics.checks.database = {
        status: '✅ Connected',
        serverTime: dbResult.rows[0].server_time,
        connectionType: process.env.DATABASE_URL?.includes('supabase') ? 'Supabase' : 
                       process.env.DATABASE_URL?.includes('render') ? 'Render' : 'Unknown'
      };

      // 3. Check Reset Token Columns
      const schemaQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('reset_token', 'reset_token_expiry')
        ORDER BY column_name
      `;
      const schemaResult = await pool.query(schemaQuery);

      if (schemaResult.rows.length === 0) {
        diagnostics.checks.resetTokenColumns = {
          status: '❌ MISSING',
          message: 'reset_token and reset_token_expiry columns not found in users table'
        };
      } else {
        diagnostics.checks.resetTokenColumns = {
          status: '✅ EXISTS',
          columns: schemaResult.rows.map(r => `${r.column_name} (${r.data_type})`)
        };
      }

      // 4. Check if there are users
      const userCountResult = await pool.query('SELECT COUNT(*) as count FROM users');
      diagnostics.checks.users = {
        status: '✅ OK',
        totalUsers: parseInt(userCountResult.rows[0].count, 10)
      };

      await pool.end();
    } catch (dbError: any) {
      diagnostics.checks.database = {
        status: '❌ FAILED',
        error: dbError.message
      };
    }

    // 5. Email Service Status
    if (config.EMAIL_SERVICE_ENABLED) {
      diagnostics.checks.emailService = {
        status: '✅ ENABLED',
        user: config.EMAIL_USER,
        from: config.EMAIL_FROM,
        passwordConfigured: !!config.EMAIL_PASSWORD
      };
    } else {
      diagnostics.checks.emailService = {
        status: '❌ DISABLED',
        message: 'Set EMAIL_SERVICE_ENABLED=true to enable email sending'
      };
    }

    // 6. Summary
    const allChecks = Object.values(diagnostics.checks);
    const failedChecks = JSON.stringify(diagnostics.checks).match(/❌/g)?.length || 0;
    
    diagnostics.summary = {
      totalChecks: allChecks.length,
      failedChecks: failedChecks,
      status: failedChecks === 0 ? '✅ ALL CHECKS PASSED' : `⚠️  ${failedChecks} CHECK(S) FAILED`,
      recommendation: failedChecks === 0 ? 
        'Email service should work. If not receiving emails, check Gmail spam folder or App Password validity.' :
        'Fix the failed checks above to enable password reset emails.'
    };

    res.json(diagnostics);
  } catch (error: any) {
    console.error('Diagnostic error:', error);
    res.status(500).json({ 
      error: 'Diagnostic failed', 
      message: error.message 
    });
  }
});

// Test endpoint to verify routes are working
router.get('/ping', (req: Request, res: Response): void => {
  res.json({ 
    status: 'ok', 
    message: 'Diagnostic routes are working',
    timestamp: new Date().toISOString()
  });
});

export default router;
