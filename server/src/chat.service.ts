import { Prompt } from './model/message.model.js'
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai'
import process from 'process'
import similarity from 'compute-cosine-similarity'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { EntityManager } from '@mikro-orm/postgresql'
import { Message } from './model/entities/message.js'

export interface PromptResponse {
  promptCost: number
  message: Partial<Message>
}

@Injectable()
export class ChatService implements OnModuleInit {
  openai: OpenAIApi

  constructor(em: EntityManager) {}

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

  async sendPrompt(prompt: Prompt): Promise<PromptResponse> {
    if (prompt.settings.systemMsg !== '') {
      prompt.messages = [
        ...prompt.messages,
        { role: 'system', content: prompt.settings.systemMsg },
      ]
    }

    let cost = 0

    if (prompt.settings.context !== '') {
      const contextBlocks = this.chunkSubstr(prompt.settings.context, 1000)

      const embeddingsResponse = await this.openai.createEmbedding({
        input: [
          prompt.messages[prompt.messages.length - 1].content,
          ...contextBlocks,
        ],
        model: 'text-embedding-ada-002',
      })

      cost += embeddingsResponse.data.usage.total_tokens * 0.0004
      const [questionEmbedding, ...contextEmbeddings] =
        embeddingsResponse.data.data

      const similarities = contextEmbeddings
        .map((embedding) => ({
          ...embedding,
          similarity: similarity(
            embedding.embedding,
            questionEmbedding.embedding,
          ),
        }))
        .sort((a, b) => b.similarity - a.similarity)

      const context = similarities.map(
        (embedding) => contextBlocks[embedding.index - 1],
      )

      prompt.messages = [
        {
          role: 'system',
          content: `Base your response only on the following data:\n${context
            .slice(0, 5)
            .join('\n')}`,
        },
        ...prompt.messages,
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
      },
    }
  }
}
