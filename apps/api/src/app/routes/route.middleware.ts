import * as express from 'express';
import { decryptString, hexToBase64, getJsforceOauth2 } from '@jetstream/shared/node-utils';
import * as jsforce from 'jsforce';
import { UserFacingError, AuthenticationError, NotFoundError } from '../utils/error-handler';
import { UserAuthSession } from '@jetstream/types';
import { dateFromTimestamp } from '@jetstream/shared/utils';
import { HTTP } from '@jetstream/shared/constants';
import * as moment from 'moment';
import { refreshAuthToken, createOrUpdateSession } from '../services/auth';
import { isNumber } from 'lodash';

export function logRoute(req: express.Request, res: express.Response, next: express.NextFunction) {
  res.locals.path = req.path;
  // logger.info(req.method, req.originalUrl);
  console.info('[REQ]', req.method, req.originalUrl);
  next();
}

export function notFoundMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const error = new NotFoundError('Route not found');
  next(error);
}

export async function checkAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  /**
   * 1. ensure auth token exists
   * 2. check expiration of token, and if required refresh token
   */

  try {
    if (!req.session || !req.session.id || !isNumber(req.session.auth?.user?.exp)) {
      console.log('[AUTH][INVALID SESSION]');
      return next(new AuthenticationError('Unauthorized'));
    }

    const sessionAuth: UserAuthSession = req.session.auth;
    const fusionAuthExpires = dateFromTimestamp(sessionAuth.user.exp);

    if (moment().isAfter(fusionAuthExpires)) {
      const accessToken = await refreshAuthToken(sessionAuth.refresh_token);
      createOrUpdateSession(req, accessToken);
    }

    console.log('[AUTH][VALID]');
    next();
  } catch (ex) {
    console.log('[AUTH][EXCEPTION]', ex.message);
    next(new AuthenticationError('Unauthorized'));
  }
}

export function addOrgsToLocal(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.get(HTTP.HEADERS.X_SFDC_ID)) {
    try {
      const loginUrl = req.get(HTTP.HEADERS.X_SFDC_LOGIN_URL);
      const instanceUrl = req.get(HTTP.HEADERS.X_SFDC_INSTANCE_URL);
      const encryptedAccessToken = req.get(HTTP.HEADERS.X_SFDC_ACCESS_TOKEN);
      const apiVersion = req.get(HTTP.HEADERS.X_SFDC_API_VER);
      const orgNamespacePrefix = req.get(HTTP.HEADERS.X_SFDC_NAMESPACE_PREFIX);

      const [accessToken, refreshToken] = decryptString(encryptedAccessToken, hexToBase64(process.env.SFDC_CONSUMER_SECRET)).split(' ');

      const connData: jsforce.ConnectionOptions = {
        oauth2: getJsforceOauth2(loginUrl),
        instanceUrl,
        accessToken,
        refreshToken,
        maxRequest: 5,
        version: apiVersion || undefined,
      };

      if (orgNamespacePrefix) {
        connData.callOptions = { ...connData.callOptions, defaultNamespace: orgNamespacePrefix };
      }

      res.locals = res.locals || {};
      res.locals.jsforceConn = new jsforce.Connection(connData);
    } catch (ex) {
      console.log('[INIT-ORG][ERROR]', ex);
      return next(new UserFacingError('There was an error initializing the connection to Salesforce'));
    }
  }

  next();
}

export function ensureOrgExists(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!res.locals?.jsforceConn) {
    console.log('[INIT-ORG][ERROR]', 'An org did not exist on locals');
    return next(new UserFacingError('An org is required for this action'));
  }
  next();
}