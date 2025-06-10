'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Send, 
  CheckCircle, 
  ArrowRight,
  Building,
  Mail,
  Phone,
  User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { mockSendInterviewInvitation } from '@/lib/email';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  isRequired: boolean;
  options: string[];
}

interface FormData {
  title: string;
  description: string;
  fields: FormField[];
}

export default function ApplicationFormPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState<{ [key: string]: string | string[] }>({});
  const [formFields, setFormFields] = useState<any[]>([]);
  const [resumeFiles, setResumeFiles] = useState<{ [key: string]: File | null }>({});

  // Mock fields for the first page/step
  const mockFirstPageFields = [
    {
      id: 'mock-full-name',
      field_type: 'text',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      is_required: true,
      options: [],
      order_index: 0
    },
    {
      id: 'mock-email',
      field_type: 'email',
      label: 'Email Address',
      placeholder: 'your.email@example.com',
      is_required: true,
      options: [],
      order_index: 1
    },
    {
      id: 'mock-phone',
      field_type: 'phone',
      label: 'Phone Number',
      placeholder: '(555) 123-4567',
      is_required: false,
      options: [],
      order_index: 2
    }
  ];

  useEffect(() => {
    fetchForm();
  }, [params.slug]);

  const fetchForm = async () => {
    if (!supabase) {
      toast.error('Supabase client not initialized');
      setLoading(false);
      return;
    }
    try {
      // Fetch form by slug
      console.log('Fetching form by slug:', params.slug);
      const { data: forms, error: formError } = await supabase
        .from('custom_forms')
        .select('id, title, description, is_active')
        .eq('slug', params.slug)
        .limit(1);
      if (formError || !forms || !forms.length) {
        toast.error('Form not found');
        setLoading(false);
        return;
      }
      const form = forms[0];
      if (!form.is_active) {
        console.log('Form is inactive:', form);
        setFormData(null);
        setLoading(false);
        return;
      }
      setFormData({ title: form.title ?? '', description: form.description ?? '', fields: [] });
      // Fetch real fields for this form
      console.log('Fetching fields for formId:', form.id);
      const { data: realFields, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_id', form.id)
        .order('order_index', { ascending: true });
      if (fieldsError || !realFields) {
        toast.error('Failed to fetch form fields');
        setLoading(false);
        return;
      }
      setFormFields(realFields);
      // Initialize responses with empty values for each field
      const initialResponses: { [key: string]: string | string[] } = {};
      mockFirstPageFields.forEach(field => {
        initialResponses[field.id] = '';
      });
      realFields.forEach(field => {
        initialResponses[field.id] = '';
      });
      setResponses(initialResponses);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching form:', error);
      toast.error('Failed to load application form');
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: string | string[]) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
    console.log('Updated responses:', { ...responses, [fieldId]: value });
  };

  const handleFileChange = (fieldId: string, file: File | null) => {
    setResumeFiles(prev => ({ ...prev, [fieldId]: file }));
    setResponses(prev => ({ ...prev, [fieldId]: file ? file.name : '' }));
  };

  const handleSubmit = async () => {
    if (!allFields.length) return;
    if (!supabase) {
      toast.error('Supabase client not initialized');
      return;
    }
    // Validate all required fields in allFields
    const requiredFields = allFields.filter(field => field.is_required);
    const missingFields = requiredFields.filter(field => {
      if (field.field_type === 'file') {
        return !resumeFiles[field.id];
      }
      return !responses[field.id] || responses[field.id] === '';
    });
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      // Fetch the form by slug to get the form id
      const { data: forms, error: formError } = await supabase
        .from('custom_forms')
        .select('id')
        .eq('slug', params.slug)
        .limit(1);
      if (formError || !forms || !forms.length) {
        toast.error('Form not found');
        setSubmitting(false);
        return;
      }
      const formId = forms[0].id;
      // Upload resume files and get URLs
      let fileResponses: { [key: string]: string } = {};
      for (const field of formFields) {
        if (field.field_type === 'file' && resumeFiles[field.id]) {
          const file = resumeFiles[field.id];
          if (!file) continue; // skip if null
          const fileExt = file.name.split('.').pop();
          const filePath = `resumes/${formId}/${Date.now()}_${file.name}`;
          const { data, error } = await supabase.storage.from('resumes').upload(filePath, file);
          if (error) {
            toast.error('Failed to upload resume file');
            setSubmitting(false);
            return;
          }
          const { data: publicUrlData } = supabase.storage.from('resumes').getPublicUrl(filePath);
          fileResponses[field.id] = publicUrlData.publicUrl;
        }
      }
      // Insert into form_submissions, using mock field responses for name/email/phone
      const { data: submissionRows, error: submissionError } = await supabase
        .from('form_submissions')
        .insert({
          form_id: formId,
          candidate_email: responses['mock-email'] || '',
          candidate_name: responses['mock-full-name'] || '',
          status: 'new',
          submitted_at: new Date().toISOString(),
          ip_address: '',
          user_agent: ''
        })
        .select();
      if (submissionError || !submissionRows || !submissionRows.length) {
        toast.error('Failed to submit application');
        setSubmitting(false);
        return;
      }
      const submissionId = submissionRows[0].id;
      // Build fieldResponses using real field IDs (skip mock fields)
      const fieldResponses = formFields.map(field => {
        let value = '';
        if (field.field_type === 'file') {
          value = fileResponses[field.id] || '';
        } else {
          value = Array.isArray(responses[field.id]) ? (responses[field.id] as string[]).join(', ') : (responses[field.id] as string || '');
        }
        return {
          submission_id: submissionId,
          field_id: field.id,
          response_value: value
        };
      });
      const { error: fieldRespError } = await supabase
        .from('form_field_responses')
        .insert(fieldResponses);
      if (fieldRespError) {
        toast.error('Failed to save field responses');
        setSubmitting(false);
        return;
      }
      // After successful save, send email to candidate
      const candidateEmail = Array.isArray(responses['mock-email']) ? responses['mock-email'].join(', ') : (responses['mock-email'] || '');
      const candidateName = Array.isArray(responses['mock-full-name']) ? responses['mock-full-name'].join(', ') : (responses['mock-full-name'] || '');
      if (candidateEmail) {
        await mockSendInterviewInvitation(
          candidateEmail,
          candidateName,
          '',
          '',
          'From: Hire EZ Team'
        );
      }
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: any) => {
    const commonProps = {
      id: field.id,
      required: field.is_required,
      className: "w-full"
    };
    switch (field.field_type) {
      case 'text':
        return (
          <Input
            {...commonProps}
            type="text"
            placeholder={field.placeholder}
            value={responses[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );
      case 'email':
        return (
          <Input
            {...commonProps}
            type="email"
            placeholder={field.placeholder}
            value={responses[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );
      case 'phone':
        return (
          <Input
            {...commonProps}
            type="tel"
            placeholder={field.placeholder}
            value={responses[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            placeholder={field.placeholder}
            value={responses[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            rows={4}
          />
        );
      case 'select':
        return (
          <select
            {...commonProps}
            value={responses[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{field.placeholder}</option>
            {Array.isArray(field.options) && field.options.map((option: string, index: number) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'checkbox':
        const selectedOptions = (responses[field.id] as string[]) || [];
        return (
          <div className="space-y-3">
            {Array.isArray(field.options) && field.options.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${index}`}
                  checked={selectedOptions.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleInputChange(field.id, [...selectedOptions, option]);
                    } else {
                      handleInputChange(field.id, selectedOptions.filter(o => o !== option));
                    }
                  }}
                />
                <Label htmlFor={`${field.id}-${index}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );
      case 'file':
        return (
          <Input
            {...commonProps}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={e => handleFileChange(field.id, e.target.files?.[0] || null)}
          />
        );
      default:
        return null;
    }
  };

  // Filter out Supabase fields that duplicate mock fields by label
  const mockLabels = mockFirstPageFields.map(f => f.label.toLowerCase().trim());
  const allFields = [
    ...mockFirstPageFields,
    ...formFields.filter(f => !mockLabels.includes(f.label.toLowerCase().trim()))
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Form Not Found</h1>
            <p className="text-gray-600">The application form you're looking for doesn't exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 border-0 shadow-xl">
          <CardContent className="pt-8 text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Application Submitted!
              </h1>
              <p className="text-gray-600">
                Thank you for your interest. We'll review your application and get back to you soon.
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2 text-blue-800">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">What happens next?</span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• Your application will be reviewed by our team</li>
                <li>• We'll contact you within 3-5 business days</li>
                <li>• Check your email for updates and next steps</li>
              </ul>
            </div>
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
            {formData?.title}
          </h1>
          <p className="text-gray-600 mt-2">
            {formData?.description}
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
          <CardContent className="p-8">
            <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
              <div className="space-y-6">
                {allFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id} className="text-base font-medium">
                      {field.label}
                      {field.is_required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {renderField(field)}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-8 border-t mt-8">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {submitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      Submit Application
                      <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Powered by Hire EZ - Secure and confidential</p>
        </div>
      </div>
    </div>
  );
}