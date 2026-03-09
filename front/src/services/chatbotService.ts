// Chatbot service for handling AI responses
// Now proxies requests through the backend to protect API keys

// Rule-based fallback responses for common questions
const getFallbackResponse = (question: string): string => {
  const lowerQuestion = question.toLowerCase();

  // Application process
  if (lowerQuestion.includes('apply') || lowerQuestion.includes('application') || lowerQuestion.includes('how to apply')) {
    return `To apply for internships on FutureIntern:

1. **Browse Opportunities**: Use our search feature to find internships that match your interests and skills.

2. **Create an Account**: Sign up for a free account if you haven't already.

3. **Complete Your Profile**: Upload your CV and fill out your profile to help companies learn about you.

4. **Apply**: Click "Apply Now" on any internship listing. You can track your applications in your dashboard.

5. **Wait for Response**: Companies will review your application and contact you if you're a good fit.

Need more help? Visit our Help Center or contact support!`;
  }

  // CV/Resume upload
  if (lowerQuestion.includes('cv') || lowerQuestion.includes('resume') || lowerQuestion.includes('upload')) {
    return `To upload your CV on FutureIntern:

1. **Sign In**: Log into your FutureIntern account.

2. **Go to Dashboard**: Click on your profile or navigate to the Dashboard.

3. **Upload CV**: Look for the "Upload CV" or "Documents" section and click to upload your file.

4. **Format**: We accept PDF, DOC, and DOCX formats. Make sure your CV is up-to-date and highlights your skills and experience.

5. **Update Regularly**: Keep your CV current to increase your chances of matching with great opportunities.

Your CV helps our AI matching system connect you with relevant internships!`;
  }

  // Matching system
  if (lowerQuestion.includes('match') || lowerQuestion.includes('matching') || lowerQuestion.includes('how does matching work')) {
    return `Our AI-powered matching system works like this:

1. **Profile Analysis**: We analyze your profile, skills, education, and preferences.

2. **Opportunity Matching**: Our system matches you with internships that align with your profile and career goals.

3. **Personalized Recommendations**: You'll see recommended internships on your dashboard based on your profile.

4. **Smart Filters**: Use our search filters to refine results by location, industry, duration, and more.

5. **Continuous Learning**: The more you use the platform, the better our recommendations become!

The matching system considers your skills, interests, location preferences, and career goals to find the perfect fit.`;
  }

  // Contact support
  if (lowerQuestion.includes('contact') || lowerQuestion.includes('support') || lowerQuestion.includes('help')) {
    return `We're here to help! You can reach our support team through:

1. **Help Center**: Visit /get-help for detailed guides and FAQs.

2. **Contact Form**: Fill out our contact form at /contact for direct assistance.

3. **Email**: Send us an email with your questions or concerns.

4. **Response Time**: We typically respond within 24-48 hours.

For urgent matters, please use the contact form and mark it as urgent. Our team is dedicated to helping you succeed!`;
  }

  // Sign up process
  if (lowerQuestion.includes('sign up') || lowerQuestion.includes('register') || lowerQuestion.includes('create account')) {
    return `Signing up for FutureIntern is easy:

1. **Click Sign Up**: Navigate to the Sign Up page from the homepage or navigation bar.

2. **Choose Account Type**: Select whether you're a student or a company.

3. **Fill Information**: Enter your basic information (name, email, password).

4. **Verify Email**: Check your email for a verification link.

5. **Complete Profile**: Add your details, skills, and upload your CV to get started.

6. **Start Browsing**: Once your profile is set up, you can start browsing and applying for internships!

It's completely free for students!`;
  }

  // General internship questions
  if (lowerQuestion.includes('internship') || lowerQuestion.includes('opportunity') || lowerQuestion.includes('position')) {
    return `FutureIntern offers a wide range of internship opportunities:

- **Various Industries**: Technology, Finance, Marketing, Design, and more
- **Remote & On-site**: Choose from remote, hybrid, or in-person internships
- **All Levels**: Opportunities for students at different stages of their education
- **Paid & Unpaid**: Both paid and unpaid internships available

Browse our listings to find opportunities that match your interests and career goals. Use filters to narrow down your search!`;
  }

  // Default response
  return `I'm here to help you with questions about FutureIntern! I can assist with:

- Applying for internships
- Uploading your CV
- Understanding our matching system
- Account setup and profile management
- General platform questions

Feel free to ask me anything, or use the quick reply buttons for common questions. If you need more detailed help, please contact our support team!`;
};

// Interface for conversation messages
export interface ConversationMessage {
  text: string;
  sender: 'user' | 'bot';
}

// Function to detect if text contains Arabic characters
export const containsArabic = (text: string): boolean => {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
};

// Main function to get chatbot response with conversation history
export const getChatbotResponse = async (
  userMessage: string,
  conversationHistory: ConversationMessage[] = []
): Promise<string> => {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL + '/chatbot/chat';
    const token = localStorage.getItem('token');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        message: userMessage,
        history: conversationHistory
      })
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 402) {
        // Return the specific points error message from backend
        return data.response || "Insufficient points to use this feature.";
      }
      throw new Error(`API error: ${response.status}`);
    }

    return data.response || getFallbackResponse(userMessage);
  } catch (error) {
    console.error('Chatbot API error:', error);
    // Fallback to rule-based responses on error
    return getFallbackResponse(userMessage);
  }
};
