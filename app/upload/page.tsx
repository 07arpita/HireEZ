'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle, XCircle, Brain, Eye, MessageSquare, AlertTriangle, Check, Loader2, User, Mail, Phone, Link as LinkIcon, RefreshCcw, Star, DollarSign, Lightbulb, Award, GraduationCap, Briefcase, ThumbsUp, Info } from 'lucide-react';
import { aiClient } from '@/lib/ai';
import { toast } from 'sonner';
import * as pdfjs from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.min.mjs';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { DashboardLayout } from '@/components/DashboardLayout';
import mammoth from 'mammoth';
import { supabase } from '@/lib/supabase';

interface FileUpload {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'analyzing' | 'saving' | 'completed' | 'error';
  progress: number;
  result?: any;
  analysis?: any;
  resumeId?: string;
  error?: string;
}

// Helper to remove null characters from strings before saving to DB
function removeNullChars(str: string): string {
  return str.replace(/\\u0000/g, '');
}

const JOB_POSITIONS_STATIC = [
  { id: 'dev-1', title: 'Software Engineer', description: 'Develop and maintain software applications.' },
  { id: 'data-1', title: 'Data Scientist', description: 'Analyze complex data to identify trends and insights.' },
  { id: 'pm-1', title: 'Product Manager', description: 'Define product vision, strategy, and roadmap.' },
  { id: 'ux-1', title: 'UX Designer', description: 'Design intuitive and engaging user experiences.' },
  { id: 'qa-1', title: 'QA Engineer', description: 'Ensure the quality of software products through testing.' },
];

