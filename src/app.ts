import express, { type Express } from "express";

import { healthRouter } from "./routes/health.js";
import { propertiesRouter } from "./routes/properties.js";
import { pinoHttp } from "pino-http";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authRouter } from "./routes/auth.js";

import * as helmetModule from "helmet";

import cors from "cors";
import { corsOrigins, env } from "./lib/env.js";

import { bookingsRouter } from "./routes/bookings.js";
import { uploadsRouter } from "./routes/uploads.js";

import path from "node:path";

import { rateLimit } from "express-rate-limit";

import { reviewsRouter } from "./routes/reviews.js";
import { notificationsRouter } from "./routes/notifications.js";

const helmet = helmetModule.default;

export function buildApp(): Express {
  const app = express();

  // Behind a reverse proxy.
  // Required so express-rate-limit can correctly determine the client IP.
  app.set("trust proxy", 1);

  // Logging
  app.use(pinoHttp({ logger }));

  // Security headers
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: corsOrigins,
      credentials: false,
    }),
  );

  // JSON body parser
  app.use(
    express.json({
      limit: "1mb",
    }),
  );

  // API rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.RATE_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api", apiLimiter);

  // Health
  app.use("/api/health", healthRouter);

  // Properties
  app.use("/api/properties", propertiesRouter);

  // Authentication
  app.use("/api/auth", authRouter);

  // Bookings
  app.use("/api/bookings", bookingsRouter);

  // Reviews
  app.use("/api", reviewsRouter);

  // Uploads
  app.use("/api/uploads", uploadsRouter);

  // Notifications
  app.use("/api/notifications", notificationsRouter);

  // Local uploaded files
  app.use(
    "/uploads",
    express.static(path.resolve(env.UPLOAD_LOCAL_DIR)),
  );

  // Root endpoint
  app.get("/", (_req, res) => {
    res.send("Hello Nestboard");
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}