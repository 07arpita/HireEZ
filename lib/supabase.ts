import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// It's generally better to throw errors early in development if critical environment variables are missing.
// For production, you might want more sophisticated error handling, but for now, ensure these are present.
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.');
}

// Create the Supabase client instance
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'recruitai-web',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Test Supabase connection
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state changed:', event, session?.user?.id);
});

// Database type definitions
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          candidate_name: string;
          candidate_email: string;
          candidate_phone: string | null;
          job_role: string;
          job_description: string;
          resume_url: string;
          parsed_content: string;
          analysis_json: any;
          status: string;
          score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          candidate_name: string;
          candidate_email: string;
          candidate_phone?: string | null;
          job_role: string;
          job_description: string;
          resume_url: string;
          parsed_content: string;
          analysis_json?: any;
          status?: string;
          score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          candidate_name?: string;
          candidate_email?: string;
          candidate_phone?: string | null;
          job_role?: string;
          job_description?: string;
          resume_url?: string;
          parsed_content?: string;
          analysis_json?: any;
          status?: string;
          score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      interview_sessions: {
        Row: {
          id: string;
          resume_id: string;
          user_id: string;
          status: string;
          start_time: string;
          end_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          user_id: string;
          status?: string;
          start_time: string;
          end_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          resume_id?: string;
          user_id?: string;
          status?: string;
          start_time?: string;
          end_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      interview_results: {
        Row: {
          id: string;
          session_id: string;
          question: string;
          answer: string;
          score: number;
          feedback: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          question: string;
          answer: string;
          score: number;
          feedback?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          question?: string;
          answer?: string;
          score?: number;
          feedback?: string | null;
          created_at?: string;
        };
      };
      custom_forms: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          slug: string;
          is_active: boolean;
          settings: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          slug: string;
          is_active?: boolean;
          settings?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          slug?: string;
          is_active?: boolean;
          settings?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      form_fields: {
        Row: {
          id: string;
          form_id: string;
          field_type: string;
          label: string;
          placeholder: string | null;
          is_required: boolean;
          options: any | null;
          validation_rules: any | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          form_id: string;
          field_type: string;
          label: string;
          placeholder?: string | null;
          is_required?: boolean;
          options?: any | null;
          validation_rules?: any | null;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          form_id?: string;
          field_type?: string;
          label?: string;
          placeholder?: string | null;
          is_required?: boolean;
          options?: any | null;
          validation_rules?: any | null;
          order_index?: number;
          created_at?: string;
        };
      };
      form_submissions: {
        Row: {
          id: string;
          form_id: string;
          candidate_email: string | null;
          candidate_name: string | null;
          status: string;
          submitted_at: string;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          form_id: string;
          candidate_email?: string | null;
          candidate_name?: string | null;
          status?: string;
          submitted_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          form_id?: string;
          candidate_email?: string | null;
          candidate_name?: string | null;
          status?: string;
          submitted_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
      };
      form_field_responses: {
        Row: {
          id: string;
          submission_id: string;
          field_id: string;
          response_value: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          field_id: string;
          response_value?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          field_id?: string;
          response_value?: string | null;
          created_at?: string;
        };
      };
      job_roles: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          requirements: string | null;
          responsibilities: string | null;
          required_skills: string[];
          preferred_skills: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          requirements?: string | null;
          responsibilities?: string | null;
          required_skills?: string[];
          preferred_skills?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          requirements?: string | null;
          responsibilities?: string | null;
          required_skills?: string[];
          preferred_skills?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// Helper types for better type safety
export type User = Database['public']['Tables']['users']['Row'];
export type Resume = Database['public']['Tables']['resumes']['Row'];
export type InterviewSession = Database['public']['Tables']['interview_sessions']['Row'];
export type InterviewResult = Database['public']['Tables']['interview_results']['Row'];
export type CustomForm = Database['public']['Tables']['custom_forms']['Row'];
export type FormField = Database['public']['Tables']['form_fields']['Row'];
export type FormSubmission = Database['public']['Tables']['form_submissions']['Row'];
export type FormFieldResponse = Database['public']['Tables']['form_field_responses']['Row'];

export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type ResumeInsert = Database['public']['Tables']['resumes']['Insert'];
export type InterviewSessionInsert = Database['public']['Tables']['interview_sessions']['Insert'];
export type InterviewResultInsert = Database['public']['Tables']['interview_results']['Insert'];
export type CustomFormInsert = Database['public']['Tables']['custom_forms']['Insert'];
export type FormFieldInsert = Database['public']['Tables']['form_fields']['Insert'];
export type FormSubmissionInsert = Database['public']['Tables']['form_submissions']['Insert'];
export type FormFieldResponseInsert = Database['public']['Tables']['form_field_responses']['Insert'];

export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type ResumeUpdate = Database['public']['Tables']['resumes']['Update'];
export type InterviewSessionUpdate = Database['public']['Tables']['interview_sessions']['Update'];
export type InterviewResultUpdate = Database['public']['Tables']['interview_results']['Update'];
export type CustomFormUpdate = Database['public']['Tables']['custom_forms']['Update'];
export type FormFieldUpdate = Database['public']['Tables']['form_fields']['Update'];
export type FormSubmissionUpdate = Database['public']['Tables']['form_submissions']['Update'];
export type FormFieldResponseUpdate = Database['public']['Tables']['form_field_responses']['Update'];

export type JobRole = Database['public']['Tables']['job_roles']['Row'];
export type JobRoleInsert = Database['public']['Tables']['job_roles']['Insert'];
export type JobRoleUpdate = Database['public']['Tables']['job_roles']['Update'];

export const checkSupabaseConnection = async (): Promise<boolean> => {
  if (!supabase) {
    console.warn('Supabase client is not initialized.');
    return false;
  }
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.error('Supabase connection check failed:', error.message);
      return false;
    }
    console.log('Supabase connection successful.');
    return true;
  } catch (error) {
    console.error('Supabase connection check failed unexpectedly:', error);
    return false;
  }
};

export const validateSupabaseConfig = () => {
  if (!supabaseUrl) {
    console.error('Environment variable NEXT_PUBLIC_SUPABASE_URL is not set.');
    return false;
  }
  if (!supabaseAnonKey) {
    console.error('Environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.');
    return false;
  }
  if (typeof supabaseUrl !== 'string' || !supabaseUrl.includes('supabase.co')) {
    console.error('Invalid Supabase URL format. Should be: https://your-project-id.supabase.co');
    return false;
  }
  if (typeof supabaseAnonKey !== 'string' || !supabaseAnonKey.startsWith('eyJ')) {
    console.error('Invalid Supabase anon key format. Should start with: eyJ...');
    return false;
  }
  return true;
};

export const getResumeAnalysis = async (id: string) => {
  if (!supabase) {
    console.error('Supabase client not initialized in getResumeAnalysis');
    return null;
  }
  const { data, error } = await supabase.from('resumes').select('analysis_json').eq('id', id).single();
  if (error) {
    console.error('Error fetching resume analysis:', error);
    return null;
  }
  return data?.analysis_json;
};

export const getJobPositions = async () => {
  if (!supabase) {
    console.error('Supabase client not initialized in getJobPositions');
    return [];
  }
  const { data, error } = await supabase.from('job_roles').select('*'); // Assuming a job_roles table exists
  if (error) {
    console.error('Error fetching job positions:', error);
    return [];
  }
  return data || [];
};

export const getAllResumes = async () => {
  if (!supabase) {
    console.error('Supabase client not initialized in getAllResumes');
    return [];
  }
  const { data, error } = await supabase.from('resumes').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching all resumes:', error);
    return [];
  }
  return data || [];
};

export async function saveResumeAnalysis({
  user_id,
  job_role,
  job_description,
  resume_url,
  parsed_content,
  analysis_data,
  candidate_name,
  candidate_email,
  candidate_phone,
}: {
  user_id: string;
  job_role: string;
  job_description: string;
  resume_url: string;
  parsed_content: string;
  analysis_data: any;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
}) {
  if (!supabase) {
    console.error('Supabase client not initialized in saveResumeAnalysis');
    return { success: false, error: 'Supabase client not initialized' };
  }
  const { data, error } = await supabase.from('resumes').insert({
    user_id,
    job_role,
    job_description,
    resume_url,
    parsed_content,
    analysis_json: analysis_data,
    candidate_name,
    candidate_email,
    candidate_phone,
    status: 'parsed',
  }).select().single();

  if (error) {
    console.error('Error saving resume analysis:', error);
    return { success: false, error };
  }

  return { success: true, data };
}