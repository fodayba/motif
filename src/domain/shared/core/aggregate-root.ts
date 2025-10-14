import { Entity } from './entity'
import type { DomainEvent } from './domain-event.ts'
import { UniqueEntityID } from './unique-entity-id'

export abstract class AggregateRoot<Props> extends Entity<Props> {
  private domainEvents: DomainEvent[] = []

  protected addDomainEvent(event: DomainEvent) {
    this.domainEvents.push(event)
  }

  public pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents]
    this.domainEvents = []
    return events
  }

  protected constructor(props: Props, id?: UniqueEntityID) {
    super(props, id)
  }
}
