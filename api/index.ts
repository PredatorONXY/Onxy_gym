import type { IncomingMessage, ServerResponse } from 'http';
import serverlessMod from '../backend/dist/serverless.js';

const handler =
  (serverlessMod as any).default?.default ||
  (serverlessMod as any).default ||
  serverlessMod;

function normalizeRequestUrl(req: IncomingMessage): void {
  const rawUrl = req.url || '';
  const [pathname, search] = rawUrl.split('?');
  const isGenericApiPath =
    !pathname ||
    pathname === '/api' ||
    pathname === '/api/' ||
    pathname === '/api/index' ||
    pathname === '/api/[...path]' ||
    pathname === '/api/%5B...path%5D';

  if (isGenericApiPath) {
    const matchedPath =
      (req.headers['x-matched-path'] as string) ||
      (req.headers['x-forwarded-uri'] as string) ||
      (req.headers['x-now-route-matches'] as string);

    if (matchedPath && matchedPath.startsWith('/api') && matchedPath !== '/api' && matchedPath !== '/api/') {
      const [matchedPathname, matchedSearch] = matchedPath.split('?');
      const query = search || matchedSearch;
      req.url = query ? `${matchedPathname}?${query}` : matchedPathname;
    } else if (search) {
      const urlParams = new URLSearchParams(search);
      const pathParam = urlParams.get('path');
      if (pathParam) {
        urlParams.delete('path');
        const remainingQuery = urlParams.toString();
        const targetPath = pathParam.startsWith('/api')
          ? pathParam
          : `/api/${pathParam.startsWith('/') ? pathParam.slice(1) : pathParam}`;
        req.url = remainingQuery ? `${targetPath}?${remainingQuery}` : targetPath;
      }
    }
  }
}

export default async function (req: IncomingMessage, res: ServerResponse) {
  normalizeRequestUrl(req);
  return handler(req as any, res as any);
}
