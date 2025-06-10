'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Mail } from 'lucide-react';
import Link from 'next/link';

export default function InterviewCompletePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 border-0 shadow-xl">
        <CardContent className="pt-8 text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Interview Completed!
            </h1>
            <p className="text-gray-600">
              Thank you for participating in our AI-powered interview process.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2 text-blue-800">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">What happens next?</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1 text-left">
              <li>• Your responses are being analyzed by our AI system</li>
              <li>• The recruiter will review your interview results</li>
              <li>• You'll receive feedback within 24-48 hours</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-yellow-800 mb-2">
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">Check your email</span>
            </div>
            <p className="text-sm text-yellow-700">
              We'll send you a confirmation email with next steps and timeline.
            </p>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>You can now close this window.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}