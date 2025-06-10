'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search, 
  Eye, 
  Calendar, 
  Clock, 
  User, 
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  FileText,
  TrendingUp,
  Users,
  Target
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface InterviewResult {
  id: string;
  session_id: string;
  candidate_name: string;
  score: number;
  summary: string;
  audio_url: string;
  video_url: string;
  transcript: string;
  evaluation: any;
  decision: string;
  completed_at: string;
  created_at: string;
  interview_sessions: {
    job_role: string;
    key_skills: string[];
    interview_type: string;
    candidate_email: string;
  };
}

const getScoreColor = (score: number) => {
  if (score >= 8) return 'text-green-600 bg-green-100';
  if (score >= 6) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

const getDecisionColor = (decision: string) => {
  switch (decision) {
    case 'hire':
      return 'bg-green-100 text-green-800';
    case 'consider':
      return 'bg-yellow-100 text-yellow-800';
    case 'reject':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getDecisionIcon = (decision: string) => {
  switch (decision) {
    case 'hire':
      return <CheckCircle className="w-4 h-4" />;
    case 'consider':
      return <AlertCircle className="w-4 h-4" />;
    case 'reject':
      return <XCircle className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

export default function InterviewDashboardPage() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<InterviewResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInterview, setSelectedInterview] = useState<InterviewResult | null>(null);

  useEffect(() => {
    if (user) {
      fetchInterviews();
    }
  }, [user]);

  const fetchInterviews = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('interview_results')
        .select(`
          *,
          interview_sessions!inner(
            job_role,
            key_skills,
            interview_type,
            candidate_email,
            recruiter_id
          )
        `)
        .eq('interview_sessions.recruiter_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInterviews(data || []);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast.error('Failed to load interview results');
    } finally {
      setLoading(false);
    }
  };

  const updateDecision = async (interviewId: string, decision: string) => {
    if (!supabase) return;
    
    try {
      const { error } = await supabase
        .from('interview_results')
        .update({ decision })
        .eq('id', interviewId);

      if (error) throw error;

      setInterviews(prev => prev.map(interview => 
        interview.id === interviewId 
          ? { ...interview, decision }
          : interview
      ));

      toast.success(`Candidate marked as ${decision}`);
    } catch (error) {
      console.error('Error updating decision:', error);
      toast.error('Failed to update decision');
    }
  };

  const filteredInterviews = interviews.filter(interview =>
    interview.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interview.interview_sessions.job_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interview.interview_sessions.candidate_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: interviews.length,
    avgScore: interviews.length > 0 ? (interviews.reduce((sum, i) => sum + i.score, 0) / interviews.length).toFixed(1) : '0',
    hired: interviews.filter(i => i.decision === 'hire').length,
    pending: interviews.filter(i => i.decision === 'pending').length
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Results</h1>
          <p className="text-gray-600">
            Review AI-powered interview evaluations and make hiring decisions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Completed assessments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgScore}/10</div>
              <p className="text-xs text-muted-foreground">
                AI evaluation score
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hired</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.hired}</div>
              <p className="text-xs text-muted-foreground">
                Successful candidates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting decision
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Interview Results Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle>Interview Results</CardTitle>
                <CardDescription>
                  AI-evaluated interview performances and hiring recommendations
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search interviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredInterviews.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>AI Recommendation</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInterviews.map((interview) => (
                      <TableRow key={interview.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {interview.candidate_name || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {interview.interview_sessions.candidate_email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{interview.interview_sessions.job_role}</div>
                            <div className="text-sm text-gray-500 capitalize">
                              {interview.interview_sessions.interview_type} interview
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className={`font-semibold px-2 py-1 rounded-full text-sm ${getScoreColor(interview.score)}`}>
                              {interview.score.toFixed(1)}/10
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getDecisionColor(interview.evaluation?.recommendation || interview.decision)} flex items-center space-x-1`}>
                            {getDecisionIcon(interview.evaluation?.recommendation || interview.decision)}
                            <span className="capitalize">
                              {interview.evaluation?.recommendation || interview.decision}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(interview.completed_at || interview.created_at).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSelectedInterview(interview)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Interview Details - {interview.candidate_name}</DialogTitle>
                                  <DialogDescription>
                                    {interview.interview_sessions.job_role} • Score: {interview.score.toFixed(1)}/10
                                  </DialogDescription>
                                </DialogHeader>
                                
                                {selectedInterview && (
                                  <div className="space-y-6">
                                    {/* Summary */}
                                    <div>
                                      <h3 className="font-semibold mb-2">AI Summary</h3>
                                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                        {selectedInterview.summary}
                                      </p>
                                    </div>

                                    {/* Evaluation Details */}
                                    {selectedInterview.evaluation && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                                          <ul className="space-y-1">
                                            {selectedInterview.evaluation.strengths?.map((strength: string, index: number) => (
                                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                                <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                {strength}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                        <div>
                                          <h4 className="font-medium text-red-700 mb-2">Areas of Concern</h4>
                                          <ul className="space-y-1">
                                            {selectedInterview.evaluation.concerns?.map((concern: string, index: number) => (
                                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                                <AlertCircle className="w-3 h-3 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                                {concern}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    )}

                                    {/* Skills Assessed */}
                                    <div>
                                      <h3 className="font-semibold mb-2">Skills Assessed</h3>
                                      <div className="flex flex-wrap gap-2">
                                        {selectedInterview.interview_sessions.key_skills?.map((skill, index) => (
                                          <Badge key={index} variant="secondary">{skill}</Badge>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Transcript */}
                                    {selectedInterview.transcript && (
                                      <div>
                                        <h3 className="font-semibold mb-2">Interview Transcript</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                                          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {selectedInterview.transcript}
                                          </pre>
                                        </div>
                                      </div>
                                    )}

                                    {/* Decision Actions */}
                                    <div className="flex justify-end space-x-2 pt-4 border-t">
                                      <Button
                                        variant="outline"
                                        onClick={() => updateDecision(selectedInterview.id, 'reject')}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Reject
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => updateDecision(selectedInterview.id, 'consider')}
                                        className="text-yellow-600 hover:text-yellow-700"
                                      >
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        Consider
                                      </Button>
                                      <Button
                                        onClick={() => updateDecision(selectedInterview.id, 'hire')}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Hire
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            {interview.decision === 'pending' && (
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateDecision(interview.id, 'hire')}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateDecision(interview.id, 'reject')}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No interview results found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'No interviews match your search criteria.' : 'No interviews have been completed yet.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}