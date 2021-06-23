import { Response } from 'express';
import HttpException from '../exceptions/HttpException';
import PropertyError from '../exceptions/PropertyError';
import { RelationType } from '../helpers/shared';
import { CustomRequest } from '../middleware/Auth';
import Relation from '../models/Relation';
import User from '../models/User';

const createRelation = async (req: CustomRequest, res: Response) => {
  let subject = await User.findOne(req.body.subject);
  let object = await User.findOne(req.body.object);
  const type: RelationType = req.body.type;
  const pending: boolean = req.body.pending;

  if (!object) {
    throw new HttpException(404, [new PropertyError('base', 'User not found!')]);
  }

  const relation: Relation = new Relation({ subject, object, type, pending });
  const savedRelation = await relation.save();
  res.status(201).send(savedRelation);
};

const updateRelation = async (req: CustomRequest, res: Response) => {
  let subject = await User.findOne(req.body.subject);
  let object = await User.findOne(req.body.object);
  const type: RelationType = req.body.type;
  const pending: boolean = req.body.pending;

  if (!object) {
    throw new HttpException(404, [new PropertyError('base', 'User not found!')]);
  }

  let relation: Relation = await Relation.findOne({ subject, object, type });
  relation.pending = pending;
  await relation.save();

  res.status(204).send();
};

const deleteRelation = async (req: CustomRequest, res: Response) => {
  let subject = await User.findOne(req.body.subject);
  let object = await User.findOne(req.body.object);
  const type: RelationType = req.body.type;

  if (!object) {
    throw new HttpException(404, [new PropertyError('base', 'User not found!')]);
  }

  await Relation.delete({ subject, object, type });

  res.status(204).end();
};

export default {
  createRelation,
  updateRelation,
  deleteRelation,
};
