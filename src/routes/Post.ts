import express from 'express';
import PostController from '../controllers/PostController';
import loggedIn from '../middleware/Auth';
import { upload } from '../middleware/FileUpload';

const router = express.Router();

router.get('/', loggedIn(false), PostController.getFeed);
router.get('/forUser/:id', loggedIn(true), PostController.getForUser);
router.get('/tagged', loggedIn(true), PostController.getByTag);
router.get('/:id', loggedIn(true), PostController.get);
router.post('/', loggedIn(false), upload.single('image'), PostController.createPost);
router.post('/comment/:id', loggedIn(false), PostController.addComment);
router.post('/remove/:id', PostController.remove);

router.post('/like/:id', loggedIn(false), PostController.like);
router.post('/dislike/:id', loggedIn(false), PostController.dislike);
router.post('/save/:id', loggedIn(false), PostController.save);

router.post('/like/:id/delete', loggedIn(false), PostController.deleteLike);
router.post('/dislike/:id/delete', loggedIn(false), PostController.deleteDislike);
router.post('/save/:id/delete', loggedIn(false), PostController.deleteSave);

router.post('/promote', PostController.promote);

router.get('/byPostRelation/:type', loggedIn(false), PostController.getByRelation);

router.get('/ping', PostController.ping);

export default router;
