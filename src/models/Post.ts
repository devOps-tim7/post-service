import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Gender } from '../helpers/shared';
import Comment from './Comment';
import PostRelation from './PostRelation';
import User from './User';

@Entity()
export default class Post extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToMany(() => User, (user) => user.taggedPosts, { onDelete: 'CASCADE' })
  @JoinTable()
  tags: User[];

  @Column({ type: 'timestamptz' })
  creationDate: Date;

  @Column({ default: '' })
  image: string;

  @Column({ default: '' })
  description: string;

  @OneToMany(() => PostRelation, (relation) => relation.post, { cascade: true })
  relations: PostRelation[];

  @OneToMany(() => Comment, (comment) => comment.post, { cascade: true })
  comments: Comment[];

  @Column({ default: false })
  removed: boolean;

  // we need these for camapigns
  @Column({ type: 'timestamptz' })
  exposureDate: Date;

  @Column({ default: Gender.Everyone })
  genderFilter: Gender;

  @Column({ default: 0 })
  ageFilterLow: number;

  @Column({ default: 150 })
  ageFilterHigh: number;

  @Column({ default: false })
  hidden: boolean;

  @Column({ default: false })
  campaign: boolean;

  constructor(post?: {
    user: User;
    description: string;
    image: string;
    hidden: boolean;
    exposureDate: Date;
    ageFilterLow: number;
    ageFilterHigh: number;
    tags: User[];
    genderFilter: Gender;
  }) {
    super();
    this.user = post?.user;
    this.description = post?.description;
    this.creationDate = new Date();
    this.exposureDate = post?.exposureDate || this.creationDate;
    this.image = post?.image;
    this.hidden = post?.hidden;
    this.tags = post?.tags;
    this.genderFilter = post?.genderFilter;
  }
}
