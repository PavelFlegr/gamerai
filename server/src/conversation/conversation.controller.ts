import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { Prompt, Settings } from '../model/message.model.js'
import { ChatService } from '../chat.service.js'
import { EntityManager } from '@mikro-orm/postgresql'
import { EntityRepository } from '@mikro-orm/core'
import { Message } from '../model/entities/message.js'
import { Conversation } from '../model/entities/conversation.js'
import { User } from '../user.decorator.js'
import { AuthUser } from '../model/auth-user.js'

interface MessageInput {
  settings: Settings
  content: string
}

interface ConversationInput {
  id: string
  title: string
}

@Controller('api/conversation')
export class ConversationController {
  messageRepository: EntityRepository<Message>
  conversationRepository: EntityRepository<Conversation>
  constructor(private chatService: ChatService, private em: EntityManager) {
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
    await this.conversationRepository.nativeDelete({ id, user: user.sub })
    return true
  }

  @Put()
  async update(@Body() input: ConversationInput, @User() user: AuthUser) {
    const conversation = await this.conversationRepository.nativeUpdate(
      {
        id: input.id,
        user: user.sub,
      },
      input,
    )

    return conversation
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
    const prompt: Prompt = {
      settings: input.settings,
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
