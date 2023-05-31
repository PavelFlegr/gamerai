import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { PrismaService } from './prisma.service.js'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    const user = request.oidc.user
    await this.prisma.user.upsert({
      where: { id: user.sub },
      create: { id: user.sub, email: user.email },
      update: { email: user.email },
    })
    return true
  }
}
