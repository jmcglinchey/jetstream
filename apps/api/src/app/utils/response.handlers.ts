import * as express from 'express';
import { UserFacingError, AuthenticationError, NotFoundError } from './error-handler';
import { getLoginUrl } from '../services/auth';
import { HTTP } from '@jetstream/shared/constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function healthCheck(req: express.Request, res: express.Response) {
  return res.status(200).end();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sendJson(res: express.Response, content?: any, status = 200) {
  content = content || {};
  res.status(status);

  return res.json({ data: content });
}

// TODO: implement user facing errors and system facing errors and separate them
// TODO: this should handle ALL errors, and controllers need to throw proper errors!
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function uncaughtErrorHandler(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
  console.log('[ERROR]', err.message);
  const isJson = (req.get(HTTP.HEADERS.ACCEPT) || '').includes(HTTP.CONTENT_TYPE.JSON);

  if (err instanceof UserFacingError) {
    res.status(400);
    return res.json({
      error: true,
      message: err.message,
      data: err.additionalData,
    });
  } else if (err instanceof AuthenticationError) {
    res.status(401);
    res.set(HTTP.HEADERS.X_LOGOUT, '1');
    res.set(HTTP.HEADERS.X_LOGOUT_URL, getLoginUrl());
    if (isJson) {
      return res.json({
        error: true,
        message: err.message,
        data: err.additionalData,
      });
    } else {
      return res.redirect('/oauth/login'); // TODO: can we show an error message to the user on this page or redirect to alternate page?
    }
  } else if (err instanceof NotFoundError) {
    res.status(404);
    if (isJson) {
      return res.json({
        error: true,
        message: err.message,
        data: err.additionalData,
      });
    } else {
      // TODO: do something better with localhost
      if (req.hostname === 'localhost') {
        return res.send('404');
      }
      return res.redirect('/404.html');
    }
  }

  // TODO: clean up everything below this

  console.log(err.message);
  console.error(err.stack);

  const errorMessage = 'There was an error processing the request';
  let status = err.status || 500;
  if (status < 100 || status > 500) {
    status = 500;
  }
  res.status(status);

  // Return JSON error response for all other scenarios
  return res.json({
    error: errorMessage,
    message: err.message,
    data: err.data,
  });
}