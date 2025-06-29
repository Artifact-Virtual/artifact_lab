export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  functionCalls: FunctionCall[];
}

export interface FunctionCall {
  name: string;
  description: string;
  status: 'running' | 'completed' | 'error';
  result?: any;
}

export interface ChatResponse {
  content: string;
  functionCalls?: FunctionCall[];
  type: 'chat_response';
}
