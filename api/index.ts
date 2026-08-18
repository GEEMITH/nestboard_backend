import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildApp } from "../src/app.js";

const app = buildApp();

export default function handler(
  req: VercelRequest,
  res: VercelResponse,
): void {
  app(req, res);
}