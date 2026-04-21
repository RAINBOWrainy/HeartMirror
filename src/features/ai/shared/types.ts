export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatCompletionOptions {
  messages: Message[];
  onChunk?: (chunk: string) => void;
}
