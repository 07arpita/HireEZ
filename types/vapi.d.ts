declare module '@vapi-ai/web' {
  interface VapiConfig {
    apiKey: string;
    allowMultipleCallInstances?: boolean;
    baseURL?: string;
    headers?: Record<string, string>;
  }

  interface StartConfig {
    assistantId: string;
    assistantName: string;
    voiceId: string;
    model: string;
    systemPrompt: string;
    metadata?: Record<string, string>;
  }

  interface AssistantConfig {
    name: string;
    firstMessage: string;
    model: {
      provider: string;
      model: string;
      temperature: number;
      messages: Array<{
        role: string;
        content: string;
      }>;
    };
    voice: {
      provider: string;
      voiceId: string;
    };
  }

  interface Assistant {
    id: string;
    name: string;
    voice: {
      voiceId: string;
    };
    model: {
      model: string;
      messages: Array<{
        role: string;
        content: string;
      }>;
    };
  }

  class Vapi {
    constructor(config: VapiConfig);
    id: string;
    assistants: {
      create(config: AssistantConfig): Promise<Assistant>;
    };
    start(config: StartConfig): Promise<void>;
    stop(): Promise<void>;
    on(event: string, callback: (data: any) => void): void;
  }

  export default Vapi;
} 