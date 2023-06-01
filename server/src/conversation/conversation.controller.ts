import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { Prompt } from '../model/message.model.js'
import { ChatService } from '../chat.service.js'
import { User } from '../user.decorator.js'
import { AuthUser } from '../model/auth-user.js'
import { PrismaService } from '../prisma.service.js'
import pgvector from 'pgvector/pg'
import { ChatCompletionRequestMessage } from 'openai'
import { AuthGuard } from '../auth.guard.js'
import { ContextEmbedding } from '@prisma/client'

interface MessageInput {
  content: string
}

interface ConversationInput {
  id: string
  title: string
  systemMsg: string
  context: string
  blockSize: number
  blockCount: number
}

@Controller('api/conversation')
@UseGuards(AuthGuard)
export class ConversationController {
  constructor(
    private chatService: ChatService,
    private prisma: PrismaService,
  ) {}

  @Get()
  async list(@User() user: AuthUser) {
    return this.prisma.conversation.findMany({
      where: {
        userId: user.sub,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  @Get(':id')
  async get(@Param('id') id: string, @User() user: AuthUser) {
    return this.prisma.conversation.findFirstOrThrow({
      where: { id, userId: user.sub },
    })
  }

  @Get(':id/messages')
  async getMessages(@Param('id') id: string, @User() user: AuthUser) {
    return this.prisma.message.findMany({
      where: {
        conversationId: id,
        userId: user.sub,
      },
    })
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @User() user: AuthUser) {
    await this.prisma.conversation.deleteMany({
      where: { id, userId: user.sub },
    })

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
    await this.prisma.conversation.updateMany({
      where: { id: input.id, userId: user.sub },
      data: input,
    })

    if (input.context) {
      const contextBlocks = this.chunkSubstr(input.context, input.blockSize)
      const embeddings = await this.chatService.createEmbeddings(contextBlocks)

      await this.prisma.contextEmbedding.deleteMany({
        where: {
          conversationId: input.id,
        },
      })
      await Promise.all(
        embeddings.data.map(async (embedding) => {
          await this.prisma
            .$executeRaw`insert into "ContextEmbedding" ("conversationId", embedding, chunk) values (
            ${input.id}::uuid,
            ${embedding.embedding},
            ${contextBlocks[embedding.index]})`
        }),
      )
    }

    return true
  }

  @Post()
  async create(@Body() input: ConversationInput, @User() user: AuthUser) {
    return this.prisma.conversation.create({
      data: {
        ...input,
        user: { connect: { id: user.sub } },
      },
    })
  }
  @Post(':id')
  async chat(
    @Param('id') id: string,
    @Body() input: MessageInput,
    @User() user: AuthUser,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, userId: user.sub },
      include: { messages: true },
    })
    let context: ContextEmbedding[]
    if (conversation.context) {
      const inputEmbedding = (
        await this.chatService.createEmbeddings([input.content])
      ).data[0].embedding
      context = await this.prisma
        .$queryRaw`select chunk from "ContextEmbedding" where "conversationId" = ${id}::uuid order by embedding <=>
        ${pgvector.toSql(inputEmbedding)}::vector LIMIT 
        ${conversation.blockCount}`
    }
    const prompt: Prompt = {
      systemMsg: conversation.systemMsg,
      context: context?.map((row) => row.chunk).join('\n'),
      messages: [
        ...conversation.messages.map(
          (msg) =>
            ({
              content: msg.content,
              role: msg.role,
            } as ChatCompletionRequestMessage),
        ),
        { content: input.content, role: 'user' },
      ],
    }
    const response = await this.chatService.sendPrompt(prompt)
    await this.prisma.conversation.update({
      where: { id },
      data: {
        messages: {
          create: [
            {
              content: input.content,
              role: 'user',
              cost: response.promptCost,
              user: { connect: { id: user.sub } },
            },
            {
              ...response.message,
              user: { connect: { id: user.sub } },
            },
          ],
        },
      },
    })

    return response
  }
}
