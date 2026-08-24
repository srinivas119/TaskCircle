import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import assert from 'assert';

const prisma = new PrismaClient();
const baseURL = 'http://localhost:5000/api';

const runLiveTest = async () => {
  console.log('🚀 Running Live End-to-End API Integration Tests against port 5000 using native fetch...\n');
  const testEmail = `jane.doe.${Date.now()}@example.com`;
  const testUsername = `janedoe_${Math.floor(Math.random() * 10000)}`;

  try {
    // 1. Register User
    console.log('Step 1: Registering User...');
    const registerRes = await fetch(`${baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Doe',
        email: testEmail,
        username: testUsername,
        password: 'password123',
      }),
    });
    const registerData = await registerRes.json();
    assert.strictEqual(registerRes.status, 201);
    assert.strictEqual(registerData.success, true);
    console.log('✓ Registered User:', registerData.user.username);

    // 2. Login User
    console.log('\nStep 2: Logging in with initial credentials...');
    const loginRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'password123',
      }),
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginData.success, true);
    console.log('✓ Login Successful for:', loginData.user.email);

    // 3. Forgot Password
    console.log('\nStep 3: Requesting password reset...');
    const forgotRes = await fetch(`${baseURL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
      }),
    });
    const forgotData = await forgotRes.json();
    assert.strictEqual(forgotRes.status, 200);
    assert.strictEqual(forgotData.success, true);
    console.log('✓ Forgot Password requested successfully.');

    // 4. Retrieve reset token from DB
    console.log('\nStep 4: Retrieving reset token from database...');
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    const token = user.resetToken;
    assert.ok(token, 'Reset token should exist in database.');
    console.log('✓ Found Reset Token:', token);

    // 5. Reset Password
    console.log('\nStep 5: Resetting password...');
    const resetRes = await fetch(`${baseURL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        password: 'newpassword456',
      }),
    });
    const resetData = await resetRes.json();
    assert.strictEqual(resetRes.status, 200);
    assert.strictEqual(resetData.success, true);
    console.log('✓ Password reset successful.');

    // 6. Login again with new credentials
    console.log('\nStep 6: Logging in with new credentials...');
    const newLoginRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'newpassword456',
      }),
    });
    const newLoginData = await newLoginRes.json();
    assert.strictEqual(newLoginRes.status, 200);
    assert.strictEqual(newLoginData.success, true);
    console.log('✓ Login with new password successful.');

    console.log('\n🎉 ALL LIVE END-TO-END TESTS PASSED SUCCESSFULLY! 🎉');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Live integration test failed:');
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

runLiveTest();
