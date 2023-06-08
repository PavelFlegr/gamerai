import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  ChatCompletionRequestMessage,
  Configuration,
  CreateChatCompletionResponse,
  OpenAIApi,
} from 'openai'
import process from 'process'
import { Logger } from '@nestjs/common'

export interface Message {
  role: 'assistant' | 'user' | 'system'
  content: string
}
export interface ChatCompletionResponse {
  content: string
  promptCost: number
  responseCost: number
}

export interface EmbeddingResponse {
  embeddings: {
    input: string
    embedding: number[]
  }[]
  cost: number
}

@Injectable()
export class OpenaiService implements OnModuleInit {
  openai: OpenAIApi
  logger = new Logger(OpenaiService.name)

  onModuleInit() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_KEY,
    })
    this.openai = new OpenAIApi(configuration)
  }

  async getChatCompletion(
    messages: Message[],
  ): Promise<ChatCompletionResponse> {
    let response: CreateChatCompletionResponse
    try {
      const res = await this.openai.createChatCompletion({
        messages: messages,
        model: 'gpt-4',
      })
      if (res.status != 200) {
        throw new Error(res.statusText)
      }
      response = res.data
    } catch (e) {
      this.logger.error(e, e.stack)
      throw e
    }

    return {
      content: response.choices[0].message.content,
      promptCost: (response.usage.prompt_tokens * 0.03) / 1000,
      responseCost: (response.usage.completion_tokens * 0.06) / 1000,
    }
  }
  async getEmbeddings(inputs: string[]): Promise<EmbeddingResponse> {
    const response = await this.openai.createEmbedding({
      input: inputs,
      model: 'text-embedding-ada-002',
    })

    const embeddings = response.data.data.map((response) => ({
      input: inputs[response.index],
      embedding: response.embedding,
    }))

    return {
      embeddings,
      cost: response.data.usage.total_tokens,
    }
  }
}
