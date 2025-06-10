import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables');
}

// Validate URL format
const isValidUrl = supabaseUrl?.includes('supabase.co') || false;
const isValidKey = supabaseAnonKey?.startsWith('eyJ') || false;

if (supabaseUrl && supabaseAnonKey && !isValidUrl) {
  console.error('Invalid Supabase URL format. Should be: https://your-project-id.supabase.co');
}

if (supabaseUrl && supabaseAnonKey && !isValidKey) {
  console.error('Invalid Supabase anon key format. Should start with: eyJ...');
}

// Create client only if we have valid credentials
export const supabase = (supabaseUrl && supabaseAnonKey && isValidUrl && isValidKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Client-Info': 'recruitai-web'
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

// Test Supabase connection
supabase?.auth.onAuthStateChange((event, session) => {
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

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type ResumeInsert = Database['public']['Tables']['resumes']['Insert'];
export type InterviewSessionInsert = Database['public']['Tables']['interview_sessions']['Insert'];
export type InterviewResultInsert = Database['public']['Tables']['interview_results']['Insert'];
export type CustomFormInsert = Database['public']['Tables']['custom_forms']['Insert'];
export type FormFieldInsert = Database['public']['Tables']['form_fields']['Insert'];
export type FormSubmissionInsert = Database['public']['Tables']['form_submissions']['Insert'];
export type FormFieldResponseInsert = Database['public']['Tables']['form_field_responses']['Insert'];

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type ResumeUpdate = Database['public']['Tables']['resumes']['Update'];
export type InterviewSessionUpdate = Database['public']['Tables']['interview_sessions']['Update'];
export type InterviewResultUpdate = Database['public']['Tables']['interview_results']['Update'];
export type CustomFormUpdate = Database['public']['Tables']['custom_forms']['Update'];
export type FormFieldUpdate = Database['public']['Tables']['form_fields']['Update'];
export type FormSubmissionUpdate = Database['public']['Tables']['form_submissions']['Update'];
export type FormFieldResponseUpdate = Database['public']['Tables']['form_field_responses']['Update'];

// Utility functions for common operations with proper error handling
export const supabaseHelpers = {
  // Check if Supabase is properly configured
  isConfigured: () => Boolean(supabase),
  
  // Get current user with error handling
  getCurrentUser: async () => {
    if (!supabase) return null;
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting current user:', error);
        return null;
      }
      return user;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  },
  
  // Check if user is authenticated with error handling
  isAuthenticated: async () => {
    if (!supabase) return false;
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error checking authentication:', error);
        return false;
      }
      return Boolean(session?.user);
    } catch (error) {
      console.error('Error in isAuthenticated:', error);
      return false;
    }
  },
  
  // Get user profile with error handling
  getUserProfile: async (userId: string) => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  },
  
  // Create or update user profile with error handling
  upsertUserProfile: async (profile: UserInsert) => {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    
    try {
      const result = await supabase
        .from('users')
        .upsert(profile, {
          onConflict: 'id'
        })
        .select()
        .single();
      
      return result;
    } catch (error) {
      console.error('Error in upsertUserProfile:', error);
      return { data: null, error };
    }
  }
};

// Export a typed version of the client
export type SupabaseClient = typeof supabase;

// Connection status checker with proper error handling
export const checkSupabaseConnection = async (): Promise<boolean> => {
  if (!supabase) return false;
  
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    return !error;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
};

// Environment validation helper
export const validateSupabaseConfig = () => {
  const issues: string[] = [];
  
  if (!supabaseUrl) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL is missing');
  } else if (!isValidUrl) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL format is invalid (should contain "supabase.co")');
  }
  
  if (!supabaseAnonKey) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
  } else if (!isValidKey) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY format is invalid (should start with "eyJ")');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

// Export validation result for use in components
export const supabaseConfig = validateSupabaseConfig();

// Fetch a single resume analysis by ID
export const getResumeAnalysis = async (id: string) => {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching resume analysis:', error);
    throw new Error(error.message);
  }

  // Log the fetched data to help with debugging
  console.log('Fetched resume data:', data);

  return data;
};

// Fetch job positions
export const getJobPositions = async () => {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { data, error } = await supabase
    .from('jobs')
    .select('id, title, description, requirements, responsibilities, required_skills, preferred_skills');

  if (error) {
    console.error('Error fetching job positions:', error);
    throw new Error(error.message);
  }

  return data || [];
};

// Fetch all resumes
export const getAllResumes = async () => {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { data, error } = await supabase
    .from('resumes')
    .select('id, candidate_name, candidate_email, phone, summary, education, experience, file_name, file_url, parsed_content, job_description, job_role, analysis_data, created_at');

  if (error) {
    console.error('Error fetching all resumes:', error);
    throw new Error(error.message);
  }

  return data || [];
};

// Save resume analysis to the database
export async function saveResumeAnalysis({
  job_role,
  job_description,
  resume_url,
  parsed_content,
  analysis_data,
  candidate_name,
  candidate_email,
  candidate_phone,
}: {
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
    throw new Error('Supabase client is not initialized');
  }

  try {
    // Test Supabase connection first
    const { data: testData, error: testError } = await supabase
      .from('resumes')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('Supabase connection test failed:', testError);
      throw new Error(`Supabase connection error: ${testError.message}`);
    }

    console.log('Starting saveResumeAnalysis with data:', {
      job_role,
      job_description,
      resume_url,
      candidate_name,
      candidate_email,
      candidate_phone,
      analysis_data
    });

    // Get the current user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting user:', userError);
      throw new Error(`Authentication error: ${userError.message}`);
    }
    if (!user) {
      throw new Error('No authenticated user found');
    }
    console.log('Current user:', user);

    // First, ensure the user exists in the users table
    const { error: upsertError } = await supabase
      .from('users')
      .upsert([
        {
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString(),
        }
      ]);

    if (upsertError) {
      console.error('Error creating user:', upsertError);
      throw new Error(`User creation error: ${upsertError.message}`);
    }
    console.log('User record created/updated successfully');

    // Extract file name from resume_url
    const fileName = resume_url.split('/').pop() || '';
    console.log('File name extracted:', fileName);

    // Prepare the resume data
    const resumeData = {
      recruiter_id: user.id,
      candidate_name,
      candidate_email,
      phone: candidate_phone,
      skills: analysis_data.skills_analysis?.matching_skills || [],
      education: analysis_data.education_analysis?.relevant_education || [],
      experience: analysis_data.experience_analysis?.relevant_experience || [],
      summary: analysis_data.overall_match?.summary || '',
      file_url: resume_url,
      file_name: fileName,
      parsed_content,
      job_role,
      job_description,
      job_skills: analysis_data.skills_analysis?.matching_skills?.join(', ') || '',
      job_technologies: analysis_data.technical_fit?.matching_technologies?.join(', ') || '',
      analysis_data: analysis_data,
      overall_score: analysis_data.overall_match?.score || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Prepared resume data:', resumeData);

    // Now save the resume analysis with all fields
    const { data, error } = await supabase
      .from('resumes')
      .insert([resumeData])
      .select();

    if (error) {
      console.error('Error saving resume:', error);
      throw new Error(`Resume save error: ${error.message}`);
    }

    console.log('Resume saved successfully:', data);
    return { data, error: null };
  } catch (error: any) {
    console.error('Error in saveResumeAnalysis:', error);
    // Check if it's a 402 error
    if (error.message?.includes('402') || error.code === '402') {
      throw new Error('Supabase subscription error. Please check your subscription status.');
    }
    return { data: null, error };
  }
}