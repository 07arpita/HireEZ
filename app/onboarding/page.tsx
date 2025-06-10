'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building, 
  Users, 
  Target, 
  CheckCircle, 
  ArrowRight,
  Briefcase,
  MapPin,
  Globe,
  User,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const COMPANY_SIZES = [
  '1-10 employees',
  '11-50 employees', 
  '51-200 employees',
  '201-1000 employees',
  '1000+ employees'
];

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Media & Entertainment',
  'Real Estate',
  'Other'
];

const HIRING_GOALS = [
  'Scale engineering team',
  'Find specialized talent',
  'Improve hiring efficiency',
  'Reduce time-to-hire',
  'Enhance candidate experience',
  'Build diverse teams'
];

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Form data
  const [formData, setFormData] = useState({
    companyName: '',
    companySize: '',
    industry: '',
    location: '',
    website: '',
    description: '',
    hiringGoals: [] as string[],
    rolesHiring: '',
    monthlyHires: '',
    currentChallenges: ''
  });

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleHiringGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      hiringGoals: prev.hiringGoals.includes(goal)
        ? prev.hiringGoals.filter(g => g !== goal)
        : [...prev.hiringGoals, goal]
    }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const testDatabaseConnection = async () => {
    if (!supabase) {
      setDebugInfo('Supabase client not initialized');
      return false;
    }

    try {
      // Test basic connection
      const { data, error } = await supabase.from('users').select('id').limit(1);
      if (error) {
        setDebugInfo(`Database connection test failed: ${error.message}`);
        return false;
      }
      setDebugInfo('Database connection successful');
      return true;
    } catch (error: any) {
      setDebugInfo(`Database connection error: ${error.message}`);
      return false;
    }
  };

  const completeOnboarding = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    if (!supabase) {
      toast.error('Database connection not available. Please check your Supabase configuration.');
      return;
    }

    setLoading(true);
    setDebugInfo('Starting onboarding process...');

    try {
      // Test database connection first
      const connectionOk = await testDatabaseConnection();
      if (!connectionOk) {
        throw new Error('Database connection failed');
      }

      console.log('Starting onboarding completion for user:', user.id);
      setDebugInfo('Attempting to update user profile...');
      
      // Try to insert/update user profile
      const userProfileData = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || formData.companyName || 'User',
        company: formData.companyName || 'Unknown Company',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('User profile data:', userProfileData);

      // Use upsert to handle both insert and update cases
      const { data, error } = await supabase
        .from('users')
        .upsert(userProfileData, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        setDebugInfo(`Database error: ${error.message} (Code: ${error.code})`);
        throw error;
      }

      console.log('User profile updated successfully:', data);
      setDebugInfo('Profile updated successfully!');
      
      // Update user metadata to mark onboarding as completed
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          onboarding_completed: true,
          company: formData.companyName,
          industry: formData.industry,
          company_size: formData.companySize
        }
      });

      if (metadataError) {
        console.warn('Failed to update user metadata:', metadataError);
        // Don't fail the whole process for this
      }
      
      toast.success('Welcome to Hire EZ! Your profile has been set up.');
      
      // Small delay to show success message
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch (error: any) {
      console.error('Onboarding error:', error);
      setDebugInfo(`Error: ${error.message}`);
      
      // Provide more specific error messages
      if (error.code === 'PGRST116') {
        toast.error('Database table not found. Please ensure the database migration has been run.');
      } else if (error.code === '42P01') {
        toast.error('Database schema not properly set up. Please run the migration files in your Supabase dashboard.');
      } else if (error.code === '23505') {
        toast.error('User profile already exists. Trying to update instead...');
        // Try update instead of insert
        try {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              full_name: user.user_metadata?.full_name || formData.companyName || 'User',
              company: formData.companyName || 'Unknown Company',
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
          
          if (!updateError) {
            toast.success('Profile updated successfully!');
            router.push('/dashboard');
            return;
          }
        } catch (updateError) {
          console.error('Update also failed:', updateError);
        }
      } else if (error.message?.includes('JWT')) {
        toast.error('Authentication token invalid. Please try signing out and back in.');
      } else if (error.message?.includes('network')) {
        toast.error('Network error. Please check your internet connection.');
      } else {
        toast.error(`Failed to complete onboarding: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.companyName && formData.companySize && formData.industry;
      case 2:
        return formData.hiringGoals.length > 0 && formData.rolesHiring;
      case 3:
        return true; // Optional step
      default:
        return false;
    }
  };

  // Show loading state while checking authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Hire EZ</h1>
          <p className="text-gray-600 mb-6">
            Let's set up your recruitment workspace
          </p>
          <div className="flex items-center justify-center space-x-4 mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${step <= currentStep 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / 3) * 100} className="w-full max-w-md mx-auto" />
        </div>

        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
          <CardContent className="p-8">
            {/* Step 1: Company Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Building className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                  <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
                  <p className="text-gray-600">Tell us about your organization</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="Enter your company name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="companySize">Company Size *</Label>
                    <select
                      id="companySize"
                      value={formData.companySize}
                      onChange={(e) => handleInputChange('companySize', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select company size</option>
                      {COMPANY_SIZES.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="industry">Industry *</Label>
                    <select
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="City, Country"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://company.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">Company Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Brief description of your company and what you do..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Hiring Goals */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Target className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                  <h2 className="text-2xl font-bold text-gray-900">Hiring Goals</h2>
                  <p className="text-gray-600">What are your recruitment objectives?</p>
                </div>

                <div>
                  <Label className="text-base font-medium">Primary Hiring Goals *</Label>
                  <p className="text-sm text-gray-600 mb-3">Select all that apply</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {HIRING_GOALS.map(goal => (
                      <div
                        key={goal}
                        onClick={() => toggleHiringGoal(goal)}
                        className={`
                          p-3 border rounded-lg cursor-pointer transition-all
                          ${formData.hiringGoals.includes(goal)
                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`
                            w-4 h-4 rounded border-2 flex items-center justify-center
                            ${formData.hiringGoals.includes(goal)
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                            }
                          `}>
                            {formData.hiringGoals.includes(goal) && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="text-sm font-medium">{goal}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rolesHiring">Roles You're Hiring For *</Label>
                    <Textarea
                      id="rolesHiring"
                      value={formData.rolesHiring}
                      onChange={(e) => handleInputChange('rolesHiring', e.target.value)}
                      placeholder="e.g., Software Engineers, Product Managers, Data Scientists..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="monthlyHires">Expected Monthly Hires</Label>
                    <Input
                      id="monthlyHires"
                      type="number"
                      value={formData.monthlyHires}
                      onChange={(e) => handleInputChange('monthlyHires', e.target.value)}
                      placeholder="Number of hires per month"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Current Challenges */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Users className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h2 className="text-2xl font-bold text-gray-900">Current Challenges</h2>
                  <p className="text-gray-600">Help us understand your recruitment pain points</p>
                </div>

                <div>
                  <Label htmlFor="currentChallenges">What are your biggest recruitment challenges?</Label>
                  <Textarea
                    id="currentChallenges"
                    value={formData.currentChallenges}
                    onChange={(e) => handleInputChange('currentChallenges', e.target.value)}
                    placeholder="e.g., Finding qualified candidates, long hiring process, candidate experience..."
                    rows={4}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">How Hire EZ Will Help</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• AI-powered resume parsing and analysis</li>
                    <li>• Automated interview scheduling and evaluation</li>
                    <li>• Intelligent candidate matching and ranking</li>
                    <li>• Real-time analytics and hiring insights</li>
                    <li>• Streamlined workflow and collaboration tools</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              {currentStep < 3 ? (
                <Button
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={completeOnboarding}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? 'Setting up...' : 'Complete Setup'}
                  <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs">
            <p><strong>Debug Info:</strong></p>
            <p>User ID: {user?.id}</p>
            <p>User Email: {user?.email}</p>
            <p>Supabase Connected: {supabase ? 'Yes' : 'No'}</p>
            <p>Current Step: {currentStep}</p>
            {debugInfo && (
              <div className="mt-2 p-2 bg-yellow-100 rounded">
                <p><strong>Debug Log:</strong> {debugInfo}</p>
              </div>
            )}
          </div>
        )}

        {/* Database Setup Instructions */}
        {!supabase && (
          <Card className="mt-4 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-800 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Database Setup Required</span>
              </div>
              <p className="text-sm text-red-700 mb-3">
                Please ensure you have run the database migration in your Supabase dashboard:
              </p>
              <ol className="text-sm text-red-700 list-decimal list-inside space-y-1">
                <li>Go to your Supabase dashboard</li>
                <li>Navigate to SQL Editor</li>
                <li>Run the migration file: <code className="bg-red-200 px-1 rounded">supabase/migrations/20250607063731_pink_lagoon.sql</code></li>
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}