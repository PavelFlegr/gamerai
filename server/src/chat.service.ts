import { Prompt } from './model/message.model.js'
import { Configuration, OpenAIApi } from 'openai'
import process from 'process'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { Message } from '@prisma/client'
export interface PromptResponse {
  promptCost: number
  message: Message
}

@Injectable()
export class ChatService implements OnModuleInit {
  openai: OpenAIApi

  constructor() {}

  onModuleInit() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_KEY,
    })
    this.openai = new OpenAIApi(configuration)
  }
  chunkSubstr(str, size): string[] {
    const numChunks = Math.ceil(str.length / size)
    const chunks = new Array(numChunks)

    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
      chunks[i] = str.substr(o, size)
    }

    return chunks
  }

  async createEmbeddings(inputs: string[]) {
    return (
      await this.openai.createEmbedding({
        input: inputs,
        model: 'text-embedding-ada-002',
      })
    ).data
  }

  async getCollaborationResponse(document: string, instruction: string) {
    const response = await this.openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a writing assistant. Your task is to collaborate on a document together with a user. Respond with full document modified according to users instructions, keep in mind that your response will replace the current document, make sure nothing that the user didn't specify is removed\nCurrent document:\n${document}`,
        },
        {
          role: 'user',
          content: instruction,
        },
      ],
    })

    const { prompt_tokens, completion_tokens } = response.data.usage

    return {
      cost: (prompt_tokens * 0.03) / 1000 + (completion_tokens * 0.06) / 1000,
      document: response.data.choices[0].message.content,
    }
  }

  async sendPrompt(prompt: Prompt): Promise<PromptResponse> {
    if (prompt.systemMsg !== '') {
      prompt.messages = [
        ...prompt.messages,
        { role: 'system', content: prompt.systemMsg },
      ]
    }

    let cost = 0

    if (prompt.context) {
      prompt.messages = [
        ...prompt.messages,
        {
          role: 'system',
          content: `Here is some context that should help you answer the users question:\n${prompt.context}`,
        },
      ]
    }

    const response = await this.openai.createChatCompletion({
      model: 'gpt-4',
      messages: prompt.messages,
    })

    const { prompt_tokens, completion_tokens } = response.data.usage

    return {
      promptCost: (prompt_tokens * 0.03 + cost) / 1000,
      message: {
        content: response.data.choices[0].message.content,
        role: 'assistant',
        cost: (completion_tokens * 0.06) / 1000,
      } as Message,
    }
  }
}
