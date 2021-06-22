import { NextFunction, Request, Response } from 'express';
import HttpException from '../exceptions/HttpException';

function errorMiddleware(
  ex: HttpException,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  const status = ex.status || 500;
  const errors = ex.errors?.length
    ? ex.errors.map((error) => ({ [error.property]: error.value }))
    : [{ default: 'Something went wrong' }];

  response.status(status).send({
    errors,
  });
}

export default errorMiddleware;
