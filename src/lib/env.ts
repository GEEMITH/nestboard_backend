import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["dev", "test", "prod"]).default("dev"),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.string().default("info"),

  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(32),

  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173"),

  UPLOAD_PROVIDER: z
    .enum(["local", "r2"])
    .default("local"),

  UPLOAD_LOCAL_DIR: z
    .string()
    .default("/tmp/uploads"),

  RATE_LIMIT: z.coerce
    .number()
    .int()
    .positive()
    .default(100),

  GOOGLE_CLIENT_IDS: z
    .string()
    .optional(),

  R2_ACCOUNT_ID: z
    .string()
    .optional(),

  R2_ACCESS_KEY_ID: z
    .string()
    .optional(),

  R2_SECRET_ACCESS_KEY: z
    .string()
    .optional(),

  R2_BUCKET: z
    .string()
    .optional(),

  R2_PUBLIC_BASE_URL: z
    .string()
    .optional(),
})
.superRefine((cfg, ctx) => {
  if (cfg.UPLOAD_PROVIDER === "r2") {
    const requiredKeys = [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET",
      "R2_PUBLIC_BASE_URL",
    ] as const;

    for (const key of requiredKeys) {
      if (!cfg[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required when UPLOAD_PROVIDER=r2`,
        });
      }
    }
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );

  throw new Error("Invalid environment variables");
}

export const env = parsed.data;

export const corsOrigins = parsed.data.CORS_ORIGINS
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);