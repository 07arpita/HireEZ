// Enhanced AI integration for comprehensive resume analysis

const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = 'deepseek-ai/deepseek-r1-0528-qwen3-8b' as const; // DeepSeek model with const assertion

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ResumeData {
  candidate: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    portfolio: string;
  };
  skills: string[];
  education: any[];
  experience: any[];
  projects: any[];
  certifications: any[];
  languages: any[];
  summary: string;
  keywords: string[];
}

// Debug logging for API key and model
console.log('OpenRouter Configuration:', {
  apiKeyExists: !!OPENROUTER_API_KEY,
  apiKeyLength: OPENROUTER_API_KEY?.length,
  model: OPENROUTER_MODEL,
  modelType: typeof OPENROUTER_MODEL
});

if (!OPENROUTER_API_KEY) {
  console.error('Missing OpenRouter API key - AI features will not work.');
  throw new Error('OpenRouter API key is required. Please set NEXT_PUBLIC_OPENROUTER_API_KEY in your environment variables.');
}

export class AIClient {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.model = OPENROUTER_MODEL;
    
    // Validate model configuration
    if (this.model !== OPENROUTER_MODEL) {
      console.error('Model configuration mismatch:', {
        expected: OPENROUTER_MODEL,
        actual: this.model
      });
      throw new Error('Invalid model configuration');
    }

