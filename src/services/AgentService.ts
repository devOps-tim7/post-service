import axios from 'axios';
import { PostPromotion } from '../helpers/shared';

const BASE = 'http://gateway:8000';

const createPostPromotions = async (promotions: PostPromotion[]) => {
  if (promotions.length === 0) {
    return;
  }
  await axios.post(`${BASE}/api/agent/postPromotions`, { promotions });
};

export default { createPostPromotions };
