import express, {
  type Express,
  type RequestHandler,
} from "express";

import { createRequire } from "node:module";

import { healthRouter } from "./routes/health.js";
import { propertiesRouter } from "./routes/properties.js";
import { pinoHttp } from "pino-http";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authRouter } from "./routes/auth.js";
import cors from "cors";
import { corsOrigins, env } from "./lib/env.js";
import { bookingsRouter } from "./routes/bookings.js";
import { uploadsRouter } from "./routes/uploads.js";
import { rateLimit } from "express-rate-limit";
import { reviewsRouter } from "./routes/reviews.js";
import { notificationsRouter } from "./routes/notifications.js";

const require = createRequire(import.meta.url);

const helmet = require("helmet") as (
  options?: unknown,
) => RequestHandler;

export function buildApp(): Express {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    pinoHttp({
      logger,
    }),
  );

  app.use(helmet());

  app.use(
    cors({
      origin: corsOrigins,
      credentials: false,
    }),
  );

  app.use(
    express.json({
      limit: "1mb",
    }),
  );

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.RATE_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api", apiLimiter);

  app.use(
    "/api/health",
    healthRouter,
  );

  app.use(
    "/api/properties",
    propertiesRouter,
  );

  app.use(
    "/api/auth",
    authRouter,
  );

  app.use(
    "/api/bookings",
    bookingsRouter,
  );

  app.use(
    "/api",
    reviewsRouter,
  );

  app.use(
    "/api/uploads",
    uploadsRouter,
  );

  app.use(
    "/api/notifications",
    notificationsRouter,
  );

  // Local filesystem is only used during local development.
  // Vercel production should use R2.
  if (env.UPLOAD_PROVIDER === "local") {
    const path = require("node:path") as typeof import("node:path");

    app.use(
      "/uploads",
      express.static(
        path.resolve(
          env.UPLOAD_LOCAL_DIR,
        ),
      ),
    );
  }

  app.get("/", (_req, res) => {
    res.json({
      name: "NestBoard Backend",
      status: "ok",
    });
  });

  app.use(errorHandler);

  return app;
}