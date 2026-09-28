import './env.js';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { AppModule } from './app.module.js';

const server = express();
let isReady = false;

export async function bootstrapServerless() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      callback(null, true);
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  isReady = true;
  return server;
}

export default async function handler(req: Request, res: Response) {
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

  if (!isReady) {
    await bootstrapServerless();
  }
  return server(req, res);
}
