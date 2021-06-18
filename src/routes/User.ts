import express from 'express';
import PostController from '../controllers/PostController';

const router = express.Router();

router.post('/', PostController.createUser);
router.put('/', PostController.updateUser);

export default router;
