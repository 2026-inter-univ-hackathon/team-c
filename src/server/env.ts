import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  BASIC_AUTH_USER: z.string().min(1).optional(),
  BASIC_AUTH_PASSWORD: z.string().min(1).optional(),
  SESSION_SECRET: z.string().min(32).optional(),
});

export type ServerEnv = z.infer<typeof envSchema>;

export function parseServerEnv(env: NodeJS.ProcessEnv): ServerEnv {
  return envSchema.parse(env);
}
