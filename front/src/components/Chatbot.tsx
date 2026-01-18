import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Minimize2 } from 'lucide-react';
import { containsArabic } from '../services/chatbotService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isArabic?: boolean;
}

const QUICK_REPLIES = [
  "How to apply for internships?",
  "How to upload my CV?",
  "How does matching work?",
  "Contact support"
];

const QUICK_REPLIES_ARABIC = [
  "كيف أتقدم للتدريب؟",
  "كيف أرفع سيرتي الذاتية؟",
  "كيف يعمل نظام المطابقة؟",
  "اتصل بالدعم"
];

const GREETING_MESSAGE = "Hi! I'm your FutureIntern assistant. How can I help you today?";
const GREETING_MESSAGE_ARABIC = "مرحباً! أنا مساعد FutureIntern. كيف يمكنني مساعدتك اليوم؟";

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'ar'>('en');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: GREETING_MESSAGE,
      sender: 'bot',
      timestamp: new Date(),
      isArabic: false
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input when chat opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  const handleQuickReply = async (text: string) => {
    setInputValue(text);
    await handleSendMessage(text);
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    // Detect if message contains Arabic
    const messageIsArabic = containsArabic(messageText);
    if (messageIsArabic) {
      setPreferredLanguage('ar');
    }

    // Build conversation history BEFORE adding the new message
    // (exclude the initial greeting message)
    const conversationHistory = messages
      .filter(msg => msg.id !== '1') // Exclude the greeting message
      .map(msg => ({
        text: msg.text,
        sender: msg.sender
      }));

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      isArabic: messageIsArabic
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Import and call the chatbot service
      const { getChatbotResponse } = await import('../services/chatbotService');
      
      const response = await getChatbotResponse(messageText, conversationHistory);
      
      // Detect if response contains Arabic
      const responseIsArabic = containsArabic(response);
      if (responseIsArabic) {
        setPreferredLanguage('ar');
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
        isArabic: responseIsArabic
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: preferredLanguage === 'ar' 
          ? "عذراً، لم أتمكن من الحصول على إجابة. يرجى المحاولة مرة أخرى أو الاتصال بالدعم."
          : "Sorry, I couldn't get an answer. Please try again or contact support.",
        sender: 'bot',
        timestamp: new Date(),
        isArabic: preferredLanguage === 'ar'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    // Reset to default language when closing
    if (isOpen) {
      setPreferredLanguage('en');
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group animate-scale-in"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-600 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[calc(100vh-8rem)] sm:h-[600px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">FutureIntern Assistant</h3>
                <p className="text-xs text-gray-300">We're here to help</p>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => {
              const isArabic = message.isArabic || containsArabic(message.text);
              return (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-gray-900 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-200'
                    }`}
                    dir={isArabic ? 'rtl' : 'ltr'}
                  >
                    <p className={`text-sm whitespace-pre-wrap break-words ${isArabic ? 'text-right' : 'text-left'}`}>
                      {message.text}
                    </p>
                    <span className={`text-xs mt-1 block ${message.sender === 'user' ? 'text-gray-300' : 'text-gray-400'} ${isArabic ? 'text-right' : 'text-left'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm shadow-sm border border-gray-200 px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Replies (show after every bot response) */}
            {messages.length > 0 && 
             !isTyping && 
             messages[messages.length - 1]?.sender === 'bot' && (
              <div className="space-y-2 mt-2" dir={preferredLanguage === 'ar' ? 'rtl' : 'ltr'}>
                <p className={`text-xs text-gray-500 mb-2 ${preferredLanguage === 'ar' ? 'text-right' : 'text-left'}`}>
                  {preferredLanguage === 'ar' ? 'أسئلة سريعة:' : 'Quick questions:'}
                </p>
                {(preferredLanguage === 'ar' ? QUICK_REPLIES_ARABIC : QUICK_REPLIES).map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className={`w-full px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-lg border border-gray-200 hover:border-gray-300 transition-all text-sm shadow-sm ${
                      preferredLanguage === 'ar' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setInputValue(value);
                  // Detect Arabic and update language preference
                  if (containsArabic(value)) {
                    setPreferredLanguage('ar');
                  }
                }}
                placeholder={preferredLanguage === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                dir={containsArabic(inputValue) ? 'rtl' : 'ltr'}
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

