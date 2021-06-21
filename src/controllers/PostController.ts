import { Request, Response } from 'express';
import moment from 'moment';
import { getManager, In } from 'typeorm';
import HttpException from '../exceptions/HttpException';
import PropertyError from '../exceptions/PropertyError';
import { PostRelationType, RelationType } from '../helpers/shared';
import { CustomRequest } from '../middleware/Auth';
import Comment from '../models/Comment';
import Post from '../models/Post';
import PostRelation from '../models/PostRelation';
import Relation from '../models/Relation';
import User from '../models/User';
import AdminService from '../services/AdminService';
import UploadService from '../services/UploadService';

const get = async (req: CustomRequest, res: Response) => {
  const post = await Post.findOne(req.params.id, {
    relations: ['comments', 'relations', 'comments.user', 'user', 'tags'],
  });

  if (!post) {
    throw new HttpException(404, [new PropertyError('base', 'Post not found!')]);
  }

  post.comments
    .sort((a, b) => b.creationDate.getTime() - a.creationDate.getTime())
    .filter((post) => !post.user.banned);
  res.send(post);
};

const getFeed = async (req: CustomRequest, res: Response) => {
  // THE HOME FEED:
  // posts from users that I FOLLOW
  // posts from users that I DID NOT MUTE
  // posts from users that I DID NOT BLOCK
  // posts from users that ARE NOT BANNED
  // posts from campaigns that MATCH MY AGE AND GENDER (todo)
  // SORTED BY EXPOSURE DATE DESCENDING

  const userId = req.user.id;

  const user = await User.findOne({ id: userId });
  const userAge = moment().diff(user.birthDate, 'years');
  console.log('AGE: ', userAge);

  const posts = await getManager().query(
    `
    select post.*, u.username from nistagram_user as u
    join post on u.id = post.user_id
    join relation on relation.object_id = u.id
    where relation.subject_id = $1
    and post.removed = false
    and u.id not in 
      (select nistagram_user.id from relation
      join nistagram_user on nistagram_user.id = relation.object_id
      where type != '1' 
      or nistagram_user.banned = true)
    and pending = false
`,
    [userId]
  );
  const transformed = posts
    .map((post) => {
      post.user = {
        username: post.username,
      };
      delete post.username;
      return post;
    })
    .sort((a, b) => b.exposureDate.getTime() - a.exposureDate.getTime());
  res.send(transformed);
};

const getForUser = async (req: CustomRequest, res: Response) => {
  const user: User = await User.findOne(req.params.id);
  const posts = await Post.find({
    where: { user },
    relations: ['comments', 'relations', 'user', 'tags'],
    order: { creationDate: 'DESC' },
  });
  posts.map((post: Post) => {
    post.comments.sort((a, b) => b.creationDate.getTime() - a.creationDate.getTime());
    return post;
  });

  res.send(posts);
};

const getByRelation = async (req: CustomRequest, res: Response) => {
  const userId = req.user.id;
  const type = isNaN(+req.params.type) ? PostRelationType.Like : +req.params.type;

  const blockedByUserIds = (
    await Relation.find({
      where: { subject_id: userId, type: RelationType.Block },
    })
  ).map((relation) => relation.object_id);

  const hasBlockedUserIds = (
    await Relation.find({
      where: { object_id: userId, type: RelationType.Block },
    })
  ).map((relation) => relation.subject_id);

  const relations = await PostRelation.find({
    where: {
      type,
      user_id: userId,
    },
    relations: ['post', 'user', 'post.user'],
  });

  const filtered = relations.filter(
    (rel) => ![...blockedByUserIds, ...hasBlockedUserIds].includes(rel.post.user.id)
  );

  res.send(filtered);
};

