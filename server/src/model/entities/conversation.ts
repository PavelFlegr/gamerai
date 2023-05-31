import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  Property,
  Rel,
} from '@mikro-orm/core'
import { BaseEntity } from './base-entity.js'
import { Message } from './message.js'
import { User } from './user.js'

@Entity()
export class Conversation extends BaseEntity {
  @Property()
  title: string = 'New conversation'

  @Property({ type: 'text' })
  systemMsg: string = ''

  @Property({ type: 'text' })
  context: string = ''

  @OneToMany(() => Message, (message) => message.conversation)
  messages = new Collection<Message>(this)

  @ManyToOne(() => User)
  user: Rel<User>
}
