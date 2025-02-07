import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuthStore } from '../../store/authStore';
import { generateTotpUri } from '../../utils/crypto';
import Toast from '../ui/Toast';

export default function OTPVerification() {
  const [otp, setOtp] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const { verifyOTP, setupOTP, loading, error, isAuthenticated, otpSecret, user } = useAuthStore();

  useEffect(() => {
    const generateQRCode = async () => {
      if (!user?.otpVerified && !otpSecret) {
        try {
          const secret = await setupOTP();
          if (secret && user?.email) {
            const totpUri = generateTotpUri(user.email, secret);
            const url = await QRCode.toDataURL(totpUri);
            setQrCodeUrl(url);
          }
        } catch (error: any) {
          setToastMessage(error.message || 'Failed to generate QR code');
          setToastType('error');
          setShowToast(true);
        }
      }
    };

    generateQRCode();
  }, [user, otpSecret, setupOTP]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyOTP(otp);
      setToastMessage('2FA verification successful');
      setToastType('success');
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.message || 'Invalid verification code');
      setToastType('error');
      setShowToast(true);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img
            className="mx-auto h-20 w-auto"
            src="https://res.cloudinary.com/fresh-ideas/image/upload/v1731533951/o6no9tkm6wegl6mprrri.png"
            alt="Royal Precast"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set Up Two-Factor Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enhance your account security by setting up 2FA
          </p>
        </div>

        {!user?.otpVerified && qrCodeUrl && (
          <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Step 1: Install Google Authenticator</h3>
              <div className="flex space-x-4">
                <a
                  href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 text-center"
                >
                  Android Download
                </a>
                <a
                  href="https://apps.apple.com/us/app/google-authenticator/id388497605"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 text-center"
                >
                  iOS Download
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Step 2: Scan QR Code</h3>
              <div className="flex justify-center">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
              {otpSecret && (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">Or enter this code manually:</p>
                  <code className="px-4 py-2 bg-gray-100 rounded-md text-sm font-mono select-all">
                    {otpSecret}
                  </code>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Step 3: Verify Setup</h3>
              <p className="text-sm text-gray-500">
                Enter the 6-digit code from Google Authenticator to complete setup
              </p>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="otp" className="sr-only">Verification Code</label>
            <input
              id="otp"
              name="otp"
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="appearance-none rounded-md relative block w-full px-6 py-4 text-lg border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter 6-digit code"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              inputMode="numeric"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="group relative w-full flex justify-center py-4 px-6 text-lg font-semibold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? 'Verifying...' : 'Complete Setup'}
            </button>
          </div>
        </form>

        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        )}
      </div>
    </div>
  );
}