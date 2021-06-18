import PropertyError from './PropertyError';
class HttpException extends Error {
  status: number;
  errors: PropertyError[];
  constructor(status: number, errors: PropertyError[]) {
    super();
    this.status = status;
    this.errors = errors;
  }
}

export default HttpException;
