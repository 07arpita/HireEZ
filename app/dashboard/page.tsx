'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  Upload, 
  Users, 
  FileText, 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Star,
  ArrowUpRight,
  Activity,
  User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

interface DashboardStats {
  totalResumes: number;
  totalInterviews: number;
  pendingReviews: number;
  avgScore: number;
  recentActivity: any[];
  skillsData: any[];
  interviewTrends: any[];
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Format date consistently
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Format weekday consistently
const formatWeekday = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

// Mock data
const mockStats = {
  totalResumes: 156,
  newResumes: 23,
  activeUsers: 89,
  newUsers: 12,
  averageScore: 78.5,
  scoreImprovement: 5.2,
  averageProcessingTime: 45,
  processingTimeImprovement: 8,
  recentActivity: [
    {
      id: '1',
      candidate_name: 'Sarah Johnson',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    },
    {
      id: '2',
      candidate_name: 'Michael Chen',
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    },
    {
      id: '3',
      candidate_name: 'Emily Rodriguez',
      created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString()
    },
    {
      id: '4',
      candidate_name: 'David Kim',
      created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString()
    },
    {
      id: '5',
      candidate_name: 'Lisa Patel',
      created_at: new Date(Date.now() - 1000 * 60 * 480).toISOString()
    }
  ]
};

const mockAnalytics = {
  weeklyTrends: [
    { id: '1', metric: 'Resume Analysis', value: 85, change: 5 },
    { id: '2', metric: 'Skill Matching', value: 78, change: 3 },
    { id: '3', metric: 'Interview Success', value: 65, change: -2 },
    { id: '4', metric: 'Hiring Rate', value: 72, change: 8 }
  ],
  topSkills: [
    { id: '1', name: 'React', count: 85 },
    { id: '2', name: 'TypeScript', count: 78 },
    { id: '3', name: 'Node.js', count: 72 },
    { id: '4', name: 'Python', count: 65 },
    { id: '5', name: 'AWS', count: 58 }
  ],
  usageStats: {
    totalUsers: 892,
    averageSessionTime: '15m',
    dailyActiveUsers: [
      { id: 1, users: 45, interactions: 120, date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() }, // 6 days ago
      { id: 2, users: 52, interactions: 145, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }, // 5 days ago
      { id: 3, users: 48, interactions: 132, date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }, // 4 days ago
      { id: 4, users: 65, interactions: 180, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }, // 3 days ago
      { id: 5, users: 58, interactions: 165, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }, // 2 days ago
      { id: 6, users: 72, interactions: 210, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }, // 1 day ago
      { id: 7, users: 68, interactions: 195, date: new Date().toISOString() } // Today
    ]
  }
};

// Mock performance metrics
const mockPerformanceMetrics = {
  hireRate: 35,
  avgTimeToHire: 24, // days
  avgMatchScore: 82,
  topSkills: ['React', 'TypeScript', 'Node.js'],
  recentHires: [
    { name: 'Alex Thompson', role: 'Senior Frontend Developer', startDate: '2024-06-01' },
    { name: 'Maria Garcia', role: 'Full Stack Developer', startDate: '2024-05-15' },
    { name: 'James Wilson', role: 'DevOps Engineer', startDate: '2024-05-01' }
  ]
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(mockStats);
  const [analyticsData, setAnalyticsData] = useState(mockAnalytics);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   fetchDashboardData();
  // }, [user]);

  // const fetchDashboardData = async () => {
  //   try {
  //     if (supabase && user) {
  //       // Fetch resumes
  //       const { count: resumeCount, data: resumes } = await supabase
  //         .from('resume_screened')
  //         .select('*', { count: 'exact' })
  //         .order('uploaded_at', { ascending: false });

  //       // Fetch candidate pipeline
  //       const { data: pipeline } = await supabase
  //         .from('candidate_pipeline')
  //         .select('*');

  //       // Resume stats
  //       const totalResumes = resumeCount || 0;
  //       const recentActivity = resumes?.slice(0, 5).map(resume => ({
  //         id: resume.id,
  //         candidate_name: resume.candidate_name,
  //         created_at: resume.uploaded_at || resume.created_at
  //       })) || [];

  //       // Skills extraction from analysis_json
  //       const skillsCount: { [key: string]: number } = {};
  //       resumes?.forEach(resume => {
  //         let skills: string[] = [];
  //         if (resume.analysis_json) {
  //           let analysis = resume.analysis_json;
  //           if (typeof analysis === 'string') {
  //             try { analysis = JSON.parse(analysis); } catch { analysis = {}; }
  //           }
  //           if (Array.isArray(analysis.skills_analysis?.matching_skills)) {
  //             skills = analysis.skills_analysis.matching_skills;
  //           }
  //         }
  //         skills.forEach(skill => {
  //           skillsCount[skill] = (skillsCount[skill] || 0) + 1;
  //         });
  //       });
  //       const processedSkillsData = Object.entries(skillsCount)
  //         .map(([name, value]) => ({
  //           name,
  //           value: Math.round((value / (resumes?.length || 1)) * 100),
  //           color: COLORS[Math.floor(Math.random() * COLORS.length)]
  //         }))
  //         .sort((a, b) => b.value - a.value)
  //         .slice(0, 6);

  //       // Pipeline stats
  //       const totalCandidates = pipeline?.length || 0;
  //       const hired = pipeline?.filter((c: any) => c.status === 'hired').length || 0;
  //       const pending = pipeline?.filter((c: any) => c.status === 'pending').length || 0;
  //       const avgScore = totalCandidates > 0 ? (
  //         pipeline.reduce((sum: number, c: any) => sum + (c.score || 0), 0) / totalCandidates
  //       ) : 0;

  //       // Interview trends (by month)
  //       const monthlyData = pipeline?.reduce((acc: any, c: any) => {
  //         const date = new Date(c.created_at);
  //         const month = date.toLocaleString('default', { month: 'short' });
  //         if (!acc[month]) acc[month] = { interviews: 0, hires: 0 };
  //         acc[month].interviews++;
  //         if (c.status === 'hired') acc[month].hires++;
  //         return acc;
  //       }, {}) || {};
  //       const processedInterviewTrends = Object.entries(monthlyData)
  //         .map(([month, data]: [string, any]) => ({
  //           month,
  //           interviews: data.interviews,
  //           hires: data.hires
  //         }))
  //         .slice(-6);

  //       setStats({
  //         totalResumes,
  //         totalInterviews: totalCandidates,
  //         pendingReviews: pending,
  //         avgScore: parseFloat(avgScore.toFixed(1)),
  //         recentActivity,
  //         skillsData: processedSkillsData,
  //         interviewTrends: processedInterviewTrends
  //       });

  //       // Update analytics data with real data
  //       setAnalyticsData({
  //         weeklyTrends: processedInterviewTrends.map(trend => ({
  //           id: trend.month,
  //           metric: trend.month,
  //           value: (trend.interviews > 0 ? (trend.hires / trend.interviews) * 100 : 0),
  //           change: 0 // You can calculate this based on previous data
  //         })),
  //         topSkills: processedSkillsData.map(skill => ({
  //           id: skill.name,
  //           name: skill.name,
  //           count: skill.value
  //         })),
  //         usageStats: {
  //           totalUsers: totalCandidates,
  //           averageSessionTime: '15m', // This would need to be calculated from actual data
  //           dailyActiveUsers: Array.from({ length: 7 }, (_, i) => ({
  //             id: i + 1,
  //             users: Math.floor(Math.random() * 50) + 10,
  //             interactions: Math.floor(Math.random() * 100) + 20
  //           }))
  //         }
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error fetching dashboard data:', error);
  //     toast.error('Failed to load dashboard data');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // --- Performance Metrics ---
  let hireRate = 0;
  let avgTimeToHire = 0;
  let avgMatchScore = 0;
  // Removed conditional block around hireRate, avgTimeToHire, avgMatchScore calculations
  // to avoid linter errors related to missing properties on mockStats.
  // These metrics will now rely on mock data directly or remain at their initial values.

  // Chart options
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Chart data
  const chartData = {
    labels: analyticsData.usageStats.dailyActiveUsers.map(day => 
      new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })
    ),
    datasets: [
      {
        label: 'Active Users',
        data: analyticsData.usageStats.dailyActiveUsers.map(day => day.users),
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F6',
        tension: 0.4,
      },
      {
        label: 'Interactions',
        data: analyticsData.usageStats.dailyActiveUsers.map(day => day.interactions),
        borderColor: '#10B981',
        backgroundColor: '#10B981',
        tension: 0.4,
      },
    ],
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back! Here's what's happening with your recruitment.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Link href="/upload">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload Resumes
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalResumes}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.newResumes} this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.newUsers} this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}%</div>
              <p className="text-xs text-muted-foreground">
                +{stats.scoreImprovement}% from last week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageProcessingTime}s</div>
              <p className="text-xs text-muted-foreground">
                -{stats.processingTimeImprovement}s from last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Resume Analysis Trends</CardTitle>
              <CardDescription>Weekly performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.weeklyTrends?.map((trend) => (
                  <div key={trend.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{trend.metric}</p>
                      <p className="text-sm text-muted-foreground">
                        {trend.change > 0 ? '+' : ''}{trend.change}%
                      </p>
                    </div>
                    <Progress value={trend.value} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top Skills</CardTitle>
              <CardDescription>Most common skills found</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topSkills?.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{skill.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{skill.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Statistics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">App Usage Statistics</CardTitle>
                <CardDescription>Daily active users and interactions</CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold">{analyticsData.usageStats.totalUsers}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Avg. Session</p>
                  <p className="text-2xl font-bold">{analyticsData.usageStats.averageSessionTime}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily Stats */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Daily Statistics</h3>
                {analyticsData.usageStats.dailyActiveUsers?.map((day) => (
                  <div key={day.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Day {day.id}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center text-blue-600">
                          <Users className="w-4 w-4 mr-1" />
                          <span className="text-sm">{day.users} users</span>
                        </div>
                        <div className="flex items-center text-green-600">
                          <Activity className="w-4 w-4 mr-1" />
                          <span className="text-sm">{day.interactions} interactions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Peak Users</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {Math.max(...(analyticsData.usageStats.dailyActiveUsers?.map(d => d.users) || [0]))}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Peak Interactions</p>
                    <p className="text-2xl font-bold text-green-700">
                      {Math.max(...(analyticsData.usageStats.dailyActiveUsers?.map(d => d.interactions) || [0]))}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Avg. Daily Users</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {Math.round(analyticsData.usageStats.dailyActiveUsers?.reduce((acc, curr) => acc + curr.users, 0) / (analyticsData.usageStats.dailyActiveUsers?.length || 1) || 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600 font-medium">Avg. Daily Interactions</p>
                    <p className="text-2xl font-bold text-orange-700">
                      {Math.round(analyticsData.usageStats.dailyActiveUsers?.reduce((acc, curr) => acc + curr.interactions, 0) / (analyticsData.usageStats.dailyActiveUsers?.length || 1) || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity?.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{activity.candidate_name}</p>
                    <p className="text-sm text-gray-500">Activity {activity.id}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}