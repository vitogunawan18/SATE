export interface UserSessionPayload {
  userId: string;
  username: string;
  name: string;
  role: 'hr' | 'admin';
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fnb_talent_expert_system_secure_secret_key_987654321';

// Convert ArrayBuffer to base64url
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Helper to compute SHA-256 signature utilizing Web Crypto API (supported in Edge & Node)
async function computeSignature(header: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const input = encoder.encode(`${header}.${data}.${JWT_SECRET}`);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', input);
  return bufferToBase64url(hashBuffer);
}

/**
 * Sign a session payload and return a JWT-like string
 */
export async function signToken(payload: UserSessionPayload, expiresInDays: number = 7): Promise<string> {
  const exp = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const tokenPayload = { ...payload, exp };

  // UTF-8 safe btoa encoding
  const headerBase64 = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
  const dataBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(tokenPayload))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const signature = await computeSignature(headerBase64, dataBase64);
  return `${headerBase64}.${dataBase64}.${signature}`;
}

/**
 * Verify a JWT-like session token and return the payload if valid
 */
export async function verifyToken(token: string): Promise<UserSessionPayload | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, data, signature] = parts;
  try {
    const expectedSignature = await computeSignature(header, data);
    
    // Strict comparison check
    if (signature !== expectedSignature) {
      return null;
    }

    // Base64url safe decode
    const payloadStr = decodeURIComponent(
      escape(atob(data.replace(/-/g, '+').replace(/_/g, '/')))
    );
    const payload = JSON.parse(payloadStr) as UserSessionPayload;
    
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
