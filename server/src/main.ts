import { HttpAdapterHost, NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { json } from 'express'
import process from 'process'
import { auth } from 'express-openid-connect'
import { AllExceptionsFilter } from './error.filter.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)))
  app.use(
    auth({
      authRequired: true,
      auth0Logout: false,
      baseURL: process.env.APP_HOST,
      clientID: 'OAjjVtPii74Y0xF36bsJkt2VC5vfuM6K',
      issuerBaseURL: 'https://dev-em3pzy4r5hzjo86l.us.auth0.com',
      secret: process.env.SIGN_SECRET,
      //afterCallback: async (req, res, session, decodedState) => {
      //  const user = jwt.decode(session.id_token) as {
      //    sub: string
      //    email: string
      //  }
      //  await prisma.user.upsert({
      //    where: { id: user.sub },
      //    create: { id: user.sub, email: user.email },
      //    update: { email: user.email },
      //  })
      //
      //  return session
      //},
    }),
  )
  app.use(json({ limit: '50mb' }))
  await app.listen(5555)
}

bootstrap()
