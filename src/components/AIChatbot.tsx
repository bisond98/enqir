import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, HelpCircle, Search, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { getAIConfig } from '@/config/ai';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'quick-action' | 'suggestion';
}

const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // SAFETY CHECK: Get AI config with error handling
  let aiConfig;
  try {
    aiConfig = getAIConfig();
  } catch (error) {
    console.error('Failed to get AI config:', error);
    aiConfig = getFallbackAIConfig();
    setHasError(true);
  }

           // Quick questions for mobile users - shorter for mobile
         const quickQuestions = [
           "Post enquiry",
           "Respond to enquiries",
           "Trust badge",
           "How to use",
           "Contact support",
           "Browse enquiries"
         ];

  // FAQ data for AI responses
  const faqData = {
    "how to post an enquiry": {
      answer: "To post an enquiry, click the 'Post Your Need' button on the homepage or go to 'Post Enquiry' in the menu. Fill in the details and submit!",
      actions: ["Go to Post Enquiry", "View Examples"]
    },
    "how to respond to enquiries": {
      answer: "To respond to enquiries, browse the 'Browse Enquiries' section, find something you can help with, and click 'Sell' to submit your offer.",
      actions: ["Browse Enquiries", "View My Responses"]
    },
    "what is a trust badge": {
      answer: "A trust badge is an optional feature that shows other users you've verified your identity. It's completely optional and helps build trust in the community.",
      actions: ["Learn More", "Get Trust Badge"]
    },
    "how to use the app": {
      answer: "Our app is simple! Post what you need, browse what others need, and connect with people who can help. No big fees, just a friendly community helping each other.",
      actions: ["Take Tour", "View Features"]
    },
    "contact support": {
      answer: "For support, you can use this chat, check our FAQ, or email us. We're here to help make your experience smooth and enjoyable!",
      actions: ["View FAQ", "Email Support"]
    },
    "browse enquiries": {
      answer: "Browse enquiries by going to 'Browse' in the menu or clicking 'Browse Enquiries' on the homepage. Use the search to find exactly what you're looking for!",
      actions: ["Browse Now", "Search Enquiries"]
    }
  };

           // Initialize with clean, informative welcome message
         useEffect(() => {
           if (messages.length === 0) {
             addBotMessage("Hello! I'm your Enqir Assistant. I can help you with:\n\n• Posting enquiries\n• Finding what you need\n• Understanding features\n• Getting support\n\nWhat would you like to know?", "text");
           }
         }, [messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add message to chat
  const addMessage = (text: string, sender: 'user' | 'bot', type: 'text' | 'quick-action' | 'suggestion' = 'text') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Add bot message with typing effect
  const addBotMessage = (text: string, type: 'text' | 'quick-action' | 'suggestion' = 'text') => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage(text, 'bot', type);
    }, 1000);
  };

  // Handle user input with SAFETY FALLBACK
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      const userMessage = inputText.trim();
      addMessage(userMessage, 'user');
      setInputText('');
      setIsLoading(true);

      // Simulate AI processing
      setTimeout(() => {
        try {
          const response = generateAIResponse(userMessage.toLowerCase());
          addBotMessage(response.answer, 'text');
          
          // Add quick actions if available
          if (response.actions && response.actions.length > 0) {
            setTimeout(() => {
              addBotMessage("Here are some quick actions:", 'suggestion');
              response.actions.forEach(action => {
                addBotMessage(action, 'quick-action');
              });
            }, 500);
          }
        } catch (error) {
          console.error('AI response generation failed:', error);
          addBotMessage("I'm having trouble right now. You can still use all app features normally!", 'text');
        } finally {
          setIsLoading(false);
        }
      }, 1500);
    } catch (error) {
      console.error('Message handling failed:', error);
      setIsLoading(false);
      addBotMessage("Something went wrong. Please try again or use the app normally.", 'text');
    }
  };

  // Generate AI response based on user input with SAFETY FALLBACK
  const generateAIResponse = (input: string) => {
    try {
      // SAFETY CHECK: Validate input
      if (!input || typeof input !== 'string') {
        return getFallbackResponse();
      }

      // Simple keyword matching for mobile performance
      for (const [question, data] of Object.entries(faqData)) {
        if (input.includes(question) || question.includes(input)) {
          return data;
        }
      }

      // Default response
      return {
        answer: "I'm here to help! You can ask me about posting enquiries, responding to requests, trust badges, or how to use the app. What would you like to know?",
        actions: ["View FAQ", "Take Tour", "Browse Enquiries"]
      };
    } catch (error) {
      console.error('AI response generation failed:', error);
      return getFallbackResponse();
    }
  };

     // SAFETY FALLBACK: Always provide a helpful response
   const getFallbackResponse = () => {
     return {
       answer: "I'm having trouble processing your request right now. You can still use all the PAL app features normally. For help, try browsing enquiries or posting your own request!",
       actions: ["Browse Enquiries", "Post Enquiry", "Contact Support"]
     };
   };

  // Handle quick question click
  const handleQuickQuestion = (question: string) => {
    addMessage(question, 'user');
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      const response = generateAIResponse(question.toLowerCase());
      addBotMessage(response.answer, 'text');
      setIsLoading(false);
    }, 1000);
  };

  // Handle quick action click
  const handleQuickAction = (action: string) => {
    addMessage(`I'll help you with: ${action}`, 'user');
    
    // Simulate action response
    setTimeout(() => {
      addBotMessage(`Great! I'm taking you to ${action}. You can also use the menu or navigation to get there.`, 'text');
    }, 1000);
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    addBotMessage("Chat cleared. How can I help you?", "text");
  };

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Clean Minimal Floating Chat Button */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[60]">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <div className="group cursor-pointer relative">
              {/* Subtle Pulse Ring */}
              <div className="absolute inset-0 rounded-full bg-gray-800/20 animate-ping"></div>
              
              {/* Clean FAB Button with Creative Elements */}
              <button className="w-12 h-12 sm:w-14 sm:h-14 bg-white border-2 border-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 group-active:scale-95 flex items-center justify-center relative overflow-hidden">
                <MessageCircle className="h-6 w-6 text-gray-800 group-hover:text-gray-900 transition-colors duration-200 relative z-10" />
                
                {/* Creative Background Animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800/10 to-gray-900/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Minimal Status Dot */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                
                {/* Subtle Ripple Effect */}
                <div className="absolute inset-0 rounded-full bg-gray-800/20 scale-0 group-hover:scale-110 transition-transform duration-500"></div>
              </button>
              
              {/* Clean Tooltip */}
              <div className="absolute -top-12 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none">
                <span className="font-medium">Enqir Assistant</span>
                <div className="absolute bottom-0 right-3 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </SheetTrigger>
                 
          <SheetContent 
            side="right" 
            className="w-[86vw] max-w-[380px] sm:w-[480px] h-[70vh] sm:h-[70vh] p-0 bg-white border-l border-gray-200 flex flex-col [&>button]:hidden"
          >
            {/* Clean Minimal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Enqir Assistant</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    {hasError ? 'Limited mode' : 'Online'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Clear chat"
                >
                  <Settings className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close chat"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Clean Chat Messages - Optimized for better visibility */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-0 bg-gray-50/50">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-4 sm:p-5 rounded-2xl transition-all duration-200 hover:shadow-md ${
                      message.sender === 'user'
                        ? 'bg-gray-800 text-white rounded-br-md shadow-sm'
                        : 'bg-white text-gray-900 rounded-bl-md border border-gray-200 shadow-sm'
                    }`}
                  >
                    {message.type === 'quick-action' ? (
                      <button
                        onClick={() => handleQuickAction(message.text)}
                        className="text-left w-full hover:underline text-sm font-medium flex items-center gap-2 group"
                      >
                        <Sparkles className="h-3 w-3 text-gray-800 group-hover:animate-spin" />
                        {message.text}
                      </button>
                    ) : (
                      <div className="space-y-2.5">
                        {message.sender === 'bot' && (
                          <div className="flex items-center gap-2 mb-2.5">
                            <Bot className="h-4 w-4 text-gray-800" />
                            <span className="text-sm font-semibold text-gray-700">Assistant</span>
                          </div>
                        )}
                        <div className="text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap text-gray-800">
                          {message.text.split('\n').map((line, lineIndex) => {
                            // Handle bullet points
                            if (line.trim().startsWith('•')) {
                              return (
                                <div key={lineIndex} className="flex items-start gap-2 mb-1.5">
                                  <span className="text-gray-800 mt-1.5 flex-shrink-0">•</span>
                                  <span className="flex-1">{line.trim().substring(1).trim()}</span>
                                </div>
                              );
                            }
                            // Handle regular lines
                            return (
                              <p key={lineIndex} className={lineIndex === 0 ? 'font-medium text-gray-900 mb-2' : 'mb-1.5'}>
                                {line || '\u00A0'}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-current/10">
                      <p className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {message.sender === 'user' && (
                        <User className="h-3 w-3 opacity-70" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Clean Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Bot className="h-3 w-3 text-gray-800" />
                        <span className="text-xs font-medium text-gray-600">Assistant</span>
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-500">typing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Clean Quick Actions */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Quick Help</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className="text-left p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-800 rounded-xl transition-all duration-200 group disabled:opacity-50 hover:scale-105 active:scale-95"
                      disabled={isLoading}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-800 rounded-full group-hover:bg-gray-900 group-hover:scale-125 transition-all duration-200"></div>
                        <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 truncate">{question}</span>
                        <Sparkles className="h-3 w-3 text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clean Input Area */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="w-full px-4 py-3 pr-12 text-sm border border-gray-200 rounded-2xl focus:border-gray-800 focus:ring-2 focus:ring-gray-200 transition-all duration-200 bg-gray-50 focus:bg-white"
                    disabled={isLoading}
                  />
                  {inputText.trim() && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className="px-4 py-3 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 text-white rounded-2xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <span>Press Enter to send</span>
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Enqir Assistant</span>
                </span>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default AIChatbot;