const getByTag = async (req: CustomRequest, res: Response) => {
  const username = (req.query.username as string) || '';

  let followedByUserIds = [];
  let blockedByUserIds = [];
  let hasBlockedUserIds = [];

  if (req.user) {
    followedByUserIds = (
      await Relation.find({
        where: { subject_id: req.user.id, type: RelationType.Follow },
        relations: ['subject', 'object'],
      })
    ).map((user) => user.object.id);

    blockedByUserIds = (
      await Relation.find({
        where: { subject_id: req.user.id, type: RelationType.Block },
      })
    ).map((relation) => relation.object_id);

    hasBlockedUserIds = (
      await Relation.find({
        where: { object_id: req.user.id, type: RelationType.Block },
      })
    ).map((relation) => relation.subject_id);
  }

  const posts = await Post.find({ relations: ['tags', 'user'] });
  const filtered = posts.filter((post) => {
    if (!post.tags.find((tag) => tag.username.includes(username))) {
      return false;
    }
    const user = post.user;
    if ([...blockedByUserIds, ...hasBlockedUserIds].includes(user.id)) {
      return false;
    }
    if (user.private) {
      if (followedByUserIds.includes(user.id)) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  });
  res.send(filtered);
};

const createPost = async (req: CustomRequest, res: Response) => {
  const user = await User.findOne(req.user.id);

  if (!user) {
    throw new HttpException(404, [new PropertyError('base', 'User not found!')]);
  }

  const description = req.body.description;
  const image = req.file.filename;
  const hidden = !!req.body.hidden;
  const exposureDate = req.body.exposureDate;
  const ageFilterLow = isNaN(+req.body.ageFilterLow) ? 0 : +req.body.ageFilterLow;
  const ageFilterHigh = isNaN(+req.body.ageFilterLow) ? 150 : +req.body.ageFilterHigh;

  const tagsIds = JSON.parse(req.body.tags);
  const tags = await User.find({ where: { id: In(tagsIds) } });

  const url: string = await UploadService.uploadToCloudinary(`${process.env.IMAGE_DIR}/${image}`);

  const post = new Post({
    user,
    description,
    image: url,
    hidden,
    exposureDate,
    ageFilterLow,
    ageFilterHigh,
    tags,
  });
  const savedPost = await post.save();

  await AdminService.createPost(savedPost);

  res.status(201).send(savedPost);
};

const createUser = async ({ body }, res: Response) => {
  let toCreate = new User({
    id: body.id,
    gender: body.gender,
    birthDate: body.birthDate,
    banned: body.banned,
    username: body.username,
    private: body.private,
  });

  const savedUser = await toCreate.save();
  res.status(201).send(savedUser);
};

const updateUser = async ({ body }, res: Response) => {
  const user = await User.findOne(body.id);

  if (!user) {
    throw new HttpException(404, [new PropertyError('base', 'User not found!')]);
  }

  user.gender = body.gender;
  user.birthDate = body.birthDate;
  user.banned = body.banned;
  user.username = body.username;
  user.private = body.private;

  const savedUser = await user.save();
  res.status(204).send(savedUser);
};

const like = async (req: CustomRequest, res: Response) => {
  res.status(200).send(await createPostRelation(req.user.id, req.params.id, PostRelationType.Like));
};

const dislike = async (req: CustomRequest, res: Response) => {
  res
    .status(200)
    .send(await createPostRelation(req.user.id, req.params.id, PostRelationType.Dislike));
};

const save = async (req: CustomRequest, res: Response) => {
  res.status(200).send(await createPostRelation(req.user.id, req.params.id, PostRelationType.Save));
};

const deleteLike = async (req: CustomRequest, res: Response) => {
  await deletePostRelation(req.user.id, req.params.id, PostRelationType.Like);
  res.status(204).end();
};

const deleteDislike = async (req: CustomRequest, res: Response) => {
  await deletePostRelation(req.user.id, req.params.id, PostRelationType.Dislike);
  res.status(204).end();
};

const deleteSave = async (req: CustomRequest, res: Response) => {
  await deletePostRelation(req.user.id, req.params.id, PostRelationType.Save);
  res.status(204).end();
};

const addComment = async (req: CustomRequest, res: Response) => {
  const user = await User.findOne(req.user.id);
  if (!user) {
    throw new HttpException(404, [new PropertyError('base', 'User not found!')]);
  }

  const post = await Post.findOne(req.params.id);
  if (!post) {
    throw new HttpException(404, [new PropertyError('base', 'Post not found!')]);
  }

  const content = req.body.content;
  const comment = new Comment({ user, post, content });

  const savedComment = await comment.save();
  res.send(savedComment);
};

const remove = async (req: Request, res: Response) => {
  const post = await Post.findOne(req.params.id);
  if (!post) {
    throw new HttpException(404, [new PropertyError('base', 'Post not found!')]);
  }
  post.removed = true;
  await post.save();
  res.status(204).end();
};

const ping = async (req: CustomRequest, res: Response) => {
  console.log(req.header('User-Agent'));
  res.status(200).send('pong');
};

export default {
  ping,
  get,
  getFeed,
  getForUser,
  getByRelation,
  getByTag,
  createPost,
  createUser,
  updateUser,
  like,
  dislike,
  save,
  deleteLike,
  deleteDislike,
  deleteSave,
  addComment,
  remove,
};

const createPostRelation = async (id: string, postId: string, type: PostRelationType) => {
  const user = await User.findOne(id);
  if (!user) {
    throw new HttpException(404, [new PropertyError('base', 'User not found!')]);
  }

  const post = await Post.findOne(postId);
  if (!post) {
    throw new HttpException(404, [new PropertyError('base', 'Post not found!')]);
  }

  const postRelation = new PostRelation({ user, post, type });
  const saved = await postRelation.save();

  if (type === PostRelationType.Like) {
    await PostRelation.delete({ post, user, type: PostRelationType.Dislike });
  }

  if (type === PostRelationType.Dislike) {
    await PostRelation.delete({ post, user, type: PostRelationType.Like });
  }

  return saved;
};

const deletePostRelation = async (id: string, postId: string, type: PostRelationType) => {
  const user = await User.findOne(id);
  if (!user) {
    throw new HttpException(404, [new PropertyError('base', 'User not found!')]);
  }

  const post = await Post.findOne(postId);
  if (!post) {
    throw new HttpException(404, [new PropertyError('base', 'Post not found!')]);
  }

  await PostRelation.delete({ post, user, type });
};
