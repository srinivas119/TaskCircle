import assert from 'assert';
import request from 'supertest';
import prisma from '../src/config/db.js';
import app from '../src/index.js';
import { hashValue } from '../src/utils/crypto.js';

// Setup Mock In-Memory Database
const db = {
  users: [],
  accounts: [],
  sessions: [],
  otps: [],
};

// Reset Mock DB function
const resetMockDb = () => {
  db.users = [];
  db.accounts = [];
  db.sessions = [];
  db.otps = [];
};

console.log('🧪 Mocking Prisma Client methods for tests...');

// Mock Prisma Methods
prisma.user.findUnique = async ({ where }) => {
  if (where.id) return db.users.find((u) => u.id === where.id) || null;
  if (where.email) return db.users.find((u) => u.email === where.email) || null;
  if (where.phone) return db.users.find((u) => u.phone === where.phone) || null;
  if (where.username) return db.users.find((u) => u.username === where.username) || null;
  return null;
};

prisma.user.create = async ({ data }) => {
  const newUser = {
    id: `usr_${Math.random().toString(36).substr(2, 9)}`,
    email: data.email || null,
    phone: data.phone || null,
    name: data.name || null,
    profileImage: data.profileImage || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    accounts: [],
  };
  db.users.push(newUser);

  if (data.accounts?.create) {
    const accData = data.accounts.create;
    const newAcc = {
      id: `acc_${Math.random().toString(36).substr(2, 9)}`,
      userId: newUser.id,
      provider: accData.provider,
      providerId: accData.providerId,
      createdAt: new Date(),
    };
    db.accounts.push(newAcc);
    newUser.accounts.push(newAcc);
  }
  return newUser;
};

prisma.user.update = async ({ where, data }) => {
  const user = db.users.find((u) => u.id === where.id);
  if (!user) throw new Error('User not found');
  if (data.phone) user.phone = data.phone;
  if (data.email) user.email = data.email;
  if (data.name) user.name = data.name;
  if (data.profileImage) user.profileImage = data.profileImage;
  user.updatedAt = new Date();
  return user;
};

prisma.authAccount.findUnique = async ({ where }) => {
  // Handles compound key search (provider_providerId)
  if (where.provider_providerId) {
    const { provider, providerId } = where.provider_providerId;
    const acc = db.accounts.find((a) => a.provider === provider && a.providerId === providerId);
    if (acc) {
      const user = db.users.find((u) => u.id === acc.userId);
      return { ...acc, user };
    }
    return null;
  }
  // Handles unique composite key userId_provider
  if (where.userId_provider) {
    const { userId, provider } = where.userId_provider;
    return db.accounts.find((a) => a.userId === userId && a.provider === provider) || null;
  }
  return null;
};

prisma.authAccount.create = async ({ data }) => {
  const newAcc = {
    id: `acc_${Math.random().toString(36).substr(2, 9)}`,
    userId: data.userId,
    provider: data.provider,
    providerId: data.providerId,
    createdAt: new Date(),
  };
  db.accounts.push(newAcc);
  return newAcc;
};

prisma.session.create = async ({ data }) => {
  const newSession = {
    id: `ses_${Math.random().toString(36).substr(2, 9)}`,
    sid: data.sid,
    userId: data.userId,
    expiresAt: data.expiresAt,
    isValid: true,
    createdAt: new Date(),
  };
  db.sessions.push(newSession);
  return newSession;
};

prisma.session.findUnique = async ({ where }) => {
  const session = db.sessions.find((s) => s.sid === where.sid);
  if (session) {
    const user = db.users.find((u) => u.id === session.userId);
    const accounts = db.accounts.filter((a) => a.userId === user.id);
    return { ...session, user: { ...user, accounts } };
  }
  return null;
};

prisma.session.update = async ({ where, data }) => {
  const session = db.sessions.find((s) => s.id === where.id || s.sid === where.sid);
  if (!session) throw new Error('Session not found');
  if (data.isValid !== undefined) session.isValid = data.isValid;
  return session;
};

prisma.oTPVerification.create = async ({ data }) => {
  const newOtp = {
    id: `otp_${Math.random().toString(36).substr(2, 9)}`,
    phone: data.phone,
    otpHash: data.otpHash,
    expiresAt: data.expiresAt,
    attempts: 0,
    verified: false,
    createdAt: new Date(),
  };
  db.otps.push(newOtp);
  return newOtp;
};

prisma.oTPVerification.findFirst = async ({ where }) => {
  // Filters active, unexpired, unverified OTPs
  let filtered = db.otps.filter((o) => o.phone === where.phone);
  if (where.verified !== undefined) filtered = filtered.filter((o) => o.verified === where.verified);
  if (where.expiresAt?.gte) filtered = filtered.filter((o) => o.expiresAt >= where.expiresAt.gte);
  
  // Sort by createdAt desc
  filtered.sort((a, b) => b.createdAt - a.createdAt);
  return filtered[0] || null;
};

