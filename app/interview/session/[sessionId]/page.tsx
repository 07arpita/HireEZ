'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, User, Mail, ArrowRight, Clock, Mic, Video } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface InterviewSession {
  id: string;
  session_id: string;
  candidate_email: string;
  job_role: string;
  key_skills: string[];
  interview_type: string;
  num_questions: number;
  status: string;
}

export default function InterviewSessionPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [params.sessionId]);

  const fetchSession = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('session_id', params.sessionId)
        .single();

      if (error) throw error;

      setSession(data);
      setCandidateEmail(data.candidate_email || '');
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Interview session not found');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !candidateName.trim() || !candidateEmail.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      // Update session status
      const { error } = await supabase
        .from('interview_sessions')
        .update({ status: 'in_progress' })
        .eq('id', session.id);

      if (error) throw error;

      // Redirect to live interview
      router.push(`/interview/live/${params.sessionId}?name=${encodeURIComponent(candidateName)}&email=${encodeURIComponent(candidateEmail)}`);
    } catch (error) {
      console.error('Error starting interview:', error);
      toast.error('Failed to start interview');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Session Not Found</h1>
            <p className="text-gray-600">The interview session you're looking for doesn't exist or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Interview
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome to your AI-powered interview session
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900">
              {session.job_role} Interview
            </CardTitle>
            <CardDescription className="text-gray-600">
              Please provide your information to begin the interview
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Interview Details */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-blue-900">Interview Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{session.num_questions} questions</span>
                </div>
                <div className="flex items-center space-x-2">
                  {session.interview_type === 'video' ? (
                    <Video className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Mic className="w-4 h-4 text-blue-600" />
                  )}
                  <span>{session.interview_type === 'video' ? 'Video' : 'Voice'} interview</span>
                </div>
              </div>
              
              {session.key_skills && session.key_skills.length > 0 && (
                <div>
                  <p className="text-sm text-blue-800 mb-2">Key skills to be assessed:</p>
                  <div className="flex flex-wrap gap-1">
                    {session.key_skills.slice(0, 6).map((skill, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                    {session.key_skills.length > 6 && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        +{session.key_skills.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Candidate Information Form */}
            <form onSubmit={handleStartInterview} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="candidateName">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="candidateName"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Enter your full name"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="candidateEmail">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="candidateEmail"
                    type="email"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Before you begin:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Ensure you have a stable internet connection</li>
                  <li>• Find a quiet environment with minimal distractions</li>
                  <li>• Allow microphone access when prompted</li>
                  {session.interview_type === 'video' && (
                    <li>• Allow camera access for video interview</li>
                  )}
                  <li>• Speak clearly and take your time to answer</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={submitting || !candidateName.trim() || !candidateEmail.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                {submitting ? (
                  'Starting Interview...'
                ) : (
                  <>
                    Start Interview
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-gray-500">
              <p>This interview is powered by AI and will be recorded for evaluation purposes.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}