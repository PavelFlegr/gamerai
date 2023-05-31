import { Injectable, OnModuleInit } from '@nestjs/common'
import postgres from 'postgres'
import pgp from 'pg-promise'

@Injectable()
export class SqlService implements OnModuleInit {
  db: pgp.IDatabase<{}>
  onModuleInit() {
    const pg = pgp()
    this.db = pg({
      password: 'postgres',
      database: 'assistant',
      user: 'postgres',
    })
  }
}