prisma.oTPVerification.update = async ({ where, data }) => {
  const otp = db.otps.find((o) => o.id === where.id);
  if (!otp) throw new Error('OTP record not found');
  if (data.attempts?.increment !== undefined) otp.attempts += data.attempts.increment;
  if (data.attempts !== undefined && typeof data.attempts === 'number') otp.attempts = data.attempts;
  if (data.verified !== undefined) otp.verified = data.verified;
  if (data.expiresAt !== undefined) otp.expiresAt = data.expiresAt;
  return otp;
};

prisma.oTPVerification.updateMany = async ({ where, data }) => {
  const targets = db.otps.filter((o) => o.phone === where.phone);
  targets.forEach((o) => {
    if (data.expiresAt !== undefined) o.expiresAt = data.expiresAt;
  });
  return { count: targets.length };
};

prisma.$transaction = async (callback) => {
  return callback(prisma);
};

// Helper: Extract Cookie value
const extractCookie = (res, cookieName) => {
  const cookies = res.headers['set-cookie'] || [];
  for (const cookie of cookies) {
    if (cookie.startsWith(`${cookieName}=`)) {
      const parts = cookie.split(';')[0].split('=');
      return decodeURIComponent(parts[1]);
    }
  }
  return null;
};

// Test Suite running sequentially
const runTests = async () => {
  console.log('\n🚀 Running Authentication Integration Tests...\n');

  try {
    // ----------------------------------------------------
    // Test 1: Request Phone OTP
    // ----------------------------------------------------
    console.log('Test 1: Request OTP for a phone number...');
    const res1 = await request(app)
      .post('/api/auth/phone/request-otp')
      .send({ phone: '+15550199' });

    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res1.body.success, true);
    assert.strictEqual(res1.body.message, 'OTP sent successfully.');
    assert.ok(db.otps.length > 0);
    const generatedOtp = res1.body._devOtp; // retrieved in test mode
    assert.ok(generatedOtp);
    console.log('✅ Passed Test 1\n');

    // ----------------------------------------------------
    // Test 2: OTP request rate cooldown (under 60s cooldown limit)
    // ----------------------------------------------------
    console.log('Test 2: Re-request OTP within 60 seconds (should reject)...');
    const res2 = await request(app)
      .post('/api/auth/phone/request-otp')
      .send({ phone: '+15550199' });

    assert.strictEqual(res2.status, 429);
    assert.strictEqual(res2.body.success, false);
    assert.match(res2.body.error, /Please wait 60 seconds/);
    console.log('✅ Passed Test 2\n');

    // ----------------------------------------------------
    // Test 3: OTP expiration check
    // ----------------------------------------------------
    console.log('Test 3: OTP expiration verification...');
    // Manually push expired OTP to mock DB
    db.otps.push({
      id: 'otp_expired',
      phone: '+15550200',
      otpHash: await hashValue('111111'),
      expiresAt: new Date(Date.now() - 1000), // expired 1s ago
      attempts: 0,
      verified: false,
      createdAt: new Date(),
    });

    const res3 = await request(app)
      .post('/api/auth/phone/verify-otp')
      .send({ phone: '+15550200', otp: '111111' });

    assert.strictEqual(res3.status, 400);
    assert.strictEqual(res3.body.success, false);
    assert.match(res3.body.error, /OTP has expired or is invalid/);
    console.log('✅ Passed Test 3\n');

    // ----------------------------------------------------
    // Test 4: Incorrect OTP rejection
    // ----------------------------------------------------
    console.log('Test 4: Verify incorrect OTP code...');
    const res4 = await request(app)
      .post('/api/auth/phone/verify-otp')
      .send({ phone: '+15550199', otp: '000000' }); // wrong code

    assert.strictEqual(res4.status, 400);
    assert.strictEqual(res4.body.success, false);
    assert.strictEqual(res4.body.error, 'Incorrect OTP code.');
    console.log('✅ Passed Test 4\n');

    // ----------------------------------------------------
    // Test 5: Exceeding verification attempt limits (locks out)
    // ----------------------------------------------------
    console.log('Test 5: Exceeding 5 verification attempts locks OTP...');
    // Attempt remaining 4 times to exceed 5-attempt limit
    for (let i = 0; i < 4; i++) {
      await request(app)
        .post('/api/auth/phone/verify-otp')
        .send({ phone: '+15550199', otp: '000000' });
    }

    // The 6th attempt should block immediately with "Too many incorrect attempts"
    const res5 = await request(app)
      .post('/api/auth/phone/verify-otp')
      .send({ phone: '+15550199', otp: '000000' });

    assert.strictEqual(res5.status, 429);
    assert.match(res5.body.error, /Too many incorrect attempts/);
    console.log('✅ Passed Test 5\n');

    // ----------------------------------------------------
    // Test 6: Successful Phone Login/Sign-up
    // ----------------------------------------------------
    console.log('Test 6: Successful phone OTP login...');
    // Create new fresh request
    const phoneNum = '+15557777';
    const requestRes = await request(app)
      .post('/api/auth/phone/request-otp')
      .send({ phone: phoneNum });
    const correctCode = requestRes.body._devOtp;

    const res6 = await request(app)
      .post('/api/auth/phone/verify-otp')
      .send({ phone: phoneNum, otp: correctCode });

    assert.strictEqual(res6.status, 200);
    assert.strictEqual(res6.body.success, true);
    assert.strictEqual(res6.body.user.phone, phoneNum);
    
    // Cookie checks
    const sessionCookie = extractCookie(res6, 'sid');
    assert.ok(sessionCookie); // Cookie set in response header
    console.log('✅ Passed Test 6\n');

    // ----------------------------------------------------
    // Test 7: Google Login Flow (Verification Mock)
    // ----------------------------------------------------
    console.log('Test 7: Mock Google Login...');
    const res7 = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'valid-mock-google-token' });

    assert.strictEqual(res7.status, 200);
    assert.strictEqual(res7.body.success, true);
    assert.strictEqual(res7.body.user.email, 'mock.user@example.com');
    const googleCookie = extractCookie(res7, 'sid');
    assert.ok(googleCookie);
    console.log('✅ Passed Test 7\n');

    // ----------------------------------------------------
    // Test 8: Login Existing Google user
    // ----------------------------------------------------
    console.log('Test 8: Logging in existing Google account user...');
    const res8 = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'valid-mock-google-token' });

    assert.strictEqual(res8.status, 200);
    assert.strictEqual(res8.body.success, true);
    assert.strictEqual(db.users.length, 2); // Still only 2 users (1 phone, 1 google)
    console.log('✅ Passed Test 8\n');

    // ----------------------------------------------------
    // Test 9: Protected Route Access Rejection
    // ----------------------------------------------------
    console.log('Test 9: Accessing protected endpoint without session cookie...');
    const res9 = await request(app).get('/api/auth/me');
    assert.strictEqual(res9.status, 401);
    assert.strictEqual(res9.body.success, false);
    assert.strictEqual(res9.body.error, 'Authentication required. No session found.');
    console.log('✅ Passed Test 9\n');

    // ----------------------------------------------------
    // Test 10: Session Restoration (Valid Cookie)
    // ----------------------------------------------------
    console.log('Test 10: Session restoration using cookie...');
    const cookieHeader = `sid=${googleCookie}`; // Simulate browser cookie header
    const res10 = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [cookieHeader]);

    assert.strictEqual(res10.status, 200);
    assert.strictEqual(res10.body.success, true);
    assert.strictEqual(res10.body.user.email, 'mock.user@example.com');
    console.log('✅ Passed Test 10\n');

    // ----------------------------------------------------
    // Test 11: Account Linking (Link Google user to Phone)
    // ----------------------------------------------------
    console.log('Test 11: Link Phone to existing Google user...');
    const linkPhoneNum = '+15558888';
    const linkOtpRequest = await request(app)
      .post('/api/auth/phone/request-otp')
      .send({ phone: linkPhoneNum });
    
    const linkPhoneCode = linkOtpRequest.body._devOtp;

    // Call link-phone under the Google user session
    const res11 = await request(app)
      .post('/api/auth/link-phone')
      .set('Cookie', [cookieHeader])
      .send({ phone: linkPhoneNum, otp: linkPhoneCode });

    assert.strictEqual(res11.status, 200);
    assert.strictEqual(res11.body.success, true);
    assert.strictEqual(res11.body.user.phone, linkPhoneNum);
    assert.strictEqual(res11.body.user.email, 'mock.user@example.com'); // Both now set
    console.log('✅ Passed Test 11\n');

    // ----------------------------------------------------
    // Test 12: Duplicate Account Linking Prevention
    // ----------------------------------------------------
    console.log('Test 12: Try to link a phone already linked to another account...');
    // Create another user
    const newUserRes = await request(app)
      .post('/api/auth/google')
      .send({ credential: JSON.stringify({ sub: 'google-sub-user-2', email: 'user2@example.com' }) });
    const user2Cookie = extractCookie(newUserRes, 'sid');

    // Attempt to link "+15558888" (which is linked to Google User 1) to Google User 2
    const duplicateLinkRes = await request(app)
      .post('/api/auth/link-phone')
      .set('Cookie', [`sid=${user2Cookie}`])
      .send({ phone: linkPhoneNum, otp: '123456' }); // doesn't matter code, checks database uniqueness first

    assert.strictEqual(duplicateLinkRes.status, 409);
    assert.strictEqual(duplicateLinkRes.body.code, 'ACCOUNT_ALREADY_LINKED');
    console.log('✅ Passed Test 12\n');

    // ----------------------------------------------------
    // Test 13: Logout invalidation
    // ----------------------------------------------------
    console.log('Test 13: Invalidate session on logout...');
    const res13 = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [cookieHeader]);

    assert.strictEqual(res13.status, 200);
    assert.strictEqual(res13.body.success, true);

    // Verify session cookie is rejected now
    const checkAfterLogout = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [cookieHeader]);
    assert.strictEqual(checkAfterLogout.status, 401);
    console.log('✅ Passed Test 13\n');

    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('❌ Integration Test failed:');
    console.error(error);
    process.exit(1);
  }
};

runTests();
