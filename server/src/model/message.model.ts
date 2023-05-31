import {
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum,
} from 'openai'

export interface Prompt {
  systemMsg: string
  context: string
  messages: ChatCompletionRequestMessage[]
}
export interface Settings {
  systemMsg: string
  context: string
}
export interface Message {
  author: ChatCompletionRequestMessageRoleEnum
  text: string
}
