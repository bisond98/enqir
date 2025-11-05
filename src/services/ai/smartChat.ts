// Smart Chat Enhancement Service
// Provides intelligent chat features, suggestions, and templates

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  type: 'text' | 'suggestion' | 'template' | 'quick-action';
}

export interface ChatContext {
  enquiryTitle: string;
  enquiryCategory: string;
  enquiryBudget: string;
  enquiryLocation: string;
  conversationHistory: ChatMessage[];
  userType: 'buyer' | 'seller';
}

export interface SmartSuggestion {
  id: string;
  text: string;
  category: 'greeting' | 'response' | 'question' | 'action' | 'closing';
  confidence: number;
  context: string[];
}

export interface ChatTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  tags: string[];
  useCase: string;
}

// Smart Chat Configuration
const CHAT_CONFIG = {
  maxSuggestions: 6,
  maxTemplates: 8,
  contextWindow: 10, // Last 10 messages for context
  suggestionThreshold: 0.7,
  mobileOptimized: true
};

// Smart Reply Suggestions based on context
export const getSmartReplySuggestions = (
  context: ChatContext,
  lastMessage?: string
): SmartSuggestion[] => {
  try {
    const suggestions: SmartSuggestion[] = [];
    
    // Context-based suggestions
    if (context.userType === 'seller') {
      suggestions.push(
        {
          id: 'seller-greeting',
          text: 'Hi! I can help you with this request. Could you share more details?',
          category: 'greeting',
          confidence: 0.9,
          context: ['first-contact', 'seller-response']
        },
        {
          id: 'seller-question',
          text: 'What\'s your preferred timeline for this?',
          category: 'question',
          confidence: 0.8,
          context: ['timeline', 'planning']
        },
        {
          id: 'seller-offer',
          text: 'I can provide this service within your budget. When would you like to discuss further?',
          category: 'response',
          confidence: 0.85,
          context: ['budget-match', 'service-offer']
        },
        {
          id: 'seller-contact',
          text: 'Let\'s connect on call to discuss the details. What\'s your preferred time?',
          category: 'action',
          confidence: 0.8,
          context: ['contact', 'meeting']
        }
      );
    } else {
      // Buyer suggestions
      suggestions.push(
        {
          id: 'buyer-greeting',
          text: 'Hi! I\'m looking for this service. Are you available?',
          category: 'greeting',
          confidence: 0.9,
          context: ['first-contact', 'buyer-inquiry']
        },
        {
          id: 'buyer-details',
          text: 'Could you tell me more about your experience and pricing?',
          category: 'question',
          confidence: 0.85,
          context: ['information', 'pricing']
        },
        {
          id: 'buyer-timeline',
          text: 'I need this completed by next week. Is that possible?',
          category: 'question',
          confidence: 0.8,
          context: ['timeline', 'urgency']
        },
        {
          id: 'buyer-meeting',
          text: 'Great! Can we schedule a call to discuss this further?',
          category: 'action',
          confidence: 0.8,
          context: ['meeting', 'discussion']
        }
      );
    }

    // Category-specific suggestions
    if (context.enquiryCategory === 'services') {
      suggestions.push(
        {
          id: 'service-specific',
          text: 'I have extensive experience in this field. What specific requirements do you have?',
          category: 'response',
          confidence: 0.8,
          context: ['service-expertise', 'requirements']
        }
      );
    } else if (context.enquiryCategory === 'jobs') {
      suggestions.push(
        {
          id: 'job-specific',
          text: 'I\'m interested in this opportunity. What are the key responsibilities?',
          category: 'question',
          confidence: 0.8,
          context: ['job-interest', 'responsibilities']
        }
      );
    }

    // Budget-aware suggestions
    if (context.enquiryBudget && parseFloat(context.enquiryBudget.replace(/[^\d]/g, '')) > 10000) {
      suggestions.push(
        {
          id: 'premium-service',
          text: 'This is a significant project. I\'d love to discuss the scope and deliverables.',
          category: 'response',
          confidence: 0.85,
          context: ['premium', 'project-scope']
        }
      );
    }

    // Location-based suggestions
    if (context.enquiryLocation.toLowerCase().includes('remote')) {
      suggestions.push(
        {
          id: 'remote-work',
          text: 'I\'m comfortable with remote work. What communication tools do you prefer?',
          category: 'response',
          confidence: 0.8,
          context: ['remote', 'communication']
        }
      );
    }

    // Return top suggestions based on confidence
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, CHAT_CONFIG.maxSuggestions);
      
  } catch (error) {
    console.error('Smart reply suggestions failed:', error);
    return getFallbackSuggestions();
  }
};

