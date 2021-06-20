import { Request, Response } from 'express';
import { getManager } from 'typeorm';
import HttpException from '../exceptions/HttpException';
import PropertyError from '../exceptions/PropertyError';
import { PostRelationType } from '../helpers/shared';
import { CustomRequest } from '../middleware/Auth';
import Comment from '../models/Comment';
import Post from '../models/Post';
import PostRelation from '../models/PostRelation';
import User from '../models/User';
import AdminService from '../services/AdminService';
import UploadService from '../services/UploadService';

const get = async (req: CustomRequest, res: Response) => {
  const post = await Post.findOne(req.params.id, {
    relations: ['comments', 'relations', 'comments.user', 'user'],
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
  const posts = await getManager().query(
    `
    select post.* from nistagram_user as u
    join post on u.id = post.user_id
    join relation on relation.object_id = u.id
    where relation.subject_id = $1
    and post.removed = false
    and u.id not in 
      (select nistagram_user.id from relation
      join nistagram_user on nistagram_user.id = relation.object_id
      where type != '1' 
      and nistagram_user.banned = true)
    and pending = false
`,
    [userId]
  );
  res.send(posts);
};

const getForUser = async (req: CustomRequest, res: Response) => {
  const user: User = await User.findOne(req.params.id);
  const posts = await Post.find({
    where: { user },
    relations: ['comments', 'relations', 'user'],
    order: { creationDate: 'DESC' },
  });
  posts.map((post: Post) => {
    post.comments.sort((a, b) => b.creationDate.getTime() - a.creationDate.getTime());
    return post;
  });

  res.send(posts);
};

const createPost = async (req: CustomRequest, res: Response) => {
  const user = await User.findOne(req.user.id);

  if (!user) {
    throw new HttpException(404, [new PropertyError('base', 'User not found!')]);
  }

  console.log(req.body);

  const description = req.body.description;
  const image = req.file.filename;
  const hidden = !!req.body.hidden;
  const exposureDate = req.body.exposureDate;

  const url: string = await UploadService.uploadToCloudinary(`${process.env.IMAGE_DIR}/${image}`);

  const post = new Post({ user, description, image: url, hidden, exposureDate });
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
