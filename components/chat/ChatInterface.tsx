import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2, TrendingUp, Star, Target, AlertCircle } from 'lucide-react';
import { aiClient } from '@/lib/ai';
import { toast } from 'sonner';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  resumeId: string;
  initialContext: string;
  candidateName: string;
  overallScore: number;
  requireAuth?: boolean;
  candidateAnalysis: any;
}

const SUGGESTED_QUESTIONS = [
  "Summarize the candidate's background and experience",
  "What are their key technical skills and strengths?",
  "How many years of experience do they have?",
  "What is their educational background?",
  "Are they suitable for a senior developer role?",
  "What projects or achievements stand out?",
  "What are potential areas of concern or gaps?",
  "How do they compare to typical candidates?",
  "What interview questions would you recommend?",
  "What's their overall job fit score?"
];

const QUICK_INSIGHTS = [
  {
    icon: TrendingUp,
    title: "Experience Level",
    key: "experience"
  },
  {
    icon: Star,
    title: "Key Strengths", 
    key: "strengths"
  },
  {
    icon: Target,
    title: "Job Fit Score",
    key: "fit"
  },
  {
    icon: AlertCircle,
    title: "Areas of Concern",
    key: "concerns"
  }
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  resumeId, 
  initialContext, 
  candidateName, 
  overallScore,
  requireAuth = false,
  candidateAnalysis
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with a welcome message from the bot
    const welcomeMessage: Message = {
      id: '1',
      type: 'bot',
      content: `Hello! I'm your AI recruitment assistant. I've analyzed ${candidateName || 'this candidate'}'s resume and I'm ready to help you make informed hiring decisions.\n\n${overallScore ? `**Overall Job Fit Score: ${overallScore}%**` : ''}\n\nI can provide insights about:\n• Technical skills and experience assessment\n• Job fit analysis and scoring\n• Strengths and potential concerns\n• Interview question recommendations\n• Comparison with role requirements\n\nWhat would you like to know about this candidate?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [candidateName, overallScore]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (question?: string) => {
    const messageText = question || inputValue.trim();
    if (!messageText || isLoading) return;

    if (!candidateAnalysis) {
      toast.error('No analysis data available. Please analyze the resume first.');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await aiClient.handleChatbotInteraction(
        candidateAnalysis,
        messageText
      );
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickInsight = (key: string) => {
    const questions = {
      experience: "How many years of experience does this candidate have and in what areas?",
      strengths: "What are the candidate's key strengths and standout qualifications?",
      fit: "What's the overall job fit score and how well do they match our requirements?",
      concerns: "What are the potential concerns or gaps in this candidate's profile?"
    };
    
    handleSendMessage(questions[key as keyof typeof questions]);
  };

  return (
    <div className="h-[600px] flex flex-col border rounded-lg shadow-sm bg-white">
      <div className="flex-none p-4 border-b">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <span className="font-semibold">AI Recruitment Assistant</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Ask detailed questions about the candidate's qualifications, experience, and job fit
          {overallScore && (
            <span className="text-green-600 ml-2">• Enhanced with detailed analysis</span>
          )}
        </p>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-4 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {message.type === 'bot' && (
                      <Bot className="w-5 h-5 mt-0.5 text-blue-600 flex-shrink-0" />
                    )}
                    {message.type === 'user' && (
                      <User className="w-5 h-5 mt-0.5 text-white flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{message.content}</p>
                      <p className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Bot className="w-5 h-5 text-blue-600" />
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">Analyzing candidate data...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="border-t border-b p-4 bg-gray-50 flex-none">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Suggested Questions:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SUGGESTED_QUESTIONS.slice(0, 6).map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-left justify-start h-auto p-2 text-xs"
                  onClick={() => handleSendMessage(question)}
                  disabled={isLoading}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t p-4 flex-none">
          <div className="flex space-x-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about the candidate..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              className="flex-none"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 