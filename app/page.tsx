'use client';

import { useAuth } from '@/components/AuthProvider';
import { AuthPage } from '@/components/AuthPage';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Brain } from 'lucide-react';
import { RecruiterVoiceAgent } from '@/components/recruiter/RecruiterVoiceAgent';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted (prevents SSR mismatch)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show welcome page with voice agent
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
        <div className="flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome back!</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
        <RecruiterVoiceAgent />
      </div>
    );
  }

  // Show auth page for non-authenticated users
  return <AuthPage />;
}