import { rest } from 'msw';
import { MOCK_API_DESCRIBE } from './mock-api-describe';
import { MOCK_API_DESCRIBE_ACCOUNT } from './mock-api-describe-account';
import { MOCK_API_DESCRIBE_CONTACT } from './mock-api-describe-contact';

export const handlers = [
  // TODO: these are huge, we should probably zip them up and unzip at test runtime
  rest.get('/api/describe', (req, res, ctx) => {
    return res(ctx.json(MOCK_API_DESCRIBE));
  }),
  rest.get('/api/describe/Account', (req, res, ctx) => {
    return res(ctx.json(MOCK_API_DESCRIBE_ACCOUNT));
  }),
  rest.get('/api/describe/Contact', (req, res, ctx) => {
    return res(ctx.json(MOCK_API_DESCRIBE_CONTACT));
  }),
];
