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
import { PrismaService } from '../prisma.service.js'
import { AuthGuard } from '../auth.guard.js'
import { ChatService } from '../services/chat.service.js'
import { User } from '../user.decorator.js'
import { AuthUser } from '../model/auth-user.js'
import { Collaboration } from '@prisma/client'
import { OpenaiService } from '../services/openai.service.js'
import { LlamaService } from '../services/llama.service.js'

interface CollaborationInput {
  document: string
  title: string
}

interface Instruction {
  instruction: string
}

@Controller('api/collaboration')
@UseGuards(AuthGuard)
export class CollaborationController {
  constructor(
    private prisma: PrismaService,
    private openaiService: OpenaiService,
    private llamaService: LlamaService,
  ) {}

  @Get()
  async list(@User() user) {
    return this.prisma.collaboration.findMany({
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
    return this.prisma.collaboration.findFirstOrThrow({
      where: { id, userId: user.sub },
    })
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @User() user: AuthUser) {
    await this.prisma.collaboration.deleteMany({
      where: { id, userId: user.sub },
    })

    return true
  }

  @Put()
  async update(@Body() input: Collaboration, @User() user: AuthUser) {
    await this.prisma.collaboration.updateMany({
      where: { id: input.id, userId: user.sub },
      data: input,
    })

    return true
  }

  @Post()
  async create(@Body() input: CollaborationInput, @User() user: AuthUser) {
    return this.prisma.collaboration.create({
      data: {
        ...input,
        user: { connect: { id: user.sub } },
      },
    })
  }

  async getCollaborationResponse(document: string, instruction: string) {
    const response = await this.openaiService.getChatCompletion([
      {
        role: 'system',
        content: `You are a writing assistant. Your task is to collaborate on a document together with a user. Respond with full document modified according to users instructions, keep in mind that your response will replace the current document, make sure nothing that the user didn't specify is removed\nCurrent document:\n${document}`,
      },
      {
        role: 'user',
        content: instruction,
      },
    ])

    return {
      cost: response.promptCost + response.responseCost,
      document: response.content,
    }
  }

  @Post(':id')
  async modify(
    @Param('id') id: string,
    @Body() input: Instruction,
    @User() user: AuthUser,
  ) {
    const collaboration = await this.prisma.collaboration.findFirstOrThrow({
      where: {
        userId: user.sub,
        id: id,
      },
    })

    const response = await this.getCollaborationResponse(
      input.instruction,
      collaboration.document,
    )

    return this.prisma.collaboration.update({
      where: { id },
      data: { ...response, cost: response.cost + collaboration.cost },
    })
  }
}
