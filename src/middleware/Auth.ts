import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import AuthException from '../exceptions/AuthException';
import User from '../models/User';

export interface CustomRequest extends Request {
  user: User;
  file: {
    filename: string;
  };
}

const loggedIn =
  (dontThrow: boolean) => (req: CustomRequest, _res: Response, next: NextFunction) => {
    let token = req.header('Authorization');
    if (!token) {
      if (dontThrow) {
        next();
      } else {
        throw new AuthException(401, 'Access denied');
      }
    } else {
      try {
        if (token.startsWith('Bearer ')) {
          // Remove Bearer from string
          token = token.slice(7, token.length).trimLeft();
          const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
          req.user = decoded;
          next();
        }
      } catch (err) {
        if (dontThrow) {
          next();
        } else {
          throw new AuthException(400, 'Invalid token');
        }
      }
    }
  };

export default loggedIn;
