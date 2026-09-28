import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export function resolveRootEnvPath(): string {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return '/home/dare/project/Onxy_gym/.env';
}

export function loadRootEnv(): void {
  const envPath = resolveRootEnvPath();
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

loadRootEnv();
