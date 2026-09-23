import { z } from "zod";

const optionalEnvString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z.object({
  DATABASE_URL: optionalEnvString,
  OPENAI_API_KEY: optionalEnvString,
  BASIC_AUTH_USER: optionalEnvString,
  BASIC_AUTH_PASSWORD: optionalEnvString,
  SESSION_SECRET: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(32).optional(),
  ),
});

export type ServerEnv = z.infer<typeof envSchema>;

export function parseServerEnv(env: NodeJS.ProcessEnv): ServerEnv {
  return envSchema.parse(env);
}
