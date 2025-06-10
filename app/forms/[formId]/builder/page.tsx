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
import { Checkbox } from '@/components/ui/checkbox';
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
  Trash2, 
  GripVertical, 
  Type, 
  Mail, 
  Phone, 
  FileText, 
  List, 
  CheckSquare,
  Calendar,
  ArrowLeft,
  Save,
  Eye,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  isRequired: boolean;
  options: string[];
  order: number;
}

const FIELD_TYPES = [
  { type: 'text', label: 'Text Input', icon: Type },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'textarea', label: 'Long Text', icon: FileText },
  { type: 'select', label: 'Dropdown', icon: List },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'date', label: 'Date', icon: Calendar }
];

export default function FormBuilderPage({ params }: { params: { formId: string } }) {
  const { user } = useAuth();
  const [formTitle, setFormTitle] = useState('Software Engineer Application');
  const [formDescription, setFormDescription] = useState('Application form for software engineering positions');
  const [fields, setFields] = useState<FormField[]>([
    {
      id: '1',
      type: 'text',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      isRequired: true,
      options: [],
      order: 0
    },
    {
      id: '2',
      type: 'email',
      label: 'Email Address',
      placeholder: 'your.email@example.com',
      isRequired: true,
      options: [],
      order: 1
    }
  ]);
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [newField, setNewField] = useState({
    type: 'text',
    label: '',
    placeholder: '',
    isRequired: false,
    options: ['']
  });

  // Fetch form and fields from Supabase on load
  useEffect(() => {
    const fetchFormAndFields = async () => {
      if (!supabase) return;
      console.log('Fetching form and fields for formId:', params.formId);
      const { data: form, error: formError } = await supabase
        .from('custom_forms')
        .select('title, description')
        .eq('id', params.formId)
        .single();
      if (formError) {
        console.error('Error fetching form:', formError);
        toast.error('Failed to load form');
        return;
      }
      setFormTitle(form.title);
      setFormDescription(form.description);
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_id', params.formId)
        .order('order_index', { ascending: true });
      if (fieldsError) {
        console.error('Error fetching fields:', fieldsError);
        toast.error('Failed to load fields');
        return;
      }
      // Ensure Resume file upload field exists and is required
      let hasResume = fieldsData.some(f => f.label.toLowerCase().trim() === 'resume' && f.field_type === 'file');
      let updatedFields = fieldsData.map(f => ({
        id: f.id,
        type: f.field_type,
        label: f.label,
        placeholder: f.placeholder,
        isRequired: f.is_required,
        options: Array.isArray(f.options) ? f.options : [],
        order: f.order_index
      }));
      if (!hasResume) {
        const resumeField = {
          id: crypto.randomUUID(),
          form_id: params.formId,
          field_type: 'file',
          label: 'Resume',
          placeholder: 'Upload your resume',
          is_required: true,
          options: [],
          validation_rules: {},
          order_index: 2
        };
        // Persist the Resume field to Supabase
        await supabase.from('form_fields').upsert([resumeField], { onConflict: ['id'] });
        updatedFields.splice(2, 0, {
          id: resumeField.id,
          type: 'file',
          label: 'Resume',
          placeholder: 'Upload your resume',
          isRequired: true,
          options: [],
          order: 2
        });
      }
      setFields(updatedFields);
      console.log('Loaded fields:', updatedFields);
    };
    fetchFormAndFields();
  }, [params.formId]);

  const addField = (fieldType: string) => {
    const field: FormField = {
      id: Date.now().toString(),
      type: fieldType,
      label: '',
      placeholder: '',
      isRequired: false,
      options: fieldType === 'select' || fieldType === 'checkbox' ? [''] : [],
      order: fields.length
    };
    setEditingField(field);
    setNewField({
      type: fieldType,
      label: '',
      placeholder: '',
      isRequired: false,
      options: fieldType === 'select' || fieldType === 'checkbox' ? [''] : []
    });
    setShowAddFieldDialog(true);
  };

  const saveField = async () => {
    if (!newField.label.trim()) {
      toast.error('Please enter a field label');
      return;
    }
    if (!supabase) return;
    let fieldId = editingField?.id;
    // If adding a new field, generate a new UUID
    if (!fieldId || fieldId.length !== 36) {
      fieldId = crypto.randomUUID();
    }
    const upsertField = {
      id: fieldId,
      form_id: params.formId,
      field_type: newField.type,
      label: newField.label,
      placeholder: newField.placeholder,
      is_required: newField.isRequired,
      options: newField.options.filter(opt => opt.trim()),
      validation_rules: {},
      order_index: fields.length // always add to end
    };
    console.log('Upserting field:', upsertField);
    const { error: upsertError } = await supabase
      .from('form_fields')
      .upsert([upsertField], { onConflict: ['id'] });
    if (upsertError) {
      console.error('Error upserting field:', upsertError);
      toast.error('Failed to save field');
      return;
    }
    setShowAddFieldDialog(false);
    setEditingField(null);
    setNewField({
      type: 'text',
      label: '',
      placeholder: '',
      isRequired: false,
      options: ['']
    });
    toast.success('Field saved successfully!');
    // Always re-fetch fields after save
    const { data: fieldsData, error: fieldsError } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', params.formId)
      .order('order_index', { ascending: true });
    if (fieldsError) {
      console.error('Error fetching fields after save:', fieldsError);
      toast.error('Failed to refresh fields');
      return;
    }
    setFields(fieldsData.map(f => ({
      id: f.id,
      type: f.field_type,
      label: f.label,
      placeholder: f.placeholder,
      isRequired: f.is_required,
      options: Array.isArray(f.options) ? f.options : [],
      order: f.order_index
    })));
    console.log('Refetched fields after field save:', fieldsData);
  };

  const editField = (field: FormField) => {
    setEditingField(field);
    setNewField({
      type: field.type,
      label: field.label,
      placeholder: field.placeholder,
      isRequired: field.isRequired,
      options: field.options.length > 0 ? field.options : ['']
    });
    setShowAddFieldDialog(true);
  };

  const deleteField = (fieldId: string) => {
    setFields(prev => prev.filter(field => field.id !== fieldId));
    toast.success('Field deleted successfully!');
  };

  const addOption = () => {
    setNewField(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const updateOption = (index: number, value: string) => {
    setNewField(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeOption = (index: number) => {
    setNewField(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  // Save form and fields to Supabase
  const saveForm = async () => {
    if (!supabase) return;
    // Update form title/description
    console.log('Saving form:', { title: formTitle, description: formDescription });
    const { error: formError } = await supabase
      .from('custom_forms')
      .update({ title: formTitle, description: formDescription })
      .eq('id', params.formId);
    if (formError) {
      console.error('Error updating form:', formError);
      toast.error('Failed to update form');
      return;
    }
    // Upsert fields
    const upsertFields = fields.map((f, idx) => ({
      id: f.id.length === 36 ? f.id : undefined, // Only send id if it's a real UUID
      form_id: params.formId,
      field_type: f.type,
      label: f.label,
      placeholder: f.placeholder,
      is_required: f.isRequired,
      options: f.options,
      validation_rules: {},
      order_index: idx
    }));
    console.log('Upserting fields:', upsertFields);
    const { error: fieldsError } = await supabase
      .from('form_fields')
      .upsert(upsertFields, { onConflict: ['id'] });
    if (fieldsError) {
      console.error('Error upserting fields:', fieldsError);
      toast.error('Failed to save fields');
      return;
    }
    toast.success('Form saved successfully!');
    // Optionally, refetch fields to ensure UI is in sync
    const { data: fieldsData } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', params.formId)
      .order('order_index', { ascending: true });
    setFields(fieldsData.map(f => ({
      id: f.id,
      type: f.field_type,
      label: f.label,
      placeholder: f.placeholder,
      isRequired: f.is_required,
      options: Array.isArray(f.options) ? f.options : [],
      order: f.order_index
    })));
    console.log('Refetched fields after save:', fieldsData);
  };

  const renderFieldPreview = (field: FormField) => {
    const commonProps = {
      placeholder: field.placeholder,
      required: field.isRequired,
      className: "w-full"
    };

    switch (field.type) {
      case 'text':
        return <Input {...commonProps} />;
      case 'email':
        return <Input type="email" {...commonProps} />;
      case 'phone':
        return <Input type="tel" {...commonProps} />;
      case 'textarea':
        return <Textarea {...commonProps} rows={3} />;
      case 'select':
        return (
          <select {...commonProps} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">Select an option</option>
            {field.options.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox id={`${field.id}-${index}`} />
                <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      case 'date':
        return <Input type="date" {...commonProps} />;
      default:
        return <Input {...commonProps} />;
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Form Builder</h1>
              <p className="text-gray-600">Design your custom application form</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button 
              onClick={saveForm}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Form
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Builder */}
          <div className="lg:col-span-2 space-y-6">
            {/* Form Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Form Settings</CardTitle>
                <CardDescription>Basic information about your form</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="formTitle">Form Title</Label>
                  <Input
                    id="formTitle"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Enter form title"
                  />
                </div>
                <div>
                  <Label htmlFor="formDescription">Description</Label>
                  <Textarea
                    id="formDescription"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description of the form"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Form Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Form Fields</CardTitle>
                <CardDescription>Add and configure form fields</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{field.label || 'Untitled Field'}</span>
                          {field.isRequired && (
                            <Badge variant="secondary" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => editField(field)}
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => deleteField(field.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-600">
                          {field.label}
                          {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <div className="mt-1">
                          {renderFieldPreview(field)}
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button 
                    variant="outline" 
                    className="w-full border-dashed"
                    onClick={() => setShowAddFieldDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Field Types Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Field Types</CardTitle>
                <CardDescription>Click to add a field to your form</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {FIELD_TYPES.map((fieldType) => {
                    const Icon = fieldType.icon;
                    return (
                      <Button
                        key={fieldType.type}
                        variant="outline"
                        className="justify-start h-auto p-3"
                        onClick={() => addField(fieldType.type)}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {fieldType.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Form Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total Fields</span>
                  <span className="font-medium">{fields.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Required Fields</span>
                  <span className="font-medium">{fields.filter(f => f.isRequired).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Optional Fields</span>
                  <span className="font-medium">{fields.filter(f => !f.isRequired).length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add/Edit Field Dialog */}
        <Dialog open={showAddFieldDialog} onOpenChange={setShowAddFieldDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingField?.id === 'new' || !editingField ? 'Add Field' : 'Edit Field'}
              </DialogTitle>
              <DialogDescription>
                Configure the field properties
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="fieldLabel">Field Label *</Label>
                <Input
                  id="fieldLabel"
                  value={newField.label}
                  onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Enter field label"
                />
              </div>

              <div>
                <Label htmlFor="fieldPlaceholder">Placeholder Text</Label>
                <Input
                  id="fieldPlaceholder"
                  value={newField.placeholder}
                  onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                  placeholder="Enter placeholder text"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fieldRequired"
                  checked={newField.isRequired}
                  onCheckedChange={(checked) => 
                    setNewField(prev => ({ ...prev, isRequired: checked as boolean }))
                  }
                />
                <Label htmlFor="fieldRequired">Required field</Label>
              </div>

              {(newField.type === 'select' || newField.type === 'checkbox') && (
                <div>
                  <Label>Options</Label>
                  <div className="space-y-2">
                    {newField.options.map((option, index) => (
                      <div key={index} className="flex space-x-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        {newField.options.length > 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeOption(index)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addOption}
                      className="w-full"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddFieldDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={saveField}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Save Field
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}