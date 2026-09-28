import type { IncomingMessage, ServerResponse } from 'http';
import serverlessMod from '../backend/dist/serverless.js';

const handler =
  (serverlessMod as any).default?.default ||
  (serverlessMod as any).default ||
  serverlessMod;

export default async function (req: IncomingMessage, res: ServerResponse) {
  return handler(req as any, res as any);
}
