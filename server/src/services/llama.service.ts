import { Injectable, OnModuleInit } from '@nestjs/common'
import Replicate from 'replicate'
import process from 'process'
import { Logger } from '@nestjs/common'
import WebSocket, { WebSocketServer } from 'ws'
import * as crypto from 'crypto'

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
export class LlamaService implements OnModuleInit {
  replicate: Replicate
  logger = new Logger(LlamaService.name)
  ws: WebSocket
  promises = new Map<string, (val: string) => void>()

  onModuleInit() {
    // this.ws = new WebSocket('ws://34.172.154.188', {
    //   perMessageDeflate: false,
    // })
    // this.ws.on('message', (data) => {
    //   const msg = JSON.parse(data.toString())
    //   this.promises.get(msg.request_id)(msg.response)
    // })
  }

  async getChatCompletion(
    messages: Message[],
  ): Promise<ChatCompletionResponse> {
    let response: string[]
    let request_id: string
    try {
      const input =
        '<s>' +
        messages
          .map((message) => {
            if (message.role === 'system') {
              return `[INST]<<SYS>>\n${message.content}\n<</SYS>>\n[/INST]`
            }
            if (message.role === 'user') {
              return `[INST] ${message.content} [/INST]`
            }
            if (message.role === 'assistant') {
              return message.content
            }
          })
          .join('\n')
      console.log(
        JSON.stringify({
          request_id: '123',
          action: 'infer',
          text: input,
          stream: true,
          max_new_tokens: 300,
        }),
      )
      request_id = crypto.randomUUID()

      this.ws.send(
        JSON.stringify({
          request_id,
          action: 'infer',
          text: input,
          stream: false,
          max_new_tokens: 300,
        }),
      )
    } catch (e) {
      this.logger.error(e, e.stack)
      throw e
    }

    const promise = new Promise<string>((resolve) => {
      this.promises.set(request_id, resolve)
    })

    return {
      content: await promise,
      promptCost: 0,
      responseCost: 0,
    }
  }
}