    console.log('AIClient initialized with:', {
      baseUrl: this.baseUrl,
      model: this.model,
      modelType: typeof this.model,
      isCorrectModel: this.model === OPENROUTER_MODEL
    });
  }

  // Helper to sanitize text for PostgreSQL (removes null characters)
  private removeNullChars(str: string): string {
    return typeof str === 'string' ? str.replace(/\u0000/g, '') : str;
  }

  // Generic chat completion function for OpenRouter API
  private async chatCompletion(
    messages: OpenAIMessage[],
    maxTokens: number = 1024,
    temperature: number = 0.7,
    requireJson: boolean = false
  ): Promise<string> {
    try {
      if (!OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API key is not configured');
      }

      const requestBody = {
        model: OPENROUTER_MODEL,
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        stream: false
      };

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Resume Parser'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('OpenRouter API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });

        if (response.status === 401) {
          throw new Error('OpenRouter API authentication error. Please check your API key.');
        } else if (response.status === 402) {
          throw new Error('OpenRouter API payment required. Please check your API key and billing status.');
        } else if (response.status === 429) {
          throw new Error('OpenRouter API rate limit exceeded. Please try again later.');
        }

        throw new Error(`OpenRouter API error: ${response.status} (${response.statusText})`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenRouter API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter chat completion error:', error);
      throw error;
    }
  }

  async parseResume(resumeText: string): Promise<ResumeData> {
    try {
      // Clean the input text
      const cleanedText = resumeText
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const messages: OpenAIMessage[] = [
        {
          role: 'system',
          content: `You are an expert resume parser. Extract the following fields from the resume and return ONLY a valid JSON object. If you cannot extract the fields, return an empty JSON object: {}\n{
  "candidate": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "portfolio": "string"
  },
  "skills": ["string"],
  "education": [{"degree": "string", "institution": "string", "year": "string"}],
  "experience": [{"title": "string", "company": "string", "duration": "string", "description": "string"}],
  "projects": [{"name": "string", "description": "string"}],
  "certifications": ["string"],
  "languages": ["string"],
  "summary": "string",
  "keywords": ["string"]
}`
        },
        {
          role: 'user',
          content: cleanedText
        }
      ];

      const response = await this.chatCompletion(messages, 1024, 0.3, true);
      console.log('Raw parsing response:', response);

      // Check if response is non-empty and looks like JSON
      if (!response || typeof response !== 'string' || !response.trim().startsWith('{')) {
        throw new Error('AI did not return valid JSON');
      }

      const parsed = JSON.parse(response);

      return {
        candidate: parsed.candidate || {
          name: '',
          email: '',
          phone: '',
          location: '',
          linkedin: '',
          portfolio: ''
        },
        skills: parsed.skills || [],
        education: parsed.education || [],
        experience: parsed.experience || [],
        projects: parsed.projects || [],
        certifications: parsed.certifications || [],
        languages: parsed.languages || [],
        summary: parsed.summary || '',
        keywords: parsed.keywords || []
      };
    } catch (error) {
      console.error('Resume parsing error:', error);
      // Return a default object if parsing fails
      return {
        candidate: {
          name: '',
          email: '',
          phone: '',
          location: '',
          linkedin: '',
          portfolio: ''
        },
        skills: [],
        education: [],
        experience: [],
        projects: [],
        certifications: [],
        languages: [],
        summary: '',
        keywords: []
      };
    }
  }

  async analyzeResumeForJob(
    resumeText: string,
    jobDescription: string,
    jobTitle: string,
    candidateName: string
  ) {
    const cleanResumeText = this.removeNullChars(resumeText);
    const cleanJobDescription = this.removeNullChars(jobDescription);

    const fullJobDescription = `Job Title: ${jobTitle}\nJob Description: ${cleanJobDescription}`;

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `You are an expert HR professional and technical recruiter. Analyze the resume against the job requirements and provide a detailed, actionable assessment. Return ONLY a valid JSON object matching the required structure. Do not include any explanations, text, or markdown before or after the JSON. If you cannot answer, return an empty JSON object: {}. IMPORTANT: All property names and string values must be double-quoted. The response must be valid JSON and parseable by JSON.parse() in JavaScript. Do not use single quotes or unquoted values. Do not include comments or explanations. STRICT REQUIREMENT: The response MUST include ALL required top-level fields (candidate, overall_match, skills_analysis, experience_analysis, technical_fit, recommendations, interview_questions) even if some values are empty. Do not omit any required fields. The response must be a complete JSON object.`
      },
      {
        role: 'user',
        content: `Please provide a detailed analysis in the following JSON format:
{
  "candidate": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "education": [
      {
        "degree": "string",
        "institution": "string",
        "year": "string"
      }
    ]
  },
  "overall_match": {
    "score": number (0-100),
    "summary": "Brief summary of overall fit",
    "strengths": ["List of key strengths that match the role"],
    "gaps": ["List of potential gaps or missing requirements"]
  },
  "skills_analysis": {
    "matching_skills": ["Skills from resume that match job requirements"],
    "missing_skills": ["Required skills not found in resume"],
    "additional_skills": ["Notable skills in resume beyond requirements"]
  },
  "experience_analysis": {
    "relevant_experience": ["Key relevant experience points"],
    "experience_gaps": ["Areas where experience might be lacking"],
    "years_of_experience": number
  },
  "technical_fit": {
    "matching_technologies": ["Technologies from resume that match requirements"],
    "missing_technologies": ["Required technologies not found in resume"],
    "additional_technologies": ["Notable technologies in resume beyond requirements"]
  },
  "recommendations": {
    "interview_focus": ["Areas to focus on during interview"],
    "development_areas": ["Areas where candidate could improve"],
    "risk_factors": ["Potential concerns or red flags"]
  },
  "interview_questions": [
    {
      "question": "Technical question to assess skills",
      "purpose": "What this question aims to evaluate"
    },
    {
      "question": "Behavioral question to assess experience",
      "purpose": "What this question aims to evaluate"
    },
    {
      "question": "Problem-solving question",
      "purpose": "What this question aims to evaluate"
    }
  ]
}

STRICT REQUIREMENT: The response MUST include ALL required top-level fields (candidate, overall_match, skills_analysis, experience_analysis, technical_fit, recommendations, interview_questions) even if some values are empty. Do not omit any required fields. The response must be a complete JSON object. Do not include any explanations, text, or markdown before or after the JSON. If you cannot answer, return an empty JSON object: {}.`
      },
      {
        role: 'user',
        content: `Please provide a detailed analysis in the following JSON format:\n{\n  "candidate": {\n    "name": "string",\n    "email": "string",\n    "phone": "string",\n    "education": [\n      {\n        "degree": "string",\n        "institution": "string",\n        "year": "string"\n      }\n    ]\n  },\n  "overall_match": {\n    "score": number (0-100),\n    "summary": "Brief summary of overall fit",\n    "strengths": ["List of key strengths that match the role"],\n    "gaps": ["List of potential gaps or missing requirements"]\n  },\n  "skills_analysis": {\n    "matching_skills": ["Skills from resume that match job requirements"],\n    "missing_skills": ["Required skills not found in resume"],\n    "additional_skills": ["Notable skills in resume beyond requirements"]\n  },\n  "experience_analysis": {\n    "relevant_experience": ["Key relevant experience points"],\n    "experience_gaps": ["Areas where experience might be lacking"],\n    "years_of_experience": number\n  },\n  "technical_fit": {\n    "matching_technologies": ["Technologies from resume that match requirements"],\n    "missing_technologies": ["Required technologies not found in resume"],\n    "additional_technologies": ["Notable technologies in resume beyond requirements"]\n  },\n  "recommendations": {\n    "interview_focus": ["Areas to focus on during interview"],\n    "development_areas": ["Areas where candidate could improve"],\n    "risk_factors": ["Potential concerns or red flags"]\n  },\n  "interview_questions": [\n    {\n      "question": "Technical question to assess skills",\n      "purpose": "What this question aims to evaluate"\n    },\n    {\n      "question": "Behavioral question to assess experience",\n      "purpose": "What this question aims to evaluate"\n    },\n    {\n      "question": "Problem-solving question",\n      "purpose": "What this question aims to evaluate"\n    }\n  ]\n}\n\nFocus on:\n1. Technical skills and technologies required for the role\n2. Relevant experience and projects\n3. Years of experience in key areas\n4. Specific achievements that demonstrate capability\n5. Potential gaps that need to be addressed in the interview\n6. Customized interview questions based on the candidate's background\n\nProvide a thorough analysis that helps in making an informed hiring decision.\n\nResume text:\n${cleanResumeText}\n\nJob Requirements:\n${fullJobDescription}`
      }
    ];

    try {
      console.log('Sending resume for analysis:', cleanResumeText.slice(0, 200) + '...');
      const jsonString = await this.chatCompletion(
        messages,
        8192, // Increased maxTokens to allow for more detailed analysis and prevent truncation
        0.5, 
        true
      );
      console.log('Raw analysis response:', jsonString);
      // Remove JSON.parse and just return the raw string
      return jsonString;
    } catch (error) {
      console.error('Resume analysis error:', error);
      throw error;
    }
  }

  /**
   * Chatbot Q&A: Only answer using the provided candidate analysis data.
   * If the answer is not in the data, reply with a refusal message.
   */
  async handleChatbotInteraction(analysisData: any, question: string): Promise<string> {
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `You are an AI recruitment assistant that ONLY answers questions about the candidate's resume analysis. You must:
1. Only answer questions related to the candidate's resume, skills, experience, and job fit
2. If asked about anything else, politely decline and redirect to resume-related topics
3. Base your answers ONLY on the provided analysis data
4. Be professional and concise in your responses
5. If you don't have enough information in the analysis data to answer a question, say so

The analysis data contains information about:
- Candidate's background and experience
- Technical skills and qualifications
- Job fit assessment
- Strengths and potential concerns
- Interview recommendations`
      },
      {
        role: 'user',
        content: `Here is the resume analysis data:\n${JSON.stringify(analysisData, null, 2)}\n\nQuestion: ${question}`
      }
    ];

    try {
      const response = await this.chatCompletion(messages, 1024, 0.7);
      return response;
    } catch (error) {
      console.error('Chatbot interaction error:', error);
      throw error;
    }
  }
}

export const aiClient = new AIClient();
