'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  CheckCircle,
  Clock,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { mockHuggingFaceClient } from '@/lib/ai';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { VoiceAgent } from '@/components/interview/VoiceAgent';

interface InterviewSession {
  id: string;
  session_id: string;
  job_role: string;
  key_skills: string[];
  interview_type: string;
  num_questions: number;
}

const MOCK_QUESTIONS = [
  "Tell me about yourself and your background in software development.",
  "Describe a challenging project you've worked on and how you overcame the difficulties.",
  "How do you stay updated with the latest technologies and industry trends?",
  "Explain a time when you had to work with a difficult team member. How did you handle it?",
  "What interests you most about this role and our company?",
  "Describe your experience with the key technologies mentioned in the job description.",
  "How do you approach debugging and troubleshooting complex issues?",
  "Tell me about a time when you had to learn a new technology quickly.",
  "How do you ensure code quality and maintainability in your projects?",
  "Where do you see yourself in your career in the next 3-5 years?"
];

export default function LiveInterviewPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes per question
  
  const candidateName = searchParams.get('name') || '';
  const candidateEmail = searchParams.get('email') || '';
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchSession();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [params.sessionId]);

  useEffect(() => {
    if (interviewStarted && !interviewCompleted) {
      startTimer();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestion, interviewStarted, interviewCompleted]);

  const fetchSession = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('session_id', params.sessionId)
        .single();

      if (error) throw error;

      setSession(data);
      
      // Generate questions based on session
      const selectedQuestions = MOCK_QUESTIONS
        .sort(() => Math.random() - 0.5)
        .slice(0, data.num_questions);
      
      setQuestions(selectedQuestions);
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Interview session not found');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    setTimeRemaining(120);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleNextQuestion();
          return 120;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startInterview = async () => {
    try {
      // Request media permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: session?.interview_type === 'video'
      });

      // Setup media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      setInterviewStarted(true);
      setIsRecording(true);
      mediaRecorderRef.current.start();
      
      toast.success('Interview started! Good luck!');
    } catch (error) {
      console.error('Error starting interview:', error);
      toast.error('Failed to access camera/microphone');
    }
  };

  const handleNextQuestion = () => {
    // Save current response
    if (currentResponse.trim()) {
      setResponses(prev => [...prev, currentResponse.trim()]);
      setCurrentResponse('');
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      completeInterview();
    }
  };

  const completeInterview = async () => {
    setInterviewCompleted(true);
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    try {
      // Simulate transcript generation
      const transcript = responses.map((response, index) => 
        `Q${index + 1}: ${questions[index]}\nA${index + 1}: ${response}`
      ).join('\n\n');

      // Evaluate interview using AI
      const evaluation = await mockHuggingFaceClient.evaluateInterview(
        transcript,
        session?.job_role || 'Software Developer',
        session?.key_skills || []
      );

      // Save interview results
      const { error } = await supabase
        .from('interview_results')
        .insert({
          session_id: session?.id,
          candidate_name: candidateName,
          score: evaluation.score,
          summary: evaluation.summary,
          transcript: transcript,
          evaluation: evaluation,
          decision: evaluation.recommendation,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update session status
      await supabase
        .from('interview_sessions')
        .update({ status: 'completed' })
        .eq('id', session?.id);

      toast.success('Interview completed successfully!');
      
      // Redirect after a delay
      setTimeout(() => {
        router.push('/interview/complete');
      }, 3000);

    } catch (error) {
      console.error('Error completing interview:', error);
      toast.error('Failed to save interview results');
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // In a real implementation, this would mute the microphone
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    // In a real implementation, this would turn off the camera
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCallEnd = async (transcript: string) => {
    try {
      // Save interview results
      const { error } = await supabase
        .from('interview_results')
        .insert({
          session_id: session?.id,
          candidate_name: candidateName,
          transcript: transcript,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update session status
      await supabase
        .from('interview_sessions')
        .update({ status: 'completed' })
        .eq('id', session?.id);

      toast.success('Interview completed successfully!');
      
      // Redirect after a delay
      setTimeout(() => {
        router.push('/interview/complete');
      }, 3000);
    } catch (error) {
      console.error('Error saving interview results:', error);
      toast.error('Failed to save interview results');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Session Not Found</h1>
          <p>The interview session could not be found.</p>
        </div>
      </div>
    );
  }

  if (interviewCompleted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Interview Complete!</h1>
            <p className="text-gray-300 mb-4">
              Thank you for participating in the AI interview. Your responses have been recorded and will be evaluated.
            </p>
            <p className="text-sm text-gray-400">
              You will be redirected shortly...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-blue-500" />
            <div>
              <h1 className="font-semibold">AI Interview - {session.job_role}</h1>
              <p className="text-sm text-gray-400">Candidate: {candidateName}</p>
            </div>
          </div>
          
          {interviewStarted && (
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-red-600 text-white">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                Recording
              </Badge>
              <div className="text-sm">
                Question {currentQuestion + 1} of {questions.length}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {!interviewStarted ? (
          /* Pre-Interview Setup */
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="text-center">
                <CardTitle className="text-white">Ready to Start?</CardTitle>
                <CardDescription className="text-gray-300">
                  Make sure your microphone is working properly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-3">Interview Overview</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Questions:</span>
                      <span className="text-white ml-2">{session.num_questions}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white ml-2 capitalize">{session.interview_type}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Time per question:</span>
                      <span className="text-white ml-2">2 minutes</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total time:</span>
                      <span className="text-white ml-2">~{session.num_questions * 2} minutes</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setInterviewStarted(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  Start Interview
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Voice Interview Interface */
          <VoiceAgent
            sessionId={session.id}
            jobRole={session.job_role}
            keySkills={session.key_skills}
            onCallEnd={handleCallEnd}
          />
        )}
      </div>
    </div>
  );
}