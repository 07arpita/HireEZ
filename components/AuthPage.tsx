'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Mail, Lock, User, Building, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);

  // Check if Supabase is configured
  if (!supabase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl backdrop-blur-sm bg-white/80 border-0 shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Supabase Configuration Required</h2>
                <p className="text-gray-600">Please set up your Supabase project to continue.</p>
              </div>
              
              <div className="text-left bg-gray-50 p-6 rounded-lg space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Step 1: Create a Supabase Project</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">
                      supabase.com <ExternalLink className="w-3 h-3 ml-1" />
                    </a> and create a new project.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Step 2: Get Your Credentials</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    From your Supabase dashboard, go to Settings → API and copy:
                  </p>
                  <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                    <li>Project URL</li>
                    <li>Anon/Public Key</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Step 3: Update Environment Variables</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Create or update your <code className="bg-gray-200 px-1 rounded">.env.local</code> file:
                  </p>
                  <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Step 4: Run Database Migration</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    In your Supabase dashboard, go to SQL Editor and run the migration file located at:
                  </p>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded">supabase/migrations/20250607063731_pink_lagoon.sql</code>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Make sure to restart your development server after adding the environment variables.
                  </p>
                </div>
              </div>

              <Button 
                onClick={() => window.location.reload()} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                I've configured Supabase - Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const company = formData.get('company') as string;

    const { error } = await signUp(email, password, fullName, company);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created successfully!');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-xl">Hire EZ</span>
          </div>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-gray-900">
              Welcome
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="signup-fullName"
                        name="fullName"
                        placeholder="Enter your full name"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-company">Company</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="signup-company"
                        name="company"
                        placeholder="Enter your company name"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="Create a password"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Demo credentials: admin@example.com / password123</p>
        </div>
      </div>
    </div>
  );
}