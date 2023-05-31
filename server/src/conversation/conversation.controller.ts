import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { Prompt, Settings } from '../model/message.model.js'
import { ChatService } from '../chat.service.js'
import { EntityManager } from '@mikro-orm/postgresql'
import { EntityRepository } from '@mikro-orm/core'
import { Message } from '../model/entities/message.js'
import { Conversation } from '../model/entities/conversation.js'
import { User } from '../user.decorator.js'
import { AuthUser } from '../model/auth-user.js'
import { SqlService } from '../sql.service.js'
import pgvector from 'pgvector/pg'

interface MessageInput {
  content: string
}

interface ConversationInput {
  id: string
  title: string
  systemMsg: string
  context: string
}

@Controller('api/conversation')
export class ConversationController {
  messageRepository: EntityRepository<Message>
  conversationRepository: EntityRepository<Conversation>
  constructor(
    private chatService: ChatService,
    private em: EntityManager,
    private sqlService: SqlService,
  ) {
    this.conversationRepository = em.getRepository(Conversation)
    this.messageRepository = em.getRepository(Message)
  }

  @Get()
  async list(@User() user: AuthUser) {
    const conversations = await this.conversationRepository.find(
      { user: user.sub },
      {
        orderBy: { createdAt: 'desc' },
      },
    )

    return conversations
  }

  @Get(':id')
  async get(@Param('id') id: string, @User() user: AuthUser) {
    const conversation = await this.conversationRepository.findOne({
      id,
      user: user.sub,
    })

    return conversation
  }

  @Get(':id/messages')
  async getMessages(@Param('id') id: string, @User() user: AuthUser) {
    const messages = await this.messageRepository.find({
      conversation: id,
      user: user.sub,
    })

    return messages
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @User() user: AuthUser) {
    await this.messageRepository.nativeDelete({
      conversation: id,
      user: user.sub,
    })
    await this.conversationRepository.nativeDelete({ id, user: user.sub })
    return true
  }

  chunkSubstr(str, size): string[] {
    const numChunks = Math.ceil(str.length / size)
    const chunks = new Array(numChunks)

    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
      chunks[i] = str.substr(o, size)
    }

    return chunks
  }

  @Put()
  async update(@Body() input: ConversationInput, @User() user: AuthUser) {
    await this.conversationRepository.nativeUpdate(
      {
        id: input.id,
        user: user.sub,
      },
      input,
    )

    if (input.context) {
      const contextBlocks = this.chunkSubstr(input.context, 300)
      const embeddings = await this.chatService.createEmbeddings(contextBlocks)

      await Promise.all(
        embeddings.data.map(async (embedding) => {
          await this.sqlService.db.any(
            'delete from context_embedding where conversation_id = ${conversationId}',
            { conversationId: input.id },
          )
          await this.sqlService.db.any(
            'insert into context_embedding (conversation_id, embedding, chunk) values (${conversationId}, ${embedding}, ${chunk})',
            {
              conversationId: input.id,
              embedding: embedding.embedding,
              chunk: contextBlocks[embedding.index],
            },
          )
        }),
      )
    }

    return true
  }

  @Post()
  async create(@Body() input: ConversationInput, @User() user: AuthUser) {
    const conversation = this.conversationRepository.create({
      ...input,
      user: user.sub,
    })
    await this.em.persistAndFlush(conversation)

    return conversation
  }
  @Post(':id')
  async chat(
    @Param('id') id: string,
    @Body() input: MessageInput,
    @User() user: AuthUser,
  ) {
    const conversation = await this.conversationRepository.findOne(
      { id, user: user.sub },
      {
        populate: ['messages'],
      },
    )
    if (!conversation) {
      throw new Error('invalid conversation id')
    }
    let context: string[]
    if (conversation.context) {
      const inputEmbedding = (
        await this.chatService.createEmbeddings([input.content])
      ).data[0].embedding
      context = await this.sqlService.db.map<string>(
        'select chunk from context_embedding where conversation_id = ${conversationId} order by embedding <=> ${input} LIMIT 5',
        {
          input: pgvector.toSql(inputEmbedding),
          conversationId: conversation.id,
        },
        (result) => result.chunk,
      )
    }
    const prompt: Prompt = {
      systemMsg: conversation.systemMsg,
      context: context?.join('\n'),
      messages: [
        ...conversation.messages
          .getItems()
          .map((msg) => ({ content: msg.content, role: msg.role })),
        { content: input.content, role: 'user' },
      ],
    }
    const response = await this.chatService.sendPrompt(prompt)
    const message1 = this.messageRepository.create({
      content: input.content,
      role: 'user',
      cost: response.promptCost,
      user: user.sub,
    })
    const message2 = this.messageRepository.create({
      ...response.message,
      user: user.sub,
    })
    conversation.messages.add(message1, message2)

    await this.em.persistAndFlush(conversation)

    return response
  }
}
