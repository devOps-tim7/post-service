import HttpException from './HttpException';
import PropertyError from './PropertyError';

class AuthException extends HttpException {
  constructor(status: number, message: string) {
    super(status, [new PropertyError('base', message)]);
  }
}

export default AuthException;
