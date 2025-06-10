'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Download, 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar,
  FileText,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface FormSubmission {
  id: string;
  candidate_name: string;
  candidate_email: string;
  status: string;
  submitted_at: string;
  responses: { [key: string]: string };
}

const SUBMISSION_STATUSES = ['new', 'reviewed', 'shortlisted', 'rejected'];

const STATUS_COLORS = {
  'new': 'bg-blue-100 text-blue-800',
  'reviewed': 'bg-yellow-100 text-yellow-800',
  'shortlisted': 'bg-green-100 text-green-800',
  'rejected': 'bg-red-100 text-red-800'
};

export default function FormSubmissionsPage({ params }: { params: { formId: string } }) {
  const { user } = useAuth();
  const [formTitle] = useState('Software Engineer Application');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [fieldLabels, setFieldLabels] = useState<{ [key: string]: string }>({});
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    fetchStatuses();
    fetchSubmissions();
  }, []);

  const fetchStatuses = async () => {
    const { data } = await supabase.from('candidate_status').select('*');
    setStatuses(data || []);
  };

  const fetchSubmissions = async () => {
    if (!supabase) return;
    setLoading(true);
    console.log('Fetching submissions for formId:', params.formId);
    // Fetch all submissions for this form
    const { data: submissionRows, error: submissionError } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('form_id', params.formId)
      .order('submitted_at', { ascending: false });
    if (submissionError) {
      console.error('Error fetching submissions:', submissionError);
      setSubmissions([]);
      setLoading(false);
      return;
    }
    // For each submission, fetch its field responses
    const allSubmissions = await Promise.all(
      (submissionRows || []).map(async (submission) => {
        const { data: responses, error: respError } = await supabase
          .from('form_field_responses')
          .select('field_id, response_value')
          .eq('submission_id', submission.id);
        if (respError) {
          console.error('Error fetching field responses:', respError);
          return { ...submission, responses: {} };
        }
        // Map responses by field_id
        const responseMap: { [key: string]: string } = {};
        (responses || []).forEach(r => {
          responseMap[r.field_id] = r.response_value;
        });
        return { ...submission, responses: responseMap };
      })
    );
    setSubmissions(allSubmissions);
    console.log('Fetched submissions:', allSubmissions);
    setLoading(false);
  };

  const fetchFields = async () => {
    if (!supabase) return;
    const { data: fields, error } = await supabase
      .from('form_fields')
      .select('id, label')
      .eq('form_id', params.formId);
    if (!error && fields) {
      const labelMap: { [key: string]: string } = {};
      fields.forEach(f => { labelMap[f.id] = f.label; });
      setFieldLabels(labelMap);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    await supabase.from('form_submissions').update({ status: newStatus }).eq('id', id);
    fetchSubmissions();
  };

  const moveToRecruitmentPipeline = async (submission: FormSubmission) => {
    console.log('Moving submission to pipeline:', submission);
    try {
      const { error } = await supabase
        .from('candidate_pipeline')
        .insert({
          candidate_name: submission.candidate_name,
          candidate_email: submission.candidate_email,
          status: 'new',
          submission_id: submission.id,
          created_at: new Date().toISOString()
        });
      if (error) {
        console.error('Error moving to pipeline:', error);
        toast.error('Failed to move to pipeline');
        return;
      }
      toast.success(`${submission.candidate_name} moved to recruitment pipeline!`);
    } catch (error) {
      console.error('Error in moveToRecruitmentPipeline:', error);
      toast.error('Failed to move to pipeline');
    }
  };

  const exportSubmissions = () => {
    // In real app, this would generate and download a CSV/Excel file
    toast.success('Submissions exported successfully!');
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.candidate_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: submissions.length,
    new: submissions.filter(s => s.status === 'new').length,
    reviewed: submissions.filter(s => s.status === 'reviewed').length,
    shortlisted: submissions.filter(s => s.status === 'shortlisted').length
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/forms">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Forms
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Form Submissions</h1>
              <p className="text-gray-600">{formTitle}</p>
            </div>
          </div>
          <Button 
            onClick={exportSubmissions}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Applications received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.reviewed}</div>
              <p className="text-xs text-muted-foreground">
                Under consideration
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.shortlisted}</div>
              <p className="text-xs text-muted-foreground">
                Moving forward
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle>Application Submissions</CardTitle>
                <CardDescription>
                  Review and manage candidate applications
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search submissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredSubmissions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{submission.candidate_name}</div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {submission.candidate_email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <select
                            value={submission.status}
                            onChange={(e) => handleStatusChange(submission.id, e.target.value)}
                            className={`px-2 py-1 rounded text-xs font-medium border-0 ${STATUS_COLORS[submission.status as keyof typeof STATUS_COLORS]}`}
                          >
                            {statuses.map(status => (
                              <option
                                key={status.status}
                                value={status.status}
                              >
                                {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(submission.submitted_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSelectedSubmission(submission)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Application Details - {submission.candidate_name}</DialogTitle>
                                  <DialogDescription>
                                    Complete application submission
                                  </DialogDescription>
                                </DialogHeader>
                                
                                {selectedSubmission && (
                                  <div className="space-y-6">
                                    {/* Candidate Info */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                      <h3 className="font-semibold text-gray-900 mb-3">Candidate Information</h3>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <span className="text-sm text-gray-600">Name:</span>
                                          <p className="font-medium">{selectedSubmission.candidate_name}</p>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-600">Email:</span>
                                          <p className="font-medium">{selectedSubmission.candidate_email}</p>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-600">Submitted:</span>
                                          <p className="font-medium">
                                            {new Date(selectedSubmission.submitted_at).toLocaleString()}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-600">Status:</span>
                                          <Badge className={STATUS_COLORS[selectedSubmission.status as keyof typeof STATUS_COLORS]}>
                                            {selectedSubmission.status}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Form Responses */}
                                    <div>
                                      <h3 className="font-semibold text-gray-900 mb-3">Application Responses</h3>
                                      <div className="space-y-4">
                                        {Object.entries(selectedSubmission.responses)
                                          .filter(([fieldId]) => {
                                            const label = fieldLabels[fieldId]?.toLowerCase().trim();
                                            return label !== 'full name' && label !== 'email address';
                                          })
                                          .map(([fieldId, answer]) => (
                                            <div key={fieldId} className="border-l-4 border-blue-500 pl-4">
                                              <p className="font-medium text-gray-900 mb-1">{fieldLabels[fieldId] || fieldId}</p>
                                              {typeof answer === 'string' && answer.startsWith('http') ? (
                                                <a href={answer} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                                  {answer.split('/').pop()}
                                                </a>
                                              ) : (
                                                <p className="text-gray-700">{answer}</p>
                                              )}
                                            </div>
                                          ))}
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end space-x-2 pt-4 border-t">
                                      <Button variant="outline">
                                        Send Message
                                      </Button>
                                      <Button 
                                        onClick={() => moveToRecruitmentPipeline(selectedSubmission)}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                      >
                                        Move to Pipeline
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => moveToRecruitmentPipeline(submission)}
                              className="text-green-600 hover:text-green-700"
                            >
                              Move to Pipeline
                            </Button>
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No submissions match your search criteria.' 
                    : 'No applications have been submitted yet.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}