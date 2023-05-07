import { ChatCompletionRequestMessageRoleEnum } from 'openai';

export interface Message {
  author: ChatCompletionRequestMessageRoleEnum
  text: string
}