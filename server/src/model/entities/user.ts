import { Entity, Property } from '@mikro-orm/core'
import { BaseEntity } from './base-entity.js'

@Entity()
export class User extends BaseEntity {
  @Property({ unique: true })
  email: string
}