// Fallback suggestions if AI fails
const getFallbackSuggestions = (): SmartSuggestion[] => [
  {
    id: 'fallback-1',
    text: 'Hi! I\'m interested in your request.',
    category: 'greeting',
    confidence: 0.9,
    context: ['fallback']
  },
  {
    id: 'fallback-2',
    text: 'Could you share more details?',
    category: 'question',
    confidence: 0.8,
    context: ['fallback']
  },
  {
    id: 'fallback-3',
    text: 'When would you like to discuss this?',
    category: 'question',
    confidence: 0.8,
    context: ['fallback']
  }
];

// Smart Chat Templates for different scenarios
export const getChatTemplates = (context: ChatContext): ChatTemplate[] => {
  try {
    const templates: ChatTemplate[] = [
      // Professional Templates
      {
        id: 'professional-intro',
        name: 'Professional Introduction',
        content: 'Hello! I\'m a professional with extensive experience in this field. I\'d be happy to discuss how I can help you with your requirements.',
        category: 'professional',
        tags: ['introduction', 'professional', 'experience'],
        useCase: 'First contact with potential client'
      },
      {
        id: 'service-offer',
        name: 'Service Offer',
        content: 'I can provide this service within your budget and timeline. I have a proven track record and can share references if needed.',
        category: 'professional',
        tags: ['service', 'offer', 'budget', 'timeline'],
        useCase: 'Making a service offer'
      },
      {
        id: 'meeting-request',
        name: 'Meeting Request',
        content: 'I\'d love to discuss this in detail. Would you be available for a call tomorrow? I can work around your schedule.',
        category: 'action',
        tags: ['meeting', 'call', 'schedule'],
        useCase: 'Requesting a meeting or call'
      },
      
      // Friendly Templates
      {
        id: 'friendly-greeting',
        name: 'Friendly Greeting',
        content: 'Hi there! 👋 I saw your request and I think I can help! What specific details are you looking for?',
        category: 'friendly',
        tags: ['greeting', 'friendly', 'help'],
        useCase: 'Casual first contact'
      },
      {
        id: 'quick-response',
        name: 'Quick Response',
        content: 'Hey! I\'m available for this. What\'s your timeline and any specific requirements I should know?',
        category: 'friendly',
        tags: ['quick', 'available', 'timeline'],
        useCase: 'Quick response to enquiry'
      },
      
      // Question Templates
      {
        id: 'clarification',
        name: 'Clarification Request',
        content: 'Thanks for the enquiry! I have a few questions to better understand your needs. Could you clarify the scope and timeline?',
        category: 'question',
        tags: ['clarification', 'scope', 'timeline'],
        useCase: 'Asking for more details'
      },
      {
        id: 'budget-discussion',
        name: 'Budget Discussion',
        content: 'I understand your budget is ₹{budget}. I can work within this range. What specific deliverables are you expecting?',
        category: 'question',
        tags: ['budget', 'deliverables', 'expectations'],
        useCase: 'Discussing budget and scope'
      },
      
      // Closing Templates
      {
        id: 'professional-closing',
        name: 'Professional Closing',
        content: 'Thank you for considering my services. I look forward to discussing this opportunity further and how I can add value to your project.',
        category: 'closing',
        tags: ['closing', 'professional', 'thank-you'],
        useCase: 'Professional conversation ending'
      },
      {
        id: 'friendly-closing',
        name: 'Friendly Closing',
        content: 'Thanks for chatting! 😊 I\'m excited about this opportunity and can\'t wait to help you out. Let me know when you\'re free to discuss more!',
        category: 'closing',
        tags: ['closing', 'friendly', 'excited'],
        useCase: 'Friendly conversation ending'
      }
    ];

    // Filter templates based on context
    const relevantTemplates = templates.filter(template => {
      // Category matching
      if (context.enquiryCategory && template.tags.some(tag => 
        context.enquiryCategory.toLowerCase().includes(tag)
      )) {
        return true;
      }
      
      // User type matching
      if (context.userType === 'seller' && template.category === 'professional') {
        return true;
      }
      
      if (context.userType === 'buyer' && template.category === 'friendly') {
        return true;
      }
      
      return true; // Show all templates as fallback
    });

    return relevantTemplates.slice(0, CHAT_CONFIG.maxTemplates);
    
  } catch (error) {
    console.error('Chat templates failed:', error);
    return getFallbackTemplates();
  }
};

