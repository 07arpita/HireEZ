/*
  # AI Recruitment Platform Database Schema

  1. New Tables
    - `users` - Recruiter profiles with authentication
    - `resumes` - Parsed resume data with skills and experience
    - `interview_sessions` - Interview configuration and candidate info
    - `interview_results` - Post-interview analytics and scores
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated recruiters
    - Ensure data isolation between recruiters
    
  3. Features
    - JSON fields for flexible skill and experience data
    - Timestamps for audit trails
    - Foreign key relationships for data integrity
*/

-- Users table for recruiter profiles
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  company text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Resumes table for parsed candidate data
CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid REFERENCES users(id) ON DELETE CASCADE,
  candidate_name text NOT NULL DEFAULT '',
  candidate_email text DEFAULT '',
  phone text DEFAULT '',
  skills jsonb DEFAULT '[]'::jsonb,
  education jsonb DEFAULT '[]'::jsonb,
  experience jsonb DEFAULT '[]'::jsonb,
  summary text DEFAULT '',
  file_url text DEFAULT '',
  parsed_content text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Interview sessions configuration
CREATE TABLE IF NOT EXISTS interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid REFERENCES users(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES resumes(id) ON DELETE CASCADE,
  session_id text UNIQUE NOT NULL,
  candidate_email text NOT NULL DEFAULT '',
  job_role text NOT NULL DEFAULT '',
  key_skills jsonb DEFAULT '[]'::jsonb,
  interview_type text DEFAULT 'voice',
  num_questions integer DEFAULT 5,
  status text DEFAULT 'pending',
  scheduled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Interview results and analytics
CREATE TABLE IF NOT EXISTS interview_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES interview_sessions(id) ON DELETE CASCADE,
  candidate_name text DEFAULT '',
  score decimal DEFAULT 0.0,
  summary text DEFAULT '',
  audio_url text DEFAULT '',
  video_url text DEFAULT '',
  transcript text DEFAULT '',
  evaluation jsonb DEFAULT '{}'::jsonb,
  decision text DEFAULT 'pending',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for resumes
CREATE POLICY "Recruiters can read own resumes"
  ON resumes
  FOR ALL
  TO authenticated
  USING (recruiter_id = auth.uid());

-- RLS Policies for interview_sessions
CREATE POLICY "Recruiters can manage own interview sessions"
  ON interview_sessions
  FOR ALL
  TO authenticated
  USING (recruiter_id = auth.uid());

-- RLS Policies for interview_results
CREATE POLICY "Recruiters can read interview results for their sessions"
  ON interview_results
  FOR ALL
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM interview_sessions WHERE recruiter_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resumes_recruiter_id ON resumes(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_recruiter_id ON interview_sessions(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_session_id ON interview_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_results_session_id ON interview_results(session_id);