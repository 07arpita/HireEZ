'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Trash2, 
  Copy, 
  ExternalLink,
  FileText,
  Users,
  Calendar,
  TrendingUp,
  Settings,
  Link as LinkIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

interface CustomForm {
  id: string;
  title: string;
  description: string;
  slug: string;
  is_active: boolean;
  submissions_count: number;
  created_at: string;
}

export default function FormsPage() {
  const { user } = useAuth();
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      fetchForms();
    }
  }, [user]);

  const fetchForms = async () => {
    if (!supabase) return;
    setLoading(true);
    console.log('Fetching forms from Supabase...');
    try {
      const { data, error } = await supabase
        .from('custom_forms')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching forms:', error);
        toast.error('Failed to load forms');
        setForms([]);
        setLoading(false);
        return;
      }
      // For each form, fetch the count of submissions
      const formsWithCounts = await Promise.all(
        (data || []).map(async (form) => {
          const { count, error: countError } = await supabase
            .from('form_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('form_id', form.id);
          if (countError) {
            console.error('Error fetching submissions count for form:', form.id, countError);
            return { ...form, submissions_count: 0 };
          }
          return { ...form, submissions_count: count || 0 };
        })
      );
      console.log('Fetched forms with submission counts:', formsWithCounts);
      setForms(formsWithCounts);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Failed to load forms');
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleCreateForm = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a form title');
      return;
    }
    const slug = generateSlug(formData.title);
    try {
      const { data: formRows, error: formError } = await supabase
        .from('custom_forms')
        .insert({
          title: formData.title,
          description: formData.description,
          slug: slug,
          is_active: true,
          settings: {}
        })
        .select();
      if (formError || !formRows || !formRows.length) {
        toast.error(formError?.message || 'Failed to create form');
        return;
      }
      const newForm = formRows[0];
      // Add default fields to form_fields table, only one Resume field
      const defaultFields = [
        {
          form_id: newForm.id,
          field_type: 'text',
          label: 'Full Name',
          placeholder: 'Enter your full name',
          is_required: true,
          options: [],
          validation_rules: {},
          order_index: 0
        },
        {
          form_id: newForm.id,
          field_type: 'email',
          label: 'Email Address',
          placeholder: 'your.email@example.com',
          is_required: true,
          options: [],
          validation_rules: {},
          order_index: 1
        },
        {
          form_id: newForm.id,
          field_type: 'file',
          label: 'Resume',
          placeholder: 'Upload your resume',
          is_required: true,
          options: [],
          validation_rules: {},
          order_index: 2
        },
        {
          form_id: newForm.id,
          field_type: 'textarea',
          label: 'Why are you interested in this position?',
          placeholder: 'Tell us what excites you about this opportunity...',
          is_required: true,
          options: [],
          validation_rules: {},
          order_index: 3
        }
      ];
      await supabase.from('form_fields').insert(defaultFields);
      fetchForms();
      setShowCreateDialog(false);
      setFormData({ title: '', description: '' });
      toast.success('Form created successfully!');
    } catch (error) {
      toast.error('Failed to create form');
    }
  };

  const handleDeleteForm = async (formId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this form? This action cannot be undone.');
    if (!confirmed) return;
    console.log('Deleting form:', formId);
    try {
      const { error } = await supabase
        .from('custom_forms')
        .delete()
        .eq('id', formId);
      if (error) {
        console.error('Error deleting form:', error);
        toast.error('Failed to delete form');
        return;
      }
      setForms(prev => prev.filter(form => form.id !== formId));
      toast.success('Form deleted successfully!');
    } catch (error) {
      console.error('Error in handleDeleteForm:', error);
      toast.error('Failed to delete form');
    }
  };

  const toggleFormStatus = async (formId: string) => {
    // Find the form to get its current is_active value
    const form = forms.find(f => f.id === formId);
    if (!form) return;
    const newIsActive = !form.is_active;
    console.log(`Toggling form ${formId} active status to ${newIsActive}`);
    try {
      const { error } = await supabase
        .from('custom_forms')
        .update({ is_active: newIsActive })
        .eq('id', formId);
      if (error) {
        console.error('Error updating form status:', error);
        toast.error('Failed to update form status');
        return;
      }
      // Update local state
      setForms(prev => prev.map(f => f.id === formId ? { ...f, is_active: newIsActive } : f));
      toast.success('Form status updated!');
    } catch (error) {
      console.error('Error in toggleFormStatus:', error);
      toast.error('Failed to update form status');
    }
  };

  const copyFormLink = (slug: string) => {
    const link = `${window.location.origin}/apply/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success('Form link copied to clipboard!');
  };

  const filteredForms = forms.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalForms: forms.length,
    activeForms: forms.filter(f => f.is_active).length,
    totalSubmissions: forms.reduce((sum, form) => sum + (form.submissions_count || 0), 0),
    avgSubmissions: forms.length > 0 ? Math.round(forms.reduce((sum, form) => sum + (form.submissions_count || 0), 0) / forms.length) : 0
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Application Forms</h1>
            <p className="text-gray-600 mt-1">
              Create custom forms for candidate applications
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Create New Form
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Application Form</DialogTitle>
                <DialogDescription>
                  Set up a custom form for candidates to fill out
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Form Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Software Engineer Application"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of what this form is for..."
                    rows={3}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Form URL:</strong> /apply/{generateSlug(formData.title || 'your-form-title')}
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateForm}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Create Form
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalForms}</div>
              <p className="text-xs text-muted-foreground">
                Created forms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Forms</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeForms}</div>
              <p className="text-xs text-muted-foreground">
                Currently accepting applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
              <p className="text-xs text-muted-foreground">
                Applications received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. per Form</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgSubmissions}</div>
              <p className="text-xs text-muted-foreground">
                Average submissions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Forms Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle>Application Forms</CardTitle>
                <CardDescription>
                  Manage your custom application forms
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search forms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredForms.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submissions</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredForms.map((form) => (
                      <TableRow key={form.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{form.title}</div>
                            <div className="text-sm text-gray-500">{form.description}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              /apply/{form.slug}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={form.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {form.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{form.submissions_count}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {new Date(form.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyFormLink(form.slug)}
                              title="Copy form link"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            
                            <Link href={`/apply/${form.slug}`} target="_blank" style={{ pointerEvents: form.is_active ? 'auto' : 'none' }}>
                              <Button size="sm" variant="outline" title={form.is_active ? "Preview form" : "Form is inactive"} disabled={!form.is_active}>
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </Link>
                            
                            <Link href={`/forms/${form.id}/builder`}>
                              <Button size="sm" variant="outline" title="Edit form">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            
                            <Link href={`/forms/${form.id}/submissions`}>
                              <Button size="sm" variant="outline" title="View submissions">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => toggleFormStatus(form.id)}
                              title={form.is_active ? 'Deactivate form' : 'Activate form'}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteForm(form.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete form"
                            >
                              <Trash2 className="w-4 h-4" />
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'No forms match your search criteria.' : 'Create your first application form to start collecting candidate information.'}
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Form
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}