import './env.js';
import 'reflect-metadata';
import { Request, Response } from 'express';
export declare function bootstrapServerless(): Promise<import("express-serve-static-core").Express>;
export default function handler(req: Request, res: Response): Promise<any>;
