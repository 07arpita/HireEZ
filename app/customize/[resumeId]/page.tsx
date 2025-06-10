'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  Settings, 
  Send, 
  User, 
  Mail, 
  Phone,
  Briefcase,
  Clock,
  Video,
  Mic,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { mockSendInterviewInvitation } from '@/lib/email';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Resume {
  id: string;
  candidate_name: string;
  candidate_email: string;
  phone: string;
  skills: string[];
  education: any[];
  experience: any[];
  summary: string;
}

const JOB_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Scientist',
  'Product Manager',
  'UI/UX Designer',
  'Mobile Developer',
  'Software Engineer',
  'Technical Lead'
];

const COMMON_SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'C++', 'SQL',
  'AWS', 'Docker', 'Kubernetes', 'Git', 'HTML', 'CSS', 'Vue.js', 'Angular',
  'MongoDB', 'PostgreSQL', 'Redis', 'GraphQL', 'REST APIs', 'Microservices'
];

export default function CustomizePage({ params }: { params: { resumeId: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [jobRole, setJobRole] = useState('');
  const [customJobRole, setCustomJobRole] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkills, setCustomSkills] = useState('');
  const [interviewType, setInterviewType] = useState('voice');
  const [numQuestions, setNumQuestions] = useState('5');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    if (user && params.resumeId) {
      fetchResume();
    }
  }, [user, params.resumeId]);

  const fetchResume = async () => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', params.resumeId)
        .eq('recruiter_id', user?.id)
        .single();

      if (error) throw error;

      setResume(data);
      setCandidateEmail(data.candidate_email || '');
      
      // Pre-select skills that match the resume
      if (data.skills && Array.isArray(data.skills)) {
        const matchingSkills = COMMON_SKILLS.filter(skill => 
          data.skills.some((resumeSkill: string) => 
            resumeSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(resumeSkill.toLowerCase())
          )
        );
        setSelectedSkills(matchingSkills);
      }
    } catch (error) {
      console.error('Error fetching resume:', error);
      toast.error('Failed to load resume');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resume || !user) return;

    setSubmitting(true);

    try {
      // Prepare skills array
      const allSkills = [...selectedSkills];
      if (customSkills.trim()) {
        const additionalSkills = customSkills.split(',').map(s => s.trim()).filter(s => s);
        allSkills.push(...additionalSkills);
      }

      // Determine final job role
      const finalJobRole = customJobRole.trim() || jobRole;

      if (!finalJobRole) {
        toast.error('Please select or enter a job role');
        setSubmitting(false);
        return;
      }

      if (!candidateEmail) {
        toast.error('Please enter candidate email');
        setSubmitting(false);
        return;
      }

      // Generate unique session ID
      const sessionId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Save interview session to database
      const { data: sessionData, error: sessionError } = await supabase
        .from('interview_sessions')
        .insert({
          recruiter_id: user.id,
          resume_id: resume.id,
          session_id: sessionId,
          candidate_email: candidateEmail,
          job_role: finalJobRole,
          key_skills: allSkills,
          interview_type: interviewType,
          num_questions: parseInt(numQuestions),
          status: 'scheduled'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Get user profile for recruiter name
      const { data: userProfile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Send interview invitation email
      const emailResult = await mockSendInterviewInvitation(
        candidateEmail,
        resume.candidate_name,
        sessionId,
        finalJobRole,
        userProfile?.full_name || 'Recruiter'
      );

      if (emailResult.success) {
        toast.success('Interview invitation sent successfully!');
        router.push('/dashboard/interviews');
      } else {
        toast.error('Failed to send interview invitation');
      }

    } catch (error) {
      console.error('Error creating interview:', error);
      toast.error('Failed to create interview session');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Resume not found</h1>
            <Link href="/results">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/results">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customize Interview</h1>
              <p className="text-gray-600">
                Set up an AI-powered interview for {resume.candidate_name || 'this candidate'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Candidate Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Candidate Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">{resume.candidate_name || 'Unknown'}</h3>
                </div>

                <div className="space-y-3">
                  {resume.candidate_email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{resume.candidate_email}</span>
                    </div>
                  )}
                  {resume.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{resume.phone}</span>
                    </div>
                  )}
                  {resume.experience && resume.experience.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{resume.experience.length} position(s)</span>
                    </div>
                  )}
                </div>

                {resume.skills && resume.skills.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Current Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {resume.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {resume.summary && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                    <p className="text-sm text-gray-600 line-clamp-4">
                      {resume.summary}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Interview Configuration Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Interview Configuration</span>
                </CardTitle>
                <CardDescription>
                  Customize the AI interview based on the job requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Job Role */}
                  <div className="space-y-2">
                    <Label htmlFor="jobRole">Job Role *</Label>
                    <Select value={jobRole} onValueChange={setJobRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a job role" />
                      </SelectTrigger>
                      <SelectContent>
                        {JOB_ROLES.map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Or enter a custom job role"
                      value={customJobRole}
                      onChange={(e) => setCustomJobRole(e.target.value)}
                    />
                  </div>

                  {/* Key Skills */}
                  <div className="space-y-3">
                    <Label>Key Skills to Assess</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {COMMON_SKILLS.map(skill => (
                        <div key={skill} className="flex items-center space-x-2">
                          <Checkbox
                            id={skill}
                            checked={selectedSkills.includes(skill)}
                            onCheckedChange={() => handleSkillToggle(skill)}
                          />
                          <Label htmlFor={skill} className="text-sm">{skill}</Label>
                        </div>
                      ))}
                    </div>
                    <Input
                      placeholder="Additional skills (comma-separated)"
                      value={customSkills}
                      onChange={(e) => setCustomSkills(e.target.value)}
                    />
                  </div>

                  {/* Interview Type */}
                  <div className="space-y-2">
                    <Label>Interview Type</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          interviewType === 'voice' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setInterviewType('voice')}
                      >
                        <div className="flex items-center space-x-3">
                          <Mic className="w-5 h-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium">Voice Only</h4>
                            <p className="text-sm text-gray-600">Audio-based interview</p>
                          </div>
                        </div>
                      </div>
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          interviewType === 'video' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setInterviewType('video')}
                      >
                        <div className="flex items-center space-x-3">
                          <Video className="w-5 h-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium">Video Call</h4>
                            <p className="text-sm text-gray-600">Video + audio interview</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Number of Questions */}
                  <div className="space-y-2">
                    <Label htmlFor="numQuestions">Number of Questions</Label>
                    <Select value={numQuestions} onValueChange={setNumQuestions}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 questions (~10 minutes)</SelectItem>
                        <SelectItem value="5">5 questions (~15 minutes)</SelectItem>
                        <SelectItem value="7">7 questions (~20 minutes)</SelectItem>
                        <SelectItem value="10">10 questions (~30 minutes)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Candidate Email */}
                  <div className="space-y-2">
                    <Label htmlFor="candidateEmail">Candidate Email *</Label>
                    <Input
                      id="candidateEmail"
                      type="email"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      placeholder="Enter candidate's email address"
                      required
                    />
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="additionalNotes"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="Any specific instructions or focus areas for the interview..."
                      rows={3}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <Link href="/results">
                      <Button variant="outline">Cancel</Button>
                    </Link>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {submitting ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Creating Interview...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Interview Invitation
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}