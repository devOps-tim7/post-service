import express from 'express';
import RelationController from '../controllers/RelationController';

const router = express.Router();

router.post('/', RelationController.createRelation);
router.put('/', RelationController.updateRelation);
router.post('/delete', RelationController.deleteRelation);

export default router;
