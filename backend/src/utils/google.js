import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google ID Token.
 * If in development mode and credentials are not fully configured, supports secure mocking.
 * @param {string} token Google ID Token / credential
 * @returns {Promise<{ sub: string, email: string, name: string, picture: string }>} User info from Google token
 */
export const verifyGoogleToken = async (token) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  // Development Bypass / Mocking if client ID is not configured
  if (!clientId || clientId === 'mock-google-client-id') {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.log('⚠️ [Auth] Using mock Google OAuth validation (development/test mode)');
      
      // Parse mock token if it's formatted as a JSON string, otherwise return a default mock user
      try {
        if (token.startsWith('{')) {
          const parsed = JSON.parse(token);
          return {
            sub: parsed.sub || 'mock-google-sub-123',
            email: parsed.email || 'mock.user@example.com',
            name: parsed.name || 'Mock User',
            picture: parsed.picture || 'https://via.placeholder.com/150',
          };
        }
      } catch (e) {
        // Fall through to default mock
      }

      if (token === 'valid-mock-google-token') {
        return {
          sub: 'mock-google-sub-123',
          email: 'mock.user@example.com',
          name: 'Mock User',
          picture: 'https://via.placeholder.com/150',
        };
      }
      
      throw new Error('Invalid mock Google token');
    }
    throw new Error('Google Client ID is not configured.');
  }

  // Real verification
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error('Token payload is empty');

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (error) {
    console.error('Google token verification failed:', error.message);
    throw new Error('Failed to verify Google token: ' + error.message);
  }
};
