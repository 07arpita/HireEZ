import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, MessageSquare, X } from 'lucide-react';
import { createVoiceAgent, startVoiceCall, endVoiceCall, cleanupVapi, initializeVapi } from '@/lib/vapi';
import { toast } from 'sonner';

export const RecruiterVoiceAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');

  useEffect(() => {
    initializeAgent();
    return () => {
      cleanupVapi();
    };
  }, []);

  const initializeAgent = async () => {
    try {
      const agent = await createVoiceAgent(process.env.NEXT_PUBLIC_VAPI_API_KEY || '', 'recruiter-assistant');
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
      const call = await startVoiceCall(process.env.NEXT_PUBLIC_VAPI_API_KEY || '', agentId);
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
      const vapi = initializeVapi(process.env.NEXT_PUBLIC_VAPI_API_KEY || '');
      await endVoiceCall(vapi);
      setIsCallActive(false);
      setCallId(null);
      toast.success('Call ended');
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
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        size="lg"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>

      {/* Voice Agent Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Recruiter Assistant</span>
              <div className="flex items-center space-x-2">
                {isCallActive && (
                  <Badge variant="secondary" className="bg-red-600 text-white">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    Live
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-6 py-4">
            <div className="flex items-center space-x-4">
              <Button
                size="lg"
                variant={isCallActive ? "destructive" : "default"}
                onClick={isCallActive ? endCall : startCall}
                className="rounded-full w-16 h-16"
              >
                {isCallActive ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
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

            {!isCallActive && (
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500">
                  Click the microphone button to start talking with your AI recruitment assistant.
                </p>
                <p className="text-xs text-gray-400">
                  You can ask about candidate analysis, job fit, interview questions, and more.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}; 