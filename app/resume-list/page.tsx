'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Link as LinkIcon, Mail, Phone, ExternalLink, Trash2, Eye, BarChart2, Bot } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChatInterface } from '@/components/chat/ChatInterface';

interface ResumeData {
  id: string;
  candidate_name: string;
  candidate_email: string;
  phone: string;
  summary: string;
  education: any[];
  experience: any[];
  file_name: string;
  file_url: string;
  parsed_content: string;
  job_description: string;
  job_role: string;
  analysis_data: any;
  created_at: string;
  uploaded_at?: string;
}

const ResumeListPage: React.FC = () => {
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<any | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [openChatResume, setOpenChatResume] = useState<ResumeData | null>(null);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setIsLoading(true);
        if (!supabase) throw new Error('Supabase client not available');
        const { data, error } = await supabase.from('resume_screened').select('*').order('uploaded_at', { ascending: false });
        if (error) throw error;
        // Parse analysis_json for each resume
        const parsed = (data as any[] || []).map((row: any) => {
          let analysisData = {};
          if (row && typeof row.analysis_json === 'string') {
            try { analysisData = JSON.parse(row.analysis_json); } catch { analysisData = {}; }
          } else if (row && typeof row.analysis_json === 'object' && row.analysis_json !== null) {
            analysisData = row.analysis_json;
          }
          return {
            ...row,
            analysis_data: analysisData,
          };
        });
        // Sort by uploaded_at descending (most recent first)
        parsed.sort((a, b) => new Date(b.uploaded_at || b.created_at).getTime() - new Date(a.uploaded_at || a.created_at).getTime());
        setResumes(parsed);
      } catch (err) {
        console.error('Error fetching resumes:', err);
        setError(`Failed to load resumes: ${err instanceof Error ? err.message : 'Unknown error'}`);
        toast.error('Failed to load resumes.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchResumes();
  }, []);

  const filteredResumes = resumes.filter(r =>
    (r.candidate_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.candidate_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.job_role || '').toLowerCase().includes(search.toLowerCase())
  );
  const avgMatch = resumes.length ? Math.round(resumes.reduce((acc, r) => acc + (r.analysis_data?.overall_match?.score || 0), 0) / resumes.length) : 0;

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      if (!supabase) throw new Error('Supabase client not available');
      await supabase.from('resume_screened').delete().eq('id', id);
      setResumes(resumes => resumes.filter(r => r.id !== id));
      toast.success('Resume deleted.');
    } catch (err) {
      toast.error('Failed to delete resume.');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-lg text-gray-600">Loading resumes...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] text-red-600">
          <p className="text-lg">Error: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Resume Database</h1>
          <p className="text-gray-600 text-base">Browse, search, and analyze all scanned candidate resumes in one place.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-5 flex flex-col items-start">
            <div className="text-xs text-gray-500 mb-1">Total Resumes</div>
            <div className="text-2xl font-bold text-gray-900">{resumes.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5 flex flex-col items-start">
            <div className="text-xs text-gray-500 mb-1">Avg. Match</div>
            <div className="text-2xl font-bold text-gray-900">{avgMatch}%</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5 flex flex-col items-start">
            <div className="text-xs text-gray-500 mb-1">With Email</div>
            <div className="text-2xl font-bold text-gray-900">{resumes.filter(r => r.candidate_email).length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5 flex flex-col items-start">
            <div className="text-xs text-gray-500 mb-1">Last Uploaded</div>
            <div className="text-2xl font-bold text-gray-900">{resumes[0]?.uploaded_at ? formatDistanceToNow(new Date(resumes[0].uploaded_at), { addSuffix: true }) : '-'}</div>
          </div>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">All Resumes</h2>
          <Input
            type="text"
            placeholder="Search resumes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredResumes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-lg">No resumes found.</td>
                </tr>
              ) : (
                filteredResumes.map((resume) => (
                  <tr key={resume.id} className="hover:bg-blue-50/40 transition">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{resume.candidate_name || 'Unnamed'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{resume.candidate_email || <span className='italic text-gray-400'>N/A</span>}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{resume.job_role || <span className='italic text-gray-400'>N/A</span>}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold {resume.analysis_data?.overall_match?.score >= 80 ? 'text-green-600' : resume.analysis_data?.overall_match?.score >= 60 ? 'text-blue-600' : 'text-yellow-600'}">{resume.analysis_data?.overall_match?.score ?? 'N/A'}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">{resume.uploaded_at ? formatDistanceToNow(new Date(resume.uploaded_at), { addSuffix: true }) : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <Button size="icon" variant="outline" className="rounded-full" title="View Resume" onClick={() => window.open(resume.file_url, '_blank')} disabled={!resume.file_url}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Dialog open={showDialog && selectedAnalysis?.id === resume.id} onOpenChange={open => { setShowDialog(open); if (!open) setSelectedAnalysis(null); }}>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="outline" className="rounded-full" title="View Analysis" onClick={() => { setSelectedAnalysis(resume); setShowDialog(true); }}>
                            <BarChart2 className="w-4 h-4 text-blue-600" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl w-full">
                          <DialogHeader>
                            <DialogTitle>Analysis Report</DialogTitle>
                          </DialogHeader>
                          {selectedAnalysis && (
                            (() => {
                              let parsed = selectedAnalysis.analysis_data;
                              if (typeof parsed === 'string') {
                                try { parsed = JSON.parse(parsed); } catch { return <div className="text-red-500 p-4">Could not parse analysis JSON.</div>; }
                              }
                              if (!parsed || typeof parsed !== 'object') return <div className="text-red-500 p-4">No analysis data.</div>;
                              return (
                                <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
                                  <div className="mb-2">
                                    <div className="font-bold text-lg text-gray-900">{parsed.candidate?.name || selectedAnalysis.candidate_name}</div>
                                    <div className="text-gray-600 text-sm">{parsed.candidate?.email || selectedAnalysis.candidate_email}</div>
                                    <div className="text-gray-600 text-sm">{parsed.candidate?.phone || selectedAnalysis.phone}</div>
                                  </div>
                                  {parsed.overall_match && (
                                    <div className="bg-blue-50 rounded-lg p-4 mb-2">
                                      <div className="font-semibold text-blue-900 mb-1">Overall Match: <span className="font-bold">{parsed.overall_match.score ?? 'N/A'}%</span></div>
                                      <div className="text-gray-800 text-sm mb-1">{parsed.overall_match.summary}</div>
                                      {Array.isArray(parsed.overall_match.strengths) && parsed.overall_match.strengths.length > 0 && (
                                        <div className="mb-1"><span className="font-semibold text-green-700">Strengths:</span> <ul className="list-disc ml-6 text-green-700">{parsed.overall_match.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul></div>
                                      )}
                                      {Array.isArray(parsed.overall_match.gaps) && parsed.overall_match.gaps.length > 0 && (
                                        <div><span className="font-semibold text-red-700">Gaps:</span> <ul className="list-disc ml-6 text-red-700">{parsed.overall_match.gaps.map((g: string, i: number) => <li key={i}>{g}</li>)}</ul></div>
                                      )}
                                    </div>
                                  )}
                                  {parsed.skills_analysis && (
                                    <div className="bg-yellow-50 rounded-lg p-4 mb-2">
                                      <div className="font-semibold text-yellow-900 mb-1">Skills Analysis</div>
                                      <div className="mb-1"><span className="font-bold">Matching Skills:</span> {Array.isArray(parsed.skills_analysis.matching_skills) && parsed.skills_analysis.matching_skills.length > 0 ? parsed.skills_analysis.matching_skills.join(', ') : 'None'}</div>
                                      <div className="mb-1"><span className="font-bold">Missing Skills:</span> {Array.isArray(parsed.skills_analysis.missing_skills) && parsed.skills_analysis.missing_skills.length > 0 ? parsed.skills_analysis.missing_skills.join(', ') : 'None'}</div>
                                      <div><span className="font-bold">Additional Skills:</span> {Array.isArray(parsed.skills_analysis.additional_skills) && parsed.skills_analysis.additional_skills.length > 0 ? parsed.skills_analysis.additional_skills.join(', ') : 'None'}</div>
                                    </div>
                                  )}
                                  {parsed.experience_analysis && (
                                    <div className="bg-green-50 rounded-lg p-4 mb-2">
                                      <div className="font-semibold text-green-900 mb-1">Experience Analysis</div>
                                      <div className="mb-1"><span className="font-bold">Relevant Experience:</span> {Array.isArray(parsed.experience_analysis.relevant_experience) && parsed.experience_analysis.relevant_experience.length > 0 ? parsed.experience_analysis.relevant_experience.join(', ') : 'None'}</div>
                                      <div className="mb-1"><span className="font-bold">Experience Gaps:</span> {Array.isArray(parsed.experience_analysis.experience_gaps) && parsed.experience_analysis.experience_gaps.length > 0 ? parsed.experience_analysis.experience_gaps.join(', ') : 'None'}</div>
                                      <div><span className="font-bold">Years of Experience:</span> {parsed.experience_analysis.years_of_experience ?? 'N/A'}</div>
                                    </div>
                                  )}
                                  {parsed.technical_fit && (
                                    <div className="bg-purple-50 rounded-lg p-4 mb-2">
                                      <div className="font-semibold text-purple-900 mb-1">Technical Fit</div>
                                      <div><span className="font-bold">Matching Technologies:</span> {Array.isArray(parsed.technical_fit.matching_technologies) && parsed.technical_fit.matching_technologies.length > 0 ? parsed.technical_fit.matching_technologies.join(', ') : 'None'}</div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button size="icon" variant="outline" className="rounded-full" title="Chat about candidate" onClick={() => setOpenChatResume(resume)}>
                        <Bot className="w-4 h-4 text-purple-600" />
                      </Button>
                      <Button size="icon" variant="outline" className="rounded-full" title="Delete" onClick={() => handleDelete(resume.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Chat Modal */}
      {openChatResume && (
        <Dialog open={!!openChatResume} onOpenChange={open => { if (!open) setOpenChatResume(null); }}>
          <DialogContent className="max-w-2xl w-full">
            <DialogHeader>
              <DialogTitle>Chat about {openChatResume.candidate_name}</DialogTitle>
            </DialogHeader>
            <ChatInterface
              resumeId={openChatResume.id}
              initialContext={openChatResume.summary}
              candidateName={openChatResume.candidate_name}
              overallScore={openChatResume.analysis_data?.overall_match?.score || 0}
              candidateAnalysis={openChatResume.analysis_data || openChatResume}
            />
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
};

export default ResumeListPage; 