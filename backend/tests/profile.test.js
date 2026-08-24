import assert from 'assert';
import request from 'supertest';
import prisma from '../src/config/db.js';
import app from '../src/index.js';

// Setup Mock In-Memory Database
const db = {
  users: [
    {
      id: 'usr_test_123',
      email: 'mock.user@example.com', // matches Google token sub/email email
      phone: '+15551234',
      name: 'Test User',
      username: 'test_user',
      profileImage: null,
      notifyNewTask: true,
      notifyDueDate: true,
      notifyOverdue: true,
      notifyDailyReminder: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      accounts: [{ provider: 'GOOGLE', providerId: 'mock-google-sub-123' }],
    },
    {
      id: 'usr_other_456',
      email: 'other.user@example.com',
      phone: '+15555678',
      name: 'Other User',
      username: 'other_user',
      profileImage: null,
      notifyNewTask: true,
      notifyDueDate: true,
      notifyOverdue: true,
      notifyDailyReminder: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      accounts: [{ provider: 'PHONE', providerId: '+15555678' }],
    },
  ],
  accounts: [
    {
      id: 'acc_google_123',
      userId: 'usr_test_123',
      provider: 'GOOGLE',
      providerId: 'mock-google-sub-123',
    },
    {
      id: 'acc_phone_456',
      userId: 'usr_other_456',
      provider: 'PHONE',
      providerId: '+15555678',
    },
  ],
  sessions: [],
};

console.log('🧪 Mocking Prisma Client methods for profile tests...');

// Mock Prisma Methods
prisma.user.findFirst = async ({ where }) => {
  if (where.username) {
    const user = db.users.find((u) => u.username === where.username);
    if (user) {
      if (where.NOT?.id && user.id === where.NOT.id) {
        return null; // excluded
      }
      return user;
    }
  }
  return null;
};

prisma.user.findUnique = async ({ where }) => {
  if (where.id) return db.users.find((u) => u.id === where.id) || null;
  if (where.email) return db.users.find((u) => u.email === where.email) || null;
  if (where.phone) return db.users.find((u) => u.phone === where.phone) || null;
  return null;
};

prisma.user.update = async ({ where, data }) => {
  const user = db.users.find((u) => u.id === where.id);
  if (!user) throw new Error('User not found');

  if (data.name !== undefined) user.name = data.name;
  if (data.username !== undefined) user.username = data.username;
  if (data.profileImage !== undefined) user.profileImage = data.profileImage;
  if (data.notifyNewTask !== undefined) user.notifyNewTask = data.notifyNewTask;
  if (data.notifyDueDate !== undefined) user.notifyDueDate = data.notifyDueDate;
  if (data.notifyOverdue !== undefined) user.notifyOverdue = data.notifyOverdue;
  if (data.notifyDailyReminder !== undefined) user.notifyDailyReminder = data.notifyDailyReminder;

  user.updatedAt = new Date();
  return user;
};

