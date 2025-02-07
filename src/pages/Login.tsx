import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Toast } from '@/components/ui/Toast';
import { Loader2, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

const LOGO_URL = "https://res.cloudinary.com/fresh-ideas/image/upload/v1731533951/o6no9tkm6wegl6mprrri.png";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { login, loading, error, isAuthenticated } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLocalError(null);
      if (!login) {
        throw new Error('Authentication not initialized');
      }
      await login(email, password);
    } catch (error: any) {
      setLocalError(error.message || 'Failed to login');
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-gray-200 dark:border-gray-700"
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <Moon className="h-6 w-6 text-blue-800 dark:text-blue-400" />
          ) : (
            <Sun className="h-6 w-6 text-blue-800 dark:text-blue-400" />
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <img
              className="mx-auto h-24 w-auto"
              src={LOGO_URL}
              alt="Royal Precast"
              style={{
                filter: isDarkMode ? 'invert(1) brightness(2)' : 'none'
              }}
            />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Sign in to your account
            </p>
          </div>
          
          <Card className="border-2">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {localError && (
                  <Toast variant="destructive">
                    {localError}
                  </Toast>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full h-12 text-lg px-4 bg-white dark:bg-gray-800 border-2 focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-base">
                      Password
                    </Label>
                    <Link 
                      to="/forgot-password"
                      className="text-sm font-medium text-blue-800 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-12 text-lg px-4 bg-white dark:bg-gray-800 border-2 focus:ring-2 focus:ring-primary"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg bg-blue-800 hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="font-medium text-blue-800 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Contact administrator
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}