import multer from 'multer';
import mime from 'mime-types';

const storage = multer.diskStorage({
  destination: (_req, _file, next) => {
    next(null, process.env.IMAGE_DIR);
  },
  filename: (_req, file, next) => {
    const extension: string | false = mime.extension(file.mimetype);
    next(null, extension ? `${Date.now()}.${extension}` : Date.now().toString());
  },
});

export const upload = multer({
  storage,
  fileFilter: (_req, file, next) => {
    next(null, ['image/png', 'image/jpg', 'image/jpeg'].includes(file.mimetype));
  },
  limits: {
    fileSize: 8000000,
  },
});
