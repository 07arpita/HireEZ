import Vapi from '@vapi-ai/web';
import { toast } from 'sonner';

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY;

if (!VAPI_API_KEY) {
  throw new Error('Vapi API key is required. Please set NEXT_PUBLIC_VAPI_API_KEY in your environment variables.');
}

// Initialize Vapi client
const vapi = new Vapi({ apiKey: VAPI_API_KEY });

// Initialize single Vapi instance
let vapiInstance: Vapi | null = null;

export const initializeVapi = (apiKey: string) => {
  if (!vapiInstance) {
    vapiInstance = new Vapi({
      apiKey,
      allowMultipleCallInstances: true,
      baseURL: 'https://api.vapi.ai',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });

    // Add event listeners
    vapiInstance.on('call:started', () => {
      console.log('Call started');
    });

    vapiInstance.on('call:ended', () => {
      console.log('Call ended');
    });

    vapiInstance.on('error', (error) => {
      console.error('Vapi error:', error);
    });
  }
  return vapiInstance;
};

export interface VoiceAgentConfig {
  assistantId: string;
  assistantName: string;
  voiceId: string;
  model: string;
  systemPrompt?: string;
}

export const defaultVoiceAgentConfig: VoiceAgentConfig = {
  assistantId: 'default-interviewer',
  assistantName: 'AI Interviewer',
  voiceId: 'en-US-Neural2-F',
  model: 'gpt-4',
};

export const createVoiceAgent = async (apiKey: string, assistantId: string) => {
  try {
    const vapi = initializeVapi(apiKey);
    await vapi.start({
      assistantId,
      assistantName: 'Recruiter Assistant',
      voiceId: 'en-US-Neural2-F',
      model: 'gpt-4',
      systemPrompt: 'You are a helpful recruiter assistant.',
      metadata: {
        source: 'web',
        environment: 'development'
      }
    });
    return vapi;
  } catch (error) {
    console.error('Error creating voice agent:', error);
    throw error;
  }
};

export const startVoiceCall = async (apiKey: string, assistantId: string) => {
  try {
    const vapi = initializeVapi(apiKey);
    await vapi.start({
      assistantId,
      assistantName: 'Recruiter Assistant',
      voiceId: 'en-US-Neural2-F',
      model: 'gpt-4',
      systemPrompt: 'You are a helpful recruiter assistant.'
    });
    return vapi;
  } catch (error) {
    console.error('Error starting voice call:', error);
    throw error;
  }
};

export const endVoiceCall = async (vapi: Vapi) => {
  try {
    await vapi.stop();
  } catch (error) {
    console.error('Error ending voice call:', error);
    throw error;
  }
};

// Cleanup function to be called when component unmounts
export const cleanupVapi = () => {
  if (vapiInstance) {
    try {
      vapiInstance.stop();
      vapiInstance = null;
    } catch (error) {
      console.error('Error cleaning up Vapi:', error);
    }
  }
};
