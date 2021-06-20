import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import Post from './Post';
import User from './User';

@Entity()
export default class Comment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, (post) => post.comments, {
    onDelete: 'CASCADE',
  })
  post: Post;

  @ManyToOne(() => User, (user) => user.comments, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ default: '' })
  content: string;

  @Column({ type: 'timestamptz' })
  creationDate: Date;

  constructor(comment?: { content: string; user: User; post: Post }) {
    super();
    this.content = comment?.content;
    this.user = comment?.user;
    this.post = comment?.post;
    this.creationDate = new Date();
  }
}
