import { BaseEntity, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { PostRelationType } from '../helpers/shared';
import Post from './Post';
import User from './User';

@Entity()
export default class PostRelation extends BaseEntity {
  @ManyToOne(() => Post, (post) => post.relations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => User, (user) => user.relations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @PrimaryColumn()
  post_id: string;

  @PrimaryColumn()
  user_id: string;

  @PrimaryColumn({ default: PostRelationType.Like })
  type: PostRelationType;

  constructor(postRelation?: { post: Post; user: User; type: PostRelationType }) {
    super();
    this.post = postRelation?.post;
    this.user = postRelation?.user;
    this.type = postRelation?.type;
  }
}
