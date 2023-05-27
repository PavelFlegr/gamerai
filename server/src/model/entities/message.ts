import { Entity, ManyToOne, Property, Rel } from '@mikro-orm/core'
import { BaseEntity } from './base-entity.js'
import { Conversation } from './conversation.js'
import { ChatCompletionRequestMessageRoleEnum } from 'openai'
import { User } from './user.js'

@Entity()
export class Message extends BaseEntity {
  @Property()
  role: ChatCompletionRequestMessageRoleEnum

  @Property({ type: 'text' })
  content: string

  @Property({ columnType: 'double precision' })
  cost: number

  @ManyToOne(() => Conversation)
  conversation: Rel<Conversation>

  @ManyToOne(() => User)
  user: Rel<User>
}
