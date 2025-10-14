const { Pool } = require('pg');
require('dotenv').config();

async function testPasswordReset() {
  console.log('🔍 Testing Password Reset Functionality\n');
  
  // 1. Check environment variables
  console.log('1️⃣ Checking Environment Variables:');
  console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ NOT SET');
  console.log('   EMAIL_SERVICE_ENABLED:', process.env.EMAIL_SERVICE_ENABLED);
  console.log('   EMAIL_USER:', process.env.EMAIL_USER);
  console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set (hidden)' : '❌ NOT SET');
  console.log('   FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('');
  
  // 2. Test database connection
  console.log('2️⃣ Testing Database Connection:');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : undefined
  });
  
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('   ✅ Database connected successfully');
    console.log('   Server time:', result.rows[0].now);
  } catch (error) {
    console.log('   ❌ Database connection FAILED:');
    console.log('   Error:', error.message);
    console.log('\n⚠️  Cannot proceed without database connection');
    process.exit(1);
  }
  console.log('');
  
  // 3. Check if users table exists and has reset token columns
  console.log('3️⃣ Checking Users Table Schema:');
  try {
    const schemaQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('reset_token', 'reset_token_expiry')
      ORDER BY column_name
    `;
    const result = await pool.query(schemaQuery);
    
    if (result.rows.length === 0) {
      console.log('   ❌ Missing reset token columns!');
      console.log('   The users table does not have reset_token and reset_token_expiry columns');
      console.log('\n   💡 Solution: Run database migrations to add these columns');
    } else {
      console.log('   ✅ Reset token columns exist:');
      result.rows.forEach(row => {
        console.log(`      - ${row.column_name} (${row.data_type})`);
      });
    }
  } catch (error) {
    console.log('   ❌ Failed to check schema:', error.message);
  }
  console.log('');
  
  // 4. Test finding a user
  console.log('4️⃣ Testing User Lookup:');
  try {
    const userQuery = 'SELECT id, email, full_name FROM users LIMIT 1';
    const result = await pool.query(userQuery);
    
    if (result.rows.length === 0) {
      console.log('   ⚠️  No users found in database');
    } else {
      const user = result.rows[0];
      console.log('   ✅ Found test user:');
      console.log('      ID:', user.id);
      console.log('      Email:', user.email);
      console.log('      Name:', user.full_name);
    }
  } catch (error) {
    console.log('   ❌ Failed to query users:', error.message);
  }
  console.log('');
  
  // 5. Test token generation and storage
  console.log('5️⃣ Testing Reset Token Storage:');
  try {
    const crypto = require('crypto');
    const testToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    
    // Get first user for testing
    const userResult = await pool.query('SELECT id, email FROM users LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.log('   ⚠️  No users available for testing');
    } else {
      const testUser = userResult.rows[0];
      
      console.log('   Testing with user:', testUser.email);
      
      const updateQuery = `
        UPDATE users 
        SET reset_token = $1, reset_token_expiry = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING id
      `;
      
      const updateResult = await pool.query(updateQuery, [testToken, expiry, testUser.id]);
      
      if (updateResult.rowCount > 0) {
        console.log('   ✅ Successfully stored reset token');
        
        // Verify it was stored
        const verifyQuery = 'SELECT reset_token, reset_token_expiry FROM users WHERE id = $1';
        const verifyResult = await pool.query(verifyQuery, [testUser.id]);
        
        if (verifyResult.rows[0].reset_token === testToken) {
          console.log('   ✅ Token verified in database');
          
          // Clean up test token
          await pool.query('UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE id = $1', [testUser.id]);
          console.log('   ✅ Test token cleaned up');
        }
      } else {
        console.log('   ❌ Failed to store reset token (no rows updated)');
      }
    }
  } catch (error) {
    console.log('   ❌ Token storage test FAILED:');
    console.log('   Error:', error.message);
    
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('\n   💡 The reset_token columns are missing from your users table!');
      console.log('   This is why password reset is not working.');
    }
  }
  console.log('');
  
  // 6. Check email configuration
  console.log('6️⃣ Email Service Status:');
  if (process.env.EMAIL_SERVICE_ENABLED === 'true') {
    console.log('   ✅ Email service is ENABLED');
    if (process.env.EMAIL_PASSWORD) {
      console.log('   ✅ Email password is configured');
      console.log('   Email user:', process.env.EMAIL_USER);
    } else {
      console.log('   ❌ Email password is NOT configured');
    }
  } else {
    console.log('   ⚠️  Email service is DISABLED');
    console.log('   Set EMAIL_SERVICE_ENABLED=true to enable email sending');
  }
  console.log('');
  
  await pool.end();
  
  console.log('═══════════════════════════════════════════════');
  console.log('✅ Diagnostic Complete');
  console.log('═══════════════════════════════════════════════');
}

testPasswordReset().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
