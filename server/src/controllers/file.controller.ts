import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Param,
  ParseFilePipe,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { PrismaService } from '../prisma.service.js'
import { OpenaiService } from '../services/openai.service.js'
import { User } from '../user.decorator.js'
import { AuthUser } from '../model/auth-user.js'
import { Collaboration, FileEmbedding } from '@prisma/client'
import { FileInterceptor } from '@nestjs/platform-express'
import { AuthGuard } from '../auth.guard.js'
import { chunkSubstr } from '../utils.js'
import pgvector from 'pgvector/pg'

interface SearchInput {
  query: string
}

@Controller('api/file')
@UseGuards(AuthGuard)
export class FileController {
  constructor(
    private prisma: PrismaService,
    private openaiService: OpenaiService,
  ) {}

  @Get()
  async list(@User() user) {
    return this.prisma.file.findMany({
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
    return this.prisma.file.findFirstOrThrow({
      where: { id, userId: user.sub },
    })
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @User() user: AuthUser) {
    await this.prisma.file.deleteMany({
      where: { id, userId: user.sub },
    })

    return true
  }

  @Put()
  async update(@Body() input: Collaboration, @User() user: AuthUser) {
    await this.prisma.file.updateMany({
      where: { id: input.id, userId: user.sub },
      data: input,
    })

    return true
  }

  @Post('search')
  async search(@Body() input: SearchInput, @User() user: AuthUser) {
    const inputEmbedding = await this.openaiService.getEmbeddings([input.query])
    const results = await this.prisma.$queryRaw<
      FileEmbedding[]
    >`select fe."fileId", fe.chunk, f.name from "FileEmbedding" fe
    inner join "File" f on f.id = fe."fileId" 
    where fe."userId" = ${user.sub} order by embedding <=>
        ${pgvector.toSql(
          inputEmbedding.embeddings[0].embedding,
        )}::vector LIMIT 5`

    return results
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'text/*' })],
      }),
    )
    file: Express.Multer.File,
    @User() user: AuthUser,
  ) {
    const content = file.buffer.toString()

    const result = await this.prisma.file.create({
      data: {
        name: file.originalname,
        content,
        user: { connect: { id: user.sub } },
      },
    })

    const chunks = chunkSubstr(content, 100)
    const response = await this.openaiService.getEmbeddings(chunks)

    await Promise.all(
      response.embeddings.map(async (embedding) => {
        await this.prisma
          .$executeRaw`insert into "FileEmbedding" ("fileId", embedding, chunk, "userId") values (
            ${result.id}::uuid,
            ${embedding.embedding},
            ${embedding.input},
            ${user.sub})`
      }),
    )

    return result
  }
}