// Fallback templates
const getFallbackTemplates = (): ChatTemplate[] => [
  {
    id: 'fallback-template',
    name: 'Simple Response',
    content: 'Hi! I\'m interested in your request. Could you share more details?',
    category: 'fallback',
    tags: ['simple', 'fallback'],
    useCase: 'Basic response when templates fail'
  }
];

// Smart Quick Actions for chat
export const getQuickActions = (context: ChatContext): string[] => {
  try {
    const actions = [
      '📞 Schedule Call',
      '📅 Set Meeting',
      '📧 Share Contact',
      '📋 Send Quote',
      '🔗 Share Portfolio',
      '📱 WhatsApp Chat',
      '📍 Location Share',
      '⏰ Set Reminder'
    ];

    // Context-specific actions
    if (context.userType === 'seller') {
      actions.push('💰 Price Discussion', '📊 Show Experience');
    } else {
      actions.push('❓ Ask Questions', '📝 Get Quote');
    }

    return actions.slice(0, 8); // Limit for mobile
    
  } catch (error) {
    console.error('Quick actions failed:', error);
    return ['📞 Call', '📧 Email', '📱 WhatsApp'];
  }
};

// Smart Emoji Suggestions based on message content
export const getSmartEmojis = (message: string, context: ChatContext): string[] => {
  try {
    const emojis: string[] = [];
    
    // Greeting emojis
    if (message.toLowerCase().includes('hi') || message.toLowerCase().includes('hello')) {
      emojis.push('👋', '😊', '🙂');
    }
    
    // Positive emojis
    if (message.toLowerCase().includes('great') || message.toLowerCase().includes('good') || message.toLowerCase().includes('excellent')) {
      emojis.push('👍', '🎉', '✨');
    }
    
    // Question emojis
    if (message.includes('?') || message.toLowerCase().includes('what') || message.toLowerCase().includes('how')) {
      emojis.push('❓', '🤔', '💭');
    }
    
    // Business emojis
    if (message.toLowerCase().includes('business') || message.toLowerCase().includes('service') || message.toLowerCase().includes('work')) {
      emojis.push('💼', '📈', '🎯');
    }
    
    // Time emojis
    if (message.toLowerCase().includes('time') || message.toLowerCase().includes('schedule') || message.toLowerCase().includes('meeting')) {
      emojis.push('⏰', '📅', '🗓️');
    }
    
    // Money emojis
    if (message.toLowerCase().includes('budget') || message.toLowerCase().includes('price') || message.toLowerCase().includes('cost')) {
      emojis.push('💰', '💵', '💸');
    }
    
    // Location emojis
    if (message.toLowerCase().includes('location') || message.toLowerCase().includes('place') || message.toLowerCase().includes('area')) {
      emojis.push('📍', '🌍', '🏠');
    }
    
    // Default emojis if none match
    if (emojis.length === 0) {
      emojis.push('😊', '👍', '✨');
    }
    
    return emojis.slice(0, 6); // Limit for mobile display
    
  } catch (error) {
    console.error('Smart emojis failed:', error);
    return ['😊', '👍', '✨'];
  }
};

