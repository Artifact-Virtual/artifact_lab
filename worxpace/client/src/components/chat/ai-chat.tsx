import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Users, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import ChatMessage from "./chat-message";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";

interface AIChatProps {}

export default function AIChat({}: AIChatProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    functionCalls: any[];
  }>>([
    {
      id: '1',
      content: 'Welcome to ARTIFACT VIRTUAL! I can help you manage workflows, deploy agents, analyze data, and automate processes. What would you like to work on?',
      sender: 'ai',
      timestamp: new Date(),
      functionCalls: []
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { lastMessage } = useWebSocket('/ws', {
    onMessage: (data) => {
      if (data.type === 'chat_response') {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: data.content,
          sender: 'ai',
          timestamp: new Date(),
          functionCalls: data.functionCalls || []
        }]);
      }
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', '/api/chat', { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/metrics'] });
    }
  });

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      content: message,
      sender: 'user' as const,
      timestamp: new Date(),
      functionCalls: []
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");

    try {
      await sendMessageMutation.mutateAsync(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error processing your request.',
        sender: 'ai',
        timestamp: new Date(),
        functionCalls: []
      }]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action: string) => {
    setMessage(action);
    setTimeout(() => handleSendMessage(), 100);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = !collapsed || isHovered;

  if (collapsed && !isHovered) {
    return (
      <div 
        className="w-16 holographic-border flex flex-col items-center py-4 transition-all duration-300 relative"
        onMouseEnter={() => setIsHovered(true)}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(false)}
          className="absolute -left-3 top-6 w-6 h-6 bg-black border border-white border-opacity-20 rounded-full flex items-center justify-center hover:border-glow-cyan transition-all z-10"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>
        
        {/* Collapsed Chat Icon */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-glow-cyan to-glow-purple flex items-center justify-center mb-4">
          <MessageSquare className="w-4 h-4 text-white" />
        </div>
        
        {/* Message Count Indicator */}
        <div className="w-6 h-6 rounded-full bg-glow-cyan bg-opacity-20 flex items-center justify-center">
          <span className="text-xs text-glow-cyan">{messages.length}</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-96 holographic-border flex flex-col transition-all duration-300 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -left-3 top-6 w-6 h-6 bg-black border border-white border-opacity-20 rounded-full flex items-center justify-center hover:border-glow-cyan transition-all z-10"
      >
        <ChevronRight className="w-3 h-3" />
      </button>

      {/* Chat Header */}
      <div className="p-4 border-b border-white border-opacity-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-glow-cyan to-glow-purple flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-light">ARTIFACT AI</h3>
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 bg-glow-green rounded-full"></div>
              <span className="text-xs text-gray-400">Online • Function calling enabled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-white border-opacity-10">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Ask AI to manage your workflows..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent border border-white border-opacity-20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-glow-cyan focus:shadow-[0_0_10px_rgba(0,212,255,0.3)]"
          />
          <button 
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending}
            className="w-10 h-10 rounded-lg bg-glow-cyan bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-glow-cyan" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2 mt-3">
          <button 
            onClick={() => handleQuickAction('Deploy a new AI agent for social media automation')}
            className="text-xs holographic-border px-2 py-1 rounded hover:bg-white/5 transition-all"
          >
            Deploy Agent
          </button>
          <button 
            onClick={() => handleQuickAction('Schedule a daily task to update knowledge base')}
            className="text-xs holographic-border px-2 py-1 rounded hover:bg-white/5 transition-all"
          >
            Schedule Task
          </button>
          <button 
            onClick={() => handleQuickAction('Add new knowledge sources from web crawling')}
            className="text-xs holographic-border px-2 py-1 rounded hover:bg-white/5 transition-all"
          >
            Add Knowledge
          </button>
        </div>
      </div>
    </div>
  );
}