prisma.authAccount.findUnique = async ({ where }) => {
  if (where.provider_providerId) {
    const { provider, providerId } = where.provider_providerId;
    const acc = db.accounts.find((a) => a.provider === provider && a.providerId === providerId);
    if (acc) {
      const user = db.users.find((u) => u.id === acc.userId);
      return { ...acc, user };
    }
  }
  return null;
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

prisma.$transaction = async (callback) => {
  return callback(prisma);
};

// Helper: Extract Cookie value
const extractCookieHeader = (res) => {
  const cookies = res.headers['set-cookie'] || [];
  for (const cookie of cookies) {
    if (cookie.startsWith('sid=')) {
      return cookie.split(';')[0];
    }
  }
  return null;
};

const runProfileTests = async () => {
  console.log('\n🚀 Running Profile Management Integration Tests...\n');

  try {
    // ----------------------------------------------------
    // Perform Mock Login to acquire signed cookie
    // ----------------------------------------------------
    console.log('Logging in mock Google user to obtain session cookie...');
    const loginRes = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'valid-mock-google-token' });

    assert.strictEqual(loginRes.status, 200);
    const cookieHeader = extractCookieHeader(loginRes);
    assert.ok(cookieHeader);
    console.log('Cookie acquired:', cookieHeader);

    // ----------------------------------------------------
    // Test 1: Fetch Profile Details
    // ----------------------------------------------------
    console.log('\nTest 1: Fetch authenticated user profile details...');
    const res1 = await request(app)
      .get('/api/profile')
      .set('Cookie', [cookieHeader]);

    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res1.body.success, true);
    assert.strictEqual(res1.body.user.username, 'test_user');
    assert.strictEqual(res1.body.user.email, 'mock.user@example.com');
    console.log('✅ Passed Test 1\n');

    // ----------------------------------------------------
    // Test 2: Update Profile details (name & notification Preferences)
    // ----------------------------------------------------
    console.log('Test 2: Update user profile name and notification preferences...');
    const res2 = await request(app)
      .put('/api/profile')
      .set('Cookie', [cookieHeader])
      .send({
        name: 'Updated Name',
        notifyNewTask: false,
        notifyDueDate: false,
      });

    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.body.success, true);
    assert.strictEqual(res2.body.user.name, 'Updated Name');
    assert.strictEqual(res2.body.user.notifyNewTask, false);
    assert.strictEqual(res2.body.user.notifyDueDate, false);
    assert.strictEqual(res2.body.user.notifyOverdue, true); // remains unchanged
    console.log('✅ Passed Test 2\n');

    // ----------------------------------------------------
    // Test 3: Update Username successfully
    // ----------------------------------------------------
    console.log('Test 3: Update username successfully with valid format...');
    const res3 = await request(app)
      .put('/api/profile')
      .set('Cookie', [cookieHeader])
      .send({ username: 'new_valid_username' });

    assert.strictEqual(res3.status, 200);
    assert.strictEqual(res3.body.success, true);
    assert.strictEqual(res3.body.user.username, 'new_valid_username');
    console.log('✅ Passed Test 3\n');

    // ----------------------------------------------------
    // Test 4: Reject Invalid Username (special characters / spaces)
    // ----------------------------------------------------
    console.log('Test 4: Reject invalid username containing spaces and special symbols...');
    const res4 = await request(app)
      .put('/api/profile')
      .set('Cookie', [cookieHeader])
      .send({ username: 'invalid user!' });

    assert.strictEqual(res4.status, 400);
    assert.strictEqual(res4.body.success, false);
    assert.match(res4.body.error, /Username must be between 3 and 20 characters/);
    console.log('✅ Passed Test 4\n');

    // ----------------------------------------------------
    // Test 5: Reject Duplicate Username
    // ----------------------------------------------------
    console.log('Test 5: Reject duplicate username taken by another user account...');
    const res5 = await request(app)
      .put('/api/profile')
      .set('Cookie', [cookieHeader])
      .send({ username: 'other_user' }); // matches other user in db

    assert.strictEqual(res5.status, 409);
    assert.strictEqual(res5.body.success, false);
    assert.match(res5.body.error, /Username is already taken/);
    console.log('✅ Passed Test 5\n');

    // ----------------------------------------------------
    // Test 6: Mock Upload Profile Picture
    // ----------------------------------------------------
    console.log('Test 6: Mock profile image file upload...');
    const res6 = await request(app)
      .post('/api/profile/avatar')
      .set('Cookie', [cookieHeader])
      .attach('avatar', Buffer.from('mock image payload'), 'avatar.jpg');

    assert.strictEqual(res6.status, 200);
    assert.strictEqual(res6.body.success, true);
    assert.match(res6.body.profileImage, /\/uploads\/avatar-usr_test_123-/);
    assert.match(res6.body.user.profileImage, /\/uploads\/avatar-usr_test_123-/);
    console.log('✅ Passed Test 6\n');

    console.log('🎉 ALL PROFILE TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('❌ Integration Profile Test failed:');
    console.error(error);
    process.exit(1);
  }
};

runProfileTests();