// Initialize smart chat system
export const initializeSmartChat = async (): Promise<boolean> => {
  try {
    console.log('🚀 Initializing Smart Chat Enhancement...');
    
    // Test all functions
    const testContext: ChatContext = {
      enquiryTitle: 'Test Enquiry',
      enquiryCategory: 'services',
      enquiryBudget: '₹50,000',
      enquiryLocation: 'Mumbai',
      conversationHistory: [],
      userType: 'seller'
    };
    
    // Test suggestions
    const suggestions = getSmartReplySuggestions(testContext);
    console.log('✅ Smart suggestions working:', suggestions.length);
    
    // Test templates
    const templates = getChatTemplates(testContext);
    console.log('✅ Chat templates working:', templates.length);
    
    // Test quick actions
    const actions = getQuickActions(testContext);
    console.log('✅ Quick actions working:', actions.length);
    
    // Test emojis
    const emojis = getSmartEmojis('Hello, how are you?', testContext);
    console.log('✅ Smart emojis working:', emojis.length);
    
    console.log('🎉 Smart Chat Enhancement initialized successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Smart Chat Enhancement initialization failed:', error);
    return false;
  }
};

// Get chat analytics and insights
export const getChatAnalytics = (messages: ChatMessage[]): any => {
  try {
    const analytics = {
      totalMessages: messages.length,
      averageResponseTime: 0,
      responseRate: 0,
      engagementScore: 0,
      commonTopics: [],
      suggestedActions: []
    };
    
    // Calculate response time (simplified)
    if (messages.length > 1) {
      let totalTime = 0;
      let responseCount = 0;
      
      for (let i = 1; i < messages.length; i++) {
        const timeDiff = messages[i].timestamp.getTime() - messages[i-1].timestamp.getTime();
        if (timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000) { // Within 24 hours
          totalTime += timeDiff;
          responseCount++;
        }
      }
      
      analytics.averageResponseTime = responseCount > 0 ? totalTime / responseCount : 0;
    }
    
    // Calculate response rate
    const uniqueSenders = new Set(messages.map(m => m.senderId));
    analytics.responseRate = uniqueSenders.size > 1 ? (messages.length / uniqueSenders.size) : 0;
    
    // Engagement score based on message frequency and variety
    analytics.engagementScore = Math.min(100, (messages.length * 10) + (uniqueSenders.size * 20));
    
    // Common topics (simplified)
    const commonWords = messages
      .flatMap(m => m.text.toLowerCase().split(' '))
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'have', 'will', 'your', 'they', 'from'].includes(word));
    
    const wordCount = commonWords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    analytics.commonTopics = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
    
    // Suggested actions based on analytics
    if (analytics.responseRate < 2) {
      analytics.suggestedActions.push('Follow up with the other party');
    }
    
    if (analytics.averageResponseTime > 2 * 60 * 60 * 1000) { // More than 2 hours
      analytics.suggestedActions.push('Set up a meeting to discuss in person');
    }
    
    if (analytics.engagementScore < 50) {
      analytics.suggestedActions.push('Ask more specific questions to engage better');
    }
    
    return analytics;
    
  } catch (error) {
    console.error('Chat analytics failed:', error);
    return {
      totalMessages: messages.length,
      averageResponseTime: 0,
      responseRate: 0,
      engagementScore: 0,
      commonTopics: [],
      suggestedActions: ['Unable to analyze chat data']
    };
  }
};

// Export configuration
export { CHAT_CONFIG };

