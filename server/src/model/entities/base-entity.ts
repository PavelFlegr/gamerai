import { Entity, PrimaryKey, Property } from '@mikro-orm/core'
import { nanoid } from 'nanoid'

export abstract class BaseEntity {
  @PrimaryKey()
  id = nanoid()

  @Property()
  createdAt = new Date()

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date()
}
