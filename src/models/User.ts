import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Gender } from '../helpers/shared';
import Comment from './Comment';
import PostRelation from './PostRelation';

@Entity('nistagram_user')
export default class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  gender: Gender;

  @Column({ type: 'timestamptz' })
  birthDate: Date;

  @Column({ default: false })
  banned: boolean;

  @OneToMany(() => PostRelation, (relation) => relation.user, { cascade: true })
  relations: PostRelation[];

  @OneToMany(() => Comment, (comment) => comment.user, { cascade: true })
  comments: Comment[];

  constructor(user?: { id: string; gender: Gender; birthDate: Date; banned: boolean }) {
    super();
    this.id = user?.id;
    this.gender = user?.gender;
    this.birthDate = user?.birthDate;
    this.banned = user?.banned;
  }
}