const Resume: React.FC = () => {
  const [jobRole, setJobRole] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [jobSkills, setJobSkills] = useState<string>('');
  const [jobTechnologies, setJobTechnologies] = useState<string>('');
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [chatContext, setChatContext] = useState<string>('');
  const [showChatbot, setShowChatbot] = useState<boolean>(false);
  const [resumeText, setResumeText] = useState<string>('');
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [jobPositions, setJobPositions] = useState<any[]>(JOB_POSITIONS_STATIC);
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedJobId) {
      const selectedJob = jobPositions.find(job => job.id === selectedJobId);
      if (selectedJob) {
        setJobRole(selectedJob.title || '');
        setJobDescription(selectedJob.description || '');
      }
    } else if (!jobDescription) {
      setJobRole('');
      setJobDescription('');
    }
  }, [selectedJobId, jobPositions, jobDescription]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (isAnalyzing) {
        toast.info('Please wait for the current analysis to complete.');
        return;
      }
      const newUploads = acceptedFiles.map((file): FileUpload => ({
        file,
        id: file.name + '-' + Date.now(),
        status: 'pending',
        progress: 0,
      }));
      setUploads((prev) => [...prev, ...newUploads]);
      // Reset analysis results and current file ID when a new file is dropped
      setAnalysisResults(null);
      setCurrentFileId(null);
    },
    [isAnalyzing]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });

  const extractTextFromFile = async (file: File): Promise<string> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let textContent = '';

    if (fileExtension === 'pdf') {
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContentPage = await page.getTextContent();
        textContent += textContentPage.items.map((item: any) => item.str).join(' ') + ' ';
      }
    } else if (fileExtension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      textContent = result.value;
    } else if (fileExtension === 'txt') {
      textContent = await file.text();
    } else {
      throw new Error('Unsupported file type');
    }

    return removeNullChars(textContent);
  };

  const processFile = async (upload: FileUpload) => {
    setUploads((prev) =>
      prev.map((up) => (up.id === upload.id ? { ...up, status: 'processing', progress: 10 } : up))
    );

    try {
      const textContent = await extractTextFromFile(upload.file);
      setResumeText(textContent);
      setResumeUrl(URL.createObjectURL(upload.file));
      setUploads((prev) =>
        prev.map((up) => (up.id === upload.id ? { ...up, progress: 30 } : up))
      );

      setUploads((prev) =>
        prev.map((up) => (up.id === upload.id ? { ...up, status: 'analyzing', progress: 50 } : up))
      );
      // Step 2: Analyze the parsed resume against the job description
      setUploads((prev) =>
        prev.map((up) => (up.id === upload.id ? { ...up, progress: 70 } : up))
      );
      const analysisData = await aiClient.analyzeResumeForJob(textContent, jobDescription, jobDescription, '');
      setAnalysisResults(analysisData);
      setShowChatbot(true);
      setUploads((prev) =>
        prev.map((up) =>
          up.id === upload.id ? { ...up, status: 'completed', progress: 100 } : up
        )
      );

      // --- Save to Supabase Storage and Database ---
      if (supabase) {
        // 1. Upload the file to Supabase Storage
        const fileExt = upload.file.name.split('.').pop();
        const fileName = `${Date.now()}_${upload.file.name}`;
        const { data: storageData, error: storageError } = await supabase.storage
          .from('resumes')
          .upload(fileName, upload.file, { contentType: upload.file.type });
        if (storageError) {
          console.error('Error uploading file to storage:', storageError);
          toast.error('Failed to upload resume file to storage.');
          return;
        }
        // 2. Get the public URL
        let fileUrl = '';
        const publicUrlResult = supabase.storage.from('resumes').getPublicUrl(fileName);
        if (publicUrlResult && publicUrlResult.data && publicUrlResult.data.publicUrl) {
          fileUrl = publicUrlResult.data.publicUrl;
        }

        // 3. Parse analysis JSON if needed
        let parsedAnalysis: any = {};
        if (typeof analysisData === 'string') {
          try {
            parsedAnalysis = JSON.parse(analysisData);
          } catch {
            parsedAnalysis = {};
          }
        } else if (typeof analysisData === 'object' && analysisData !== null) {
          parsedAnalysis = analysisData;
        }
        // 4. Extract candidate name/email
        const candidateName = parsedAnalysis && parsedAnalysis.candidate && parsedAnalysis.candidate.name ? parsedAnalysis.candidate.name : '';
        const candidateEmail = parsedAnalysis && parsedAnalysis.candidate && parsedAnalysis.candidate.email ? parsedAnalysis.candidate.email : '';

        // 5. Insert into resume_screened table
        const { error: dbError } = await supabase.from('resume_screened').insert([
          {
            file_url: fileUrl,
            analysis_json: typeof parsedAnalysis === 'object' ? parsedAnalysis : {},
            candidate_name: candidateName,
            candidate_email: candidateEmail,
            job_role: jobRole,
          },
        ]);
        if (dbError) {
          console.error('Error saving resume analysis to DB:', dbError);
          toast.error('Failed to save resume analysis to database.');
        }
      }
    } catch (error: any) {
      console.error('Error processing file:', error);
      setError(error.message || 'An unknown error occurred');
      setUploads((prev) =>
        prev.map((up) =>
          up.id === upload.id
            ? { ...up, status: 'error', progress: 100, error: error.message || 'An unknown error occurred' }
            : up
        )
      );
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
      setCurrentFileId(null);
    }
  };

  useEffect(() => {
    if (currentFileId) {
      const currentUpload = uploads.find((up) => up.id === currentFileId);
      if (currentUpload && currentUpload.status === 'pending') {
        processFile(currentUpload);
      }
    }
  }, [currentFileId, processFile]);

  const handleAnalyzeResume = async () => {
    if (!jobRole || !jobDescription) {
      toast.error('Please enter a Job Role and Job Description before analyzing.');
      return;
    }
    if (uploads.length === 0) {
      toast.error('Please upload a resume file first.');
      return;
    }

    // If there's an uploaded file and conditions are met, start processing it
    const uploadedFile = uploads[0];
    if (uploadedFile && uploadedFile.status === 'pending') {
      setCurrentFileId(uploadedFile.id);
      setIsAnalyzing(true);
    } else if (uploadedFile) {
      // If a file was already processed and we want to re-analyze, reset its status
      setUploads((prev) =>
        prev.map((up) => (up.id === uploadedFile.id ? { ...up, status: 'pending', progress: 0 } : up))
      );
      setCurrentFileId(uploadedFile.id);
      setIsAnalyzing(true);
    }
  };

  const resetAnalysis = () => {
    setJobRole('');
    setJobDescription('');
    setJobSkills('');
    setJobTechnologies('');
    setUploads([]);
    setAnalysisResults(null);
    setIsAnalyzing(false);
    setCurrentFileId(null);
    setError(null);
    setResumeText('');
    setResumeUrl(null);
    setChatContext('');
    setShowChatbot(false);
  };

  const getStatusIcon = (status: FileUpload['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="h-5 w-5 text-gray-500" />;
      case 'processing':
      case 'analyzing':
      case 'saving':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: FileUpload['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-700';
      case 'processing':
      case 'analyzing':
      case 'saving':
        return 'text-blue-700';
      case 'completed':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  const getStatusText = (status: FileUpload['status']) => {
    switch (status) {
      case 'pending':
        return 'Waiting';
      case 'processing':
        return 'Processing file...';
      case 'analyzing':
        return 'Analyzing resume...';
      case 'saving':
        return 'Saving analysis...';
      case 'completed':
        return 'Analysis Complete!';
      case 'error':
        return 'Error';
      default:
        return '';
    }
  };

  const currentUpload = uploads[0];

  return (
    <DashboardLayout>
      <div className="container mx-auto px-0 py-0 bg-gradient-to-br from-white via-blue-50 to-white min-h-screen">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-6 text-center text-gray-900 tracking-tight">Resume Analysis</h1>
          <div className="text-center mb-10">
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
              Upload a resume and provide a job description to get instant AI-powered analysis, including candidate fit, cultural alignment, and interview insights.
            </p>
          </div>

          {/* Modern Upload and Job Description Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
            {/* Upload Resume File Card */}
            <div className="rounded-2xl shadow-xl bg-white border-l-8 border-blue-500 p-8 flex flex-col">
              <div className="flex items-center mb-6">
                <Upload className="w-7 h-7 text-blue-600 mr-3" />
                <span className="text-2xl font-bold text-gray-900">Upload Resume File</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">Drag and drop your resume here, or click to select a file.<br />Supported formats: <span className="font-semibold">PDF, DOCX, or TXT</span>.</p>
              <div
                {...getRootProps()}
                className={`transition-colors border-2 border-dashed rounded-xl p-10 text-center cursor-pointer bg-gradient-to-br from-blue-50 to-white hover:from-blue-100 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
                  isDragActive ? 'border-blue-500 bg-blue-50' : 'border-blue-200'
                }`}
                tabIndex={0}
                role="button"
                aria-label="File upload dropzone"
              >
                <input {...getInputProps()} ref={fileInputRef} />
                <div className="flex flex-col items-center justify-center">
                  <Upload className="w-16 h-16 text-blue-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {isDragActive ? 'Drop the file here' : 'Select Resume File'}
                  </h3>
                  <p className="text-gray-500 mb-4 text-sm">
                    Drag & drop a resume file here, or click to select
                  </p>
                  <Button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="mt-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold px-6 py-2 rounded-lg shadow-md text-base"
                  >
                    Choose File
                  </Button>
                  <p className="text-xs text-gray-400 mt-3">Supported formats: PDF, DOCX, TXT</p>
                </div>
              </div>
              {uploads.length > 0 && uploads[0] && (
                <div className="mt-6 p-3 border rounded-lg bg-blue-50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(uploads[0].status)}
                    <p className="text-sm font-medium text-gray-900 truncate">{uploads[0].file.name}</p>
                  </div>
                  <Badge className={getStatusColor(uploads[0].status)}>
                    {getStatusText(uploads[0].status)}
                  </Badge>
                </div>
              )}
            </div>

            {/* Job Description Card */}
            <div className="rounded-2xl shadow-xl bg-white p-8 flex flex-col">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FileText className="w-6 h-6 text-blue-500 mr-3" /> Job Description
              </h3>
              <div className="mb-5">
                <label htmlFor="jobPosition" className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Job Position
                </label>
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a position..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobPositions.length === 0 ? (
                      <SelectItem value="no-jobs" disabled>
                        No job positions available
                      </SelectItem>
                    ) : (
                      jobPositions.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-5">
                <label htmlFor="jobRole" className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Role
                </label>
                <Input
                  id="jobRole"
                  type="text"
                  placeholder="e.g., Software Engineer"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  disabled={!!selectedJobId}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-5">
                <label htmlFor="jobDescription" className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Description
                </label>
                <Textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Provide a detailed job description here..."
                  rows={6}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {error && (
                <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}
              <div className="mt-8">
                <Button
                  onClick={handleAnalyzeResume}
                  disabled={!uploads.length || !jobRole || !jobDescription || isAnalyzing}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold px-6 py-3 rounded-lg shadow-md text-lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Analyzing Resume...
                    </>
                  ) : (
                    <>Analyze Resume</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Analysis Results Display */}
          {analysisResults && (
            <div className="mt-12 max-w-4xl mx-auto">
              {(() => {
                let parsed = analysisResults;
                if (typeof analysisResults === 'string') {
                  try {
                    parsed = JSON.parse(analysisResults);
                  } catch {
                    return (
                      <div className="text-red-500 p-4">AI response could not be parsed as JSON.<br /><pre>{analysisResults}</pre></div>
                    );
                  }
                }
                if (!parsed || typeof parsed !== 'object') {
                  return <div className="text-red-500 p-4">Unexpected AI response format.</div>;
                }
                return (
                  <div className="rounded-2xl shadow-2xl border-4 border-blue-500 bg-gradient-to-br from-white via-blue-50 to-white p-0 md:p-2">
                    <div className="mb-10">
                      <div className="rounded-t-2xl bg-gradient-to-r from-blue-900 to-blue-600 shadow-xl px-10 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-0" style={{boxShadow: '0 4px 24px 0 rgba(30, 64, 175, 0.10)'}}>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-3xl font-extrabold text-white tracking-wide mb-4">ANALYSIS RESULTS</h2>
                          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                            <div className="flex items-center space-x-2 min-w-0">
                              <User className="w-5 h-5 text-blue-200" />
                              <span className="text-lg font-semibold text-white truncate">{parsed.candidate?.name || 'Candidate Name'}</span>
                            </div>
                            {parsed.candidate?.email && (
                              <div className="flex items-center space-x-2 min-w-0">
                                <Mail className="w-5 h-5 text-blue-200" />
                                <span className="text-lg text-white truncate">{parsed.candidate?.email}</span>
                              </div>
                            )}
                            {parsed.candidate?.phone && (
                              <div className="flex items-center space-x-2 min-w-0">
                                <Phone className="w-5 h-5 text-blue-200" />
                                <span className="text-lg text-white truncate">{parsed.candidate?.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="hidden md:flex items-center justify-end pr-4">
                          <FileText className="w-20 h-20 text-blue-200 opacity-30" />
                        </div>
                      </div>
                      <div className="h-4" />
                    </div>

                    {/* Modernized Analysis Sections */}
                    <div className="space-y-10">
                      {/* Overall Match */}
                      {parsed.overall_match && (
                        <div className="bg-white rounded-2xl shadow-lg p-8 border-l-8 border-blue-500 flex flex-col md:flex-row md:items-center gap-8">
                          <div className="flex-shrink-0 flex flex-col items-center justify-center mr-8 w-full md:w-auto mb-6 md:mb-0">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-green-400 text-white flex items-center justify-center text-4xl font-extrabold shadow-lg mb-2">
                              {parsed.overall_match.score ?? 'N/A'}%
                            </div>
                            <div className="w-32 bg-gray-200 rounded-full h-3 mt-2">
                              <div
                                className={`h-3 rounded-full ${
                                  parsed.overall_match.score >= 80 ? 'bg-green-500' :
                                  parsed.overall_match.score >= 60 ? 'bg-blue-500' :
                                  parsed.overall_match.score >= 40 ? 'bg-yellow-400' : 'bg-red-500'
                                }`}
                                style={{ width: `${parsed.overall_match.score || 0}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex-1 space-y-6">
                            <div className="mb-2 text-gray-900 text-lg font-bold"><span>Summary:</span> <span className="font-normal text-gray-800">{parsed.overall_match.summary}</span></div>
                            <div className="mb-2">
                              <span className="font-bold text-gray-900">Strengths:</span>
                              {Array.isArray(parsed.overall_match.strengths) && parsed.overall_match.strengths.length > 0 ? (
                                <ul className="list-disc ml-6 space-y-1 text-green-600 text-base">
                                  {parsed.overall_match.strengths.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                                </ul>
                              ) : (
                                <span className="text-gray-500 ml-2">No strengths listed.</span>
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-gray-900">Gaps:</span>
                              {Array.isArray(parsed.overall_match.gaps) && parsed.overall_match.gaps.length > 0 ? (
                                <ul className="list-disc ml-6 space-y-1 text-red-600 text-base">
                                  {parsed.overall_match.gaps.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                                </ul>
                              ) : (
                                <span className="text-gray-500 ml-2">No gaps listed.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Skills Analysis */}
                      {parsed.skills_analysis && (
                        <div className="relative bg-yellow-50 rounded-2xl shadow-lg p-8 border-l-8 border-yellow-400 mb-2">
                          <div className="absolute -top-6 left-6 flex items-center">
                            <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
                              <Star className="w-7 h-7 text-white" fill="currentColor" />
                            </div>
                          </div>
                          <h2 className="text-2xl font-extrabold text-yellow-700 mb-6 pl-16 flex items-center gap-2 tracking-wide">
                            Skills Analysis
                          </h2>
                          {/* Matching Skills */}
                          <div className="mb-6">
                            <div className="font-bold text-gray-900 mb-2">Matching Skills:</div>
                            {Array.isArray(parsed.skills_analysis.matching_skills) && parsed.skills_analysis.matching_skills.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {parsed.skills_analysis.matching_skills.map((item: string, idx: number) => (
                                  <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium text-sm shadow-sm border border-green-200">
                                    <Check className="w-4 h-4 mr-1 text-green-500" /> {item}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 ml-2">No matching skills.</span>
                            )}
                          </div>
                          {/* Missing Skills */}
                          <div className="mb-6">
                            <div className="font-bold text-gray-900 mb-2">Missing Skills:</div>
                            {Array.isArray(parsed.skills_analysis.missing_skills) && parsed.skills_analysis.missing_skills.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {parsed.skills_analysis.missing_skills.map((item: string, idx: number) => (
                                  <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 font-medium text-sm shadow-sm border border-red-200">
                                    <AlertTriangle className="w-4 h-4 mr-1 text-red-500" /> {item}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 ml-2">No missing skills.</span>
                            )}
                          </div>
                          {/* Additional Skills */}
                          <div>
                            <div className="font-bold text-gray-900 mb-2">Additional Skills:</div>
                            {Array.isArray(parsed.skills_analysis.additional_skills) && parsed.skills_analysis.additional_skills.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {parsed.skills_analysis.additional_skills.map((item: string, idx: number) => (
                                  <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium text-sm shadow-sm border border-blue-200">
                                    <Info className="w-4 h-4 mr-1 text-blue-500" /> {item}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 ml-2">No additional skills.</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Experience Analysis */}
                      {parsed.experience_analysis && (
                        <div className="bg-white rounded-xl shadow-lg p-8 border-l-8 border-green-500">
                          <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
                            <Briefcase className="w-6 h-6 text-green-400 mr-2" /> Experience Analysis
                          </h2>
                          <div className="mb-2">
                            <b>Relevant Experience:</b>
                            {Array.isArray(parsed.experience_analysis.relevant_experience) && parsed.experience_analysis.relevant_experience.length > 0 ? (
                              <ul className="list-disc ml-6 space-y-1 text-green-700">
                                {parsed.experience_analysis.relevant_experience.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                              </ul>
                            ) : (
                              <span className="text-gray-500 ml-2">No relevant experience listed.</span>
                            )}
                          </div>
                          <div className="mb-2">
                            <b>Experience Gaps:</b>
                            {Array.isArray(parsed.experience_analysis.experience_gaps) && parsed.experience_analysis.experience_gaps.length > 0 ? (
                              <ul className="list-disc ml-6 space-y-1 text-red-700">
                                {parsed.experience_analysis.experience_gaps.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                              </ul>
                            ) : (
                              <span className="text-gray-500 ml-2">No experience gaps.</span>
                            )}
                          </div>
                          <div>
                            <b>Years of Experience:</b> <span className="text-gray-800">{parsed.experience_analysis.years_of_experience ?? 'N/A'}</span>
                          </div>
                        </div>
                      )}

                      {/* Technical Fit */}
                      {parsed.technical_fit && (
                        <div className="bg-white rounded-xl shadow-lg p-8 border-l-8 border-purple-500">
                          <h2 className="text-2xl font-bold text-purple-700 mb-4 flex items-center gap-2">
                            <Star className="w-6 h-6 text-purple-400 mr-2" /> Technical Fit
                          </h2>
                          <div className="mb-2">
                            <b>Matching Technologies:</b>
                            {Array.isArray(parsed.technical_fit.matching_technologies) && parsed.technical_fit.matching_technologies.length > 0 ? (
                              <ul className="list-disc ml-6 space-y-1 text-green-700">
                                {parsed.technical_fit.matching_technologies.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                              </ul>
                            ) : (
                              <span className="text-gray-500 ml-2">No matching technologies.</span>
                            )}
                          </div>
                          <div className="mb-2">
                            <b>Missing Technologies:</b>
                            {Array.isArray(parsed.technical_fit.missing_technologies) && parsed.technical_fit.missing_technologies.length > 0 ? (
                              <ul className="list-disc ml-6 space-y-1 text-red-700">
                                {parsed.technical_fit.missing_technologies.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                              </ul>
                            ) : (
                              <span className="text-gray-500 ml-2">No missing technologies.</span>
                            )}
                          </div>
                          <div>
                            <b>Additional Technologies:</b>
                            {Array.isArray(parsed.technical_fit.additional_technologies) && parsed.technical_fit.additional_technologies.length > 0 ? (
                              <ul className="list-disc ml-6 space-y-1 text-blue-700">
                                {parsed.technical_fit.additional_technologies.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                              </ul>
                            ) : (
                              <span className="text-gray-500 ml-2">No additional technologies.</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {parsed.recommendations && (
                        <div className="bg-white rounded-xl shadow-lg p-8 border-l-8 border-red-500">
                          <h2 className="text-2xl font-bold text-red-700 mb-4 flex items-center gap-2">
                            <Lightbulb className="w-6 h-6 text-red-400 mr-2" /> Recommendations
                          </h2>
                          <div className="mb-2">
                            <b>Interview Focus:</b>
                            {Array.isArray(parsed.recommendations.interview_focus) && parsed.recommendations.interview_focus.length > 0 ? (
                              <ul className="list-disc ml-6 space-y-1 text-blue-700">
                                {parsed.recommendations.interview_focus.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                              </ul>
                            ) : (
                              <span className="text-gray-500 ml-2">No interview focus areas.</span>
                            )}
                          </div>
                          <div className="mb-2">
                            <b>Development Areas:</b>
                            {Array.isArray(parsed.recommendations.development_areas) && parsed.recommendations.development_areas.length > 0 ? (
                              <ul className="list-disc ml-6 space-y-1 text-yellow-700">
                                {parsed.recommendations.development_areas.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                              </ul>
                            ) : (
                              <span className="text-gray-500 ml-2">No development areas.</span>
                            )}
                          </div>
                          <div>
                            <b>Risk Factors:</b>
                            {Array.isArray(parsed.recommendations.risk_factors) && parsed.recommendations.risk_factors.length > 0 ? (
                              <ul className="list-disc ml-6 space-y-1 text-red-700">
                                {parsed.recommendations.risk_factors.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                              </ul>
                            ) : (
                              <span className="text-gray-500 ml-2">No risk factors.</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Interview Questions */}
                      {parsed.interview_questions && (
                        <div className="bg-white rounded-xl shadow-lg p-8 border-l-8 border-blue-400">
                          <h2 className="text-2xl font-bold text-blue-700 mb-4 flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-blue-400 mr-2" /> Interview Questions
                          </h2>
                          {Array.isArray(parsed.interview_questions) && parsed.interview_questions.length > 0 ? (
                            <div className="space-y-4">
                              {parsed.interview_questions.map((q: any, idx: number) => (
                                <div key={idx} className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                  <div className="font-semibold text-blue-900">Q{idx + 1}: {q.question}</div>
                                  <div className="text-gray-700 text-sm mt-1">Purpose: {q.purpose}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500">No interview questions provided.</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          <div className="max-w-4xl mx-auto mt-10">
            {showChatbot && analysisResults && (
              <ChatInterface
                resumeId={currentFileId || ''}
                initialContext={resumeText}
                candidateName={analysisResults?.candidate?.name || ''}
                overallScore={analysisResults?.overall_match?.score || 0}
                candidateAnalysis={analysisResults}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Resume;