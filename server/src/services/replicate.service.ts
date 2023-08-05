import { Injectable, OnModuleInit } from '@nestjs/common'
import Replicate from 'replicate'
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
@Injectable()
export class ReplicateService implements OnModuleInit {
  replicate: Replicate
  logger = new Logger(ReplicateService.name)

  onModuleInit() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_KEY,
    })
  }

  async getChatCompletion(
    messages: Message[],
  ): Promise<ChatCompletionResponse> {
    let response: string[]
    try {
      const input = {
        prompt: messages
          .filter((message) => message.role !== 'system')
          .map((message) => {
            if (message.role === 'user') {
              return `[INST] ${message.content} [/INST]`
            }
            if (message.role === 'assistant') {
              return message.content
            }
          })
          .join('\n'),
      }
      const res = await this.replicate.run(
        'replicate/llama-2-70b-chat:2c1608e18606fad2812020dc541930f2d0495ce32eee50074220b87300bc16e1',
        {
          input,
        },
      )
      response = res as string[]
    } catch (e) {
      this.logger.error(e, e.stack)
      throw e
    }

    return {
      content: response.join(''),
      promptCost: 0,
      responseCost: 0,
    }
  }
}
