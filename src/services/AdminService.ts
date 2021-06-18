import Post from '../models/Post';
import axios from 'axios';

const BASE = 'http://gateway:8000';

const createPost = async (post: Post) => {
  const toSend = {
    id: post.id,
    userId: post.user.id,
    removed: post.removed,
  };

  await axios.post(`${BASE}/api/admin/posts`, toSend);
};

export default { createPost };
