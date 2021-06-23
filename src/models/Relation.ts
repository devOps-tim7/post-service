import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { RelationType } from '../helpers/shared';
import User from './User';

@Entity()
export default class Relation extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'object_id' })
  object: User;

  @PrimaryColumn()
  subject_id: string;

  @PrimaryColumn()
  object_id: string;

  @PrimaryColumn()
  type: RelationType;

  @Column({ default: false })
  pending: boolean;

  constructor(relation?: { subject: User; object: User; type: RelationType; pending: boolean }) {
    super();
    this.subject = relation?.subject;
    this.object = relation?.object;
    this.type = relation?.type;
    this.pending = relation?.pending;
  }
}
