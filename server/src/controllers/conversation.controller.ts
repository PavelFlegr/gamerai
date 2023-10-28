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
import { PromptResponse } from '../services/chat.service.js'
import { User } from '../user.decorator.js'
import { AuthUser } from '../model/auth-user.js'
import { PrismaService } from '../prisma.service.js'
import pgvector from 'pgvector/pg'
import { ChatCompletionRequestMessage } from 'openai'
import { AuthGuard } from '../auth.guard.js'
import { ContextEmbedding, Message } from '@prisma/client'
import { EmbeddingResponse, OpenaiService } from '../services/openai.service.js'
import { chunkSubstr } from '../utils.js'
import { ReplicateService } from '../services/replicate.service.js'
import { LlamaService } from '../services/llama.service.js'

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
    private openaiService: OpenaiService,
    private replicateService: ReplicateService,
    private llamaService: LlamaService,
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

  @Put()
  async update(@Body() input: ConversationInput, @User() user: AuthUser) {
    await this.prisma.conversation.updateMany({
      where: { id: input.id, userId: user.sub },
      data: input,
    })

    if (input.context) {
      const contextBlocks = chunkSubstr(input.context, input.blockSize)
      const response = await this.openaiService.getEmbeddings(contextBlocks)

      await this.prisma.contextEmbedding.deleteMany({
        where: {
          conversationId: input.id,
        },
      })
      await Promise.all(
        response.embeddings.map(async (embedding) => {
          await this.prisma
            .$executeRaw`insert into "ContextEmbedding" ("conversationId", embedding, chunk) values (
            ${input.id}::uuid,
            ${embedding.embedding},
            ${embedding.input})`
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

  async sendPrompt(prompt: Prompt): Promise<PromptResponse> {
    if (prompt.systemMsg !== '') {
      prompt.messages = [
        { role: 'system', content: prompt.systemMsg },
        ...prompt.messages,
      ]
    }

    if (prompt.context) {
      prompt.messages = [
        {
          role: 'system',
          content: `Here is some context that should help you answer the users question:\n${prompt.context}`,
        },
        ...prompt.messages,
      ]
    }

    const { promptCost, content, responseCost } =
      await this.openaiService.getChatCompletion(prompt.messages)

    return {
      promptCost: promptCost,
      message: {
        content: content,
        role: 'assistant',
        cost: responseCost,
      } as Message,
    }
  }

  @Post(':id')
  async chat(
    @Param('id') id: string,
    @Body() input: MessageInput,
    @User() user: AuthUser,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, userId: user.sub },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
    let context: ContextEmbedding[]
    let inputEmbedding: EmbeddingResponse
    if (conversation.context) {
      inputEmbedding = await this.openaiService.getEmbeddings([input.content])
      context = await this.prisma
        .$queryRaw`select chunk from "ContextEmbedding" where "conversationId" = ${id}::uuid order by embedding <=>
        ${pgvector.toSql(inputEmbedding.embeddings[0].embedding)}::vector LIMIT 
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
    const response = await this.sendPrompt(prompt)
    await this.prisma.conversation.update({
      where: { id },
      data: {
        messages: {
          create: [
            {
              content: input.content,
              role: 'user',
              cost: response.promptCost + (inputEmbedding?.cost ?? 0),
              user: { connect: { id: user.sub } },
            },
          ],
        },
      },
    })
    await this.prisma.conversation.update({
      where: { id },
      data: {
        messages: {
          create: [
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
