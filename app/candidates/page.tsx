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
  Filter, 
  Eye, 
  MessageSquare, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  TrendingUp,
  FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  current_role: string;
  experience_years: number;
  skills: string[];
  education: string;
  status: string;
  score: number;
  applied_date: string;
  last_interaction: string;
  job_title: string;
}

const CANDIDATE_STATUSES = [
  'New',
  'Screening',
  'Interview',
  'Offer',
  'Hired',
  'Rejected'
];

const STATUS_COLORS: { [key: string]: string } = {
  'New': 'bg-blue-100 text-blue-800',
  'Screening': 'bg-yellow-100 text-yellow-800',
  'Interview': 'bg-purple-100 text-purple-800',
  'Offer': 'bg-green-100 text-green-800',
  'Hired': 'bg-green-100 text-green-800',
  'Rejected': 'bg-red-100 text-red-800'
};

type Status = {
  status: string;
};

export default function CandidatesPage() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);

  useEffect(() => {
    if (user) {
      fetchStatuses();
      fetchCandidates();
    }
  }, [user]);

  const fetchStatuses = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('candidate_status').select('*');
    setStatuses((data as Status[]) || []);
  };

  const fetchCandidates = async () => {
    if (!supabase) return;
    setLoading(true);
    console.log('Fetching candidates from Supabase...');
    try {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (error) {
        console.error('Error fetching candidates:', error);
        toast.error('Failed to load candidates');
        setCandidates([]);
        setLoading(false);
        return;
      }
      setCandidates(data || []);
      console.log('Fetched candidates:', data);
    } catch (error) {
      console.error('Error in fetchCandidates:', error);
      toast.error('Failed to load candidates');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!supabase) return;
    await supabase.from('form_submissions').update({ status: newStatus }).eq('id', id);
    fetchCandidates();
  };

  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-green-600';
    if (score >= 7.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = 
      (candidate.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (candidate.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (candidate.current_role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (candidate.skills || []).some(skill => (skill || '').toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || candidate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: candidates.length,
    new: candidates.filter(c => c.status === 'New').length,
    interview: candidates.filter(c => c.status === 'Interview').length,
    hired: candidates.filter(c => c.status === 'Hired').length
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Candidate Pipeline</h1>
            <p className="text-gray-600 mt-1">
              Track and manage your candidate applications
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                In pipeline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">In Interview</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.interview}</div>
              <p className="text-xs text-muted-foreground">
                Active interviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hired</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.hired}</div>
              <p className="text-xs text-muted-foreground">
                Successful hires
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle>Candidate Database</CardTitle>
                <CardDescription>
                  Review and manage candidate applications
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search candidates..."
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
                  <option value="All">All Status</option>
                  {CANDIDATE_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredCandidates.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell>{candidate.name || 'Unknown'}</TableCell>
                        <TableCell>{candidate.email || 'No email'}</TableCell>
                        <TableCell>
                          <select
                            value={candidate.status}
                            onChange={(e) => handleStatusChange(candidate.id, e.target.value)}
                            className={`px-2 py-1 rounded text-xs font-medium border-0 ${STATUS_COLORS[candidate.status] || ''}`}
                          >
                            {statuses.map(status => (
                              <option key={status.status} value={status.status}>
                                {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            Screen Resume
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'All' 
                    ? 'No candidates match your search criteria.' 
                    : 'No candidates have applied yet.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}