import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { createVoiceAgent, startVoiceCall, endVoiceCall } from '@/lib/vapi';
import { toast } from 'sonner';

interface VoiceAgentProps {
  sessionId: string;
  jobRole: string;
  keySkills: string[];
  onCallEnd?: (transcript: string) => void;
}

export const VoiceAgent: React.FC<VoiceAgentProps> = ({
  sessionId,
  jobRole,
  keySkills,
  onCallEnd
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');

  useEffect(() => {
    initializeAgent();
    return () => {
      if (callId) {
        endVoiceCall(callId);
      }
    };
  }, []);

  const initializeAgent = async () => {
    try {
      const agent = await createVoiceAgent({
        assistantName: `Interviewer for ${jobRole}`,
        systemPrompt: `You are conducting a technical interview for a ${jobRole} position.
        Key skills to assess: ${keySkills.join(', ')}.
        Ask relevant technical questions and evaluate the candidate's responses.
        Be professional and maintain a conversational tone.`
      });
      setAgentId(agent.id);
    } catch (error) {
      console.error('Error initializing voice agent:', error);
      toast.error('Failed to initialize voice agent');
    }
  };

  const startCall = async () => {
    if (!agentId) {
      toast.error('Voice agent not initialized');
      return;
    }

    try {
      const call = await startVoiceCall(agentId);
      setCallId(call.id);
      setIsCallActive(true);
      toast.success('Call started');
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to start call');
    }
  };

  const endCall = async () => {
    if (!callId) return;

    try {
      await endVoiceCall(callId);
      setIsCallActive(false);
      setCallId(null);
      toast.success('Call ended');
      if (onCallEnd) {
        onCallEnd(transcript);
      }
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error('Failed to end call');
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Implement mute functionality using Vapi SDK
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Voice Interview</span>
          <div className="flex items-center space-x-2">
            {isCallActive ? (
              <Badge variant="secondary" className="bg-red-600 text-white">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                Live
              </Badge>
            ) : (
              <Badge variant="secondary">Ready</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-6">
          <div className="flex items-center space-x-4">
            <Button
              size="lg"
              variant={isCallActive ? "destructive" : "default"}
              onClick={isCallActive ? endCall : startCall}
              className="rounded-full w-16 h-16"
            >
              {isCallActive ? (
                <PhoneOff className="w-6 h-6" />
              ) : (
                <Phone className="w-6 h-6" />
              )}
            </Button>
            {isCallActive && (
              <Button
                size="lg"
                variant={isMuted ? "destructive" : "outline"}
                onClick={toggleMute}
                className="rounded-full w-16 h-16"
              >
                {isMuted ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </Button>
            )}
          </div>

          {isCallActive && (
            <div className="w-full space-y-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-medium mb-2">Live Transcript</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {transcript || 'Waiting for speech...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 