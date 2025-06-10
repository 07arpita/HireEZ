// Pure mock function for client-side/demo use
export async function mockSendInterviewInvitation(
  candidateEmail: string,
  candidateName: string,
  sessionId: string,
  jobRole: string,
  recruiterName: string
) {
  console.log('Mock email sent:', {
    to: candidateEmail,
    candidate: candidateName,
    session: sessionId,
    role: jobRole,
    recruiter: recruiterName,
  });
  return { success: true, message: 'Mock interview invitation sent successfully' };
}