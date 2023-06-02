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
import { ChatService } from '../chat.service.js'
import { User } from '../user.decorator.js'
import { AuthUser } from '../model/auth-user.js'
import { Collaboration } from '@prisma/client'

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
    private chatService: ChatService,
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

    const response = await this.chatService.getCollaborationResponse(
      input.instruction,
      collaboration.document,
    )

    return this.prisma.collaboration.update({
      where: { id },
      data: { ...response, cost: response.cost + collaboration.cost },
    })
  }
}
