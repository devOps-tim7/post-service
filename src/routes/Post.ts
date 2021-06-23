import express from 'express';
import PostController from '../controllers/PostController';
import { loggedIn, loggedInDontThrow } from '../middleware/Auth';
import { upload } from '../middleware/FileUpload';

const router = express.Router();

router.get('/', loggedIn, PostController.getFeed);
router.get('/forUser/:id', loggedInDontThrow, PostController.getForUser);
router.get('/tagged', loggedInDontThrow, PostController.getByTag);
router.get('/:id', loggedInDontThrow, PostController.get);
router.post('/', loggedIn, upload.single('image'), PostController.createPost);
router.post('/comment/:id', loggedIn, PostController.addComment);
router.post('/remove/:id', PostController.remove);

router.post('/like/:id', loggedIn, PostController.like);
router.post('/dislike/:id', loggedIn, PostController.dislike);
router.post('/save/:id', loggedIn, PostController.save);

router.post('/like/:id/delete', loggedIn, PostController.deleteLike);
router.post('/dislike/:id/delete', loggedIn, PostController.deleteDislike);
router.post('/save/:id/delete', loggedIn, PostController.deleteSave);

router.post('/promote', PostController.promote);

router.get('/byPostRelation/:type', loggedIn, PostController.getByRelation);

router.get('/ping', PostController.ping);

export default router;
