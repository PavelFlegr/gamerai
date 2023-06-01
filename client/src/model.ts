export interface Settings {
  model: string;
  systemMsg: string;
  context: string;
  blockCount: number;
  blockSize: number;
}

export interface User {
  id: string;
  email: string;
}

export interface Message {
  role: string;
  content: string;
  cost: number;
}

export interface Response {
  message: Message;
  promptCost: number;
  completionCost: number;
}

export interface Conversation {
  title: string;
  id: string;
  systemMsg: string;
  context: string;
  blockCount: number;
  blockSize: number;
}
