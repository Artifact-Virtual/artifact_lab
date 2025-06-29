import { ChatMessage as ChatMessageType } from "@/types/chat";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isAI = message.sender === 'ai';

  return (
    <div className={`chat-message ${isAI ? '' : 'flex justify-end'}`}>
      <div className={`max-w-sm rounded-lg p-3 ${
        isAI 
          ? 'bg-white bg-opacity-5' 
          : 'bg-glow-cyan bg-opacity-20'
      }`}>
        <p className="text-sm font-light">{message.content}</p>
        
        {/* Function calls display */}
        {message.functionCalls && message.functionCalls.length > 0 && (
          <div className="mt-2 p-2 bg-black rounded border border-white border-opacity-10">
            {message.functionCalls.map((call, index) => (
              <div key={index} className="text-xs font-light flex items-center space-x-1">
                {call.status === 'completed' && <CheckCircle className="w-3 h-3 text-glow-green" />}
                {call.status === 'running' && <Clock className="w-3 h-3 text-glow-yellow" />}
                {call.status === 'error' && <AlertCircle className="w-3 h-3 text-glow-coral" />}
                <span className={
                  call.status === 'completed' ? 'text-glow-green' :
                  call.status === 'running' ? 'text-glow-yellow' : 'text-glow-coral'
                }>
                  {call.name}: {call.description}
                </span>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-xs text-gray-400 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
