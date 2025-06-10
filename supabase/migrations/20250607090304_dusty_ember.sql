/*
  # Custom Forms Feature

  1. New Tables
    - `custom_forms` - Form templates created by recruiters
    - `form_fields` - Individual fields within forms
    - `form_submissions` - Candidate responses to forms
    - `form_field_responses` - Individual field responses
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated recruiters and public form access
    
  3. Features
    - Flexible form builder with various field types
    - Public form access via unique links
    - Response tracking and analytics
*/

-- Custom forms table
CREATE TABLE IF NOT EXISTS custom_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  slug text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Form fields table
CREATE TABLE IF NOT EXISTS form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES custom_forms(id) ON DELETE CASCADE,
  field_type text NOT NULL DEFAULT 'text',
  label text NOT NULL DEFAULT '',
  placeholder text DEFAULT '',
  is_required boolean DEFAULT false,
  options jsonb DEFAULT '[]'::jsonb,
  validation_rules jsonb DEFAULT '{}'::jsonb,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Form submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES custom_forms(id) ON DELETE CASCADE,
  candidate_email text NOT NULL DEFAULT '',
  candidate_name text DEFAULT '',
  status text DEFAULT 'new',
  submitted_at timestamptz DEFAULT now(),
  ip_address text DEFAULT '',
  user_agent text DEFAULT ''
);

-- Form field responses table
CREATE TABLE IF NOT EXISTS form_field_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES form_submissions(id) ON DELETE CASCADE,
  field_id uuid REFERENCES form_fields(id) ON DELETE CASCADE,
  response_value text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE custom_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_field_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_forms
CREATE POLICY "Recruiters can manage own forms"
  ON custom_forms
  FOR ALL
  TO authenticated
  USING (recruiter_id = auth.uid());

CREATE POLICY "Public can read active forms"
  ON custom_forms
  FOR SELECT
  TO anon
  USING (is_active = true);

-- RLS Policies for form_fields
CREATE POLICY "Recruiters can manage fields for own forms"
  ON form_fields
  FOR ALL
  TO authenticated
  USING (
    form_id IN (
      SELECT id FROM custom_forms WHERE recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Public can read fields for active forms"
  ON form_fields
  FOR SELECT
  TO anon
  USING (
    form_id IN (
      SELECT id FROM custom_forms WHERE is_active = true
    )
  );

-- RLS Policies for form_submissions
CREATE POLICY "Recruiters can read submissions for own forms"
  ON form_submissions
  FOR SELECT
  TO authenticated
  USING (
    form_id IN (
      SELECT id FROM custom_forms WHERE recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Public can create submissions"
  ON form_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- RLS Policies for form_field_responses
CREATE POLICY "Recruiters can read responses for own forms"
  ON form_field_responses
  FOR SELECT
  TO authenticated
  USING (
    submission_id IN (
      SELECT fs.id FROM form_submissions fs
      JOIN custom_forms cf ON fs.form_id = cf.id
      WHERE cf.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Public can create responses"
  ON form_field_responses
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_forms_recruiter_id ON custom_forms(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_custom_forms_slug ON custom_forms(slug);
CREATE INDEX IF NOT EXISTS idx_form_fields_form_id ON form_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_field_responses_submission_id ON form_field_responses(submission_id);