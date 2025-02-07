import { authenticator } from 'otplib';
import { totp } from 'otplib';

// Configure authenticator with secure defaults
authenticator.options = {
  window: 1, // Allow 1 step before/after for time drift
  step: 30, // 30 second window
  digits: 6, // 6 digit codes
  algorithm: 'sha1' // Standard TOTP algorithm
};

// Override the default secret generation to use Web Crypto API
authenticator.generateSecret = () => {
  // Generate 20 random bytes (160 bits) for the secret
  const randomBytes = new Uint8Array(20);
  window.crypto.getRandomValues(randomBytes);
  
  // Convert to base32 string using built-in encoding
  return totp.encoder.encode(Array.from(randomBytes));
};

// Helper function to generate TOTP URI
export function generateTotpUri(email: string, secret: string): string {
  return authenticator.keyuri(
    encodeURIComponent(email),
    'Royal Precast',
    secret
  );
}

// Export configured authenticator
export { authenticator };