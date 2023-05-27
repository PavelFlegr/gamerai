import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { json } from 'express'
import { Logger } from 'nestjs-pino'
import process from 'process'
import { auth } from 'express-openid-connect'
import jwt from 'jsonwebtoken'
import { EntityManager } from '@mikro-orm/postgresql'
import { User } from './model/entities/user.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  const em = app.get(EntityManager).fork()
  const userRepository = em.getRepository(User)
  app.useLogger(app.get(Logger))
  app.use(
    auth({
      authRequired: true,
      auth0Logout: false,
      baseURL: 'http://127.0.0.1:5173',
      clientID: 'OAjjVtPii74Y0xF36bsJkt2VC5vfuM6K',
      issuerBaseURL: 'https://dev-em3pzy4r5hzjo86l.us.auth0.com',
      secret: process.env.SIGN_SECRET,
      afterCallback: (req, res, session, decodedState) => {
        const user = jwt.decode(session.id_token) as {
          sub: string
          email: string
        }
        userRepository
          .upsert(userRepository.create({ id: user.sub, email: user.email }))
          .then((user) => {
            userRepository.persistAndFlush(user)
          })

        return session
      },
    }),
  )
  app.use(json({ limit: '50mb' }))
  await app.listen(5555)
}

bootstrap()
