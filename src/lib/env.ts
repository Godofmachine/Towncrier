import { z } from 'zod';

/**
 * Environment Variable Validation
 * Ensures all required environment variables are present and valid
 */

const envSchema = z.object({
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

    // Google OAuth
    GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
    GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),

    // Application
    NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),

    // Security - Token Encryption
    TOKEN_ENCRYPTION_KEY: z.string()
        .length(64, 'TOKEN_ENCRYPTION_KEY must be exactly 64 hexadecimal characters')
        .regex(/^[0-9a-f]{64}$/, 'TOKEN_ENCRYPTION_KEY must be a valid hex string'),

    // OpenAI (Optional for AI Assistant)
    OPENAI_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables
 * @throws {Error} If validation fails with detailed error messages
 */
export function validateEnv(): Env {
    // Skip on client-side
    if (typeof window !== 'undefined') {
        return {} as Env;
    }

    try {
        return envSchema.parse({
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
            NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
            TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY,
            OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors.map(err =>
                `  ❌ ${err.path.join('.')}: ${err.message}`
            ).join('\n');

            throw new Error(
                `\n❌ Environment variable validation failed:\n\n${errorMessages}\n\n` +
                `Please check your .env.local file and ensure all required variables are set correctly.\n`
            );
        }
        throw error;
    }
}

/**
 * Check if environment is production
 */
export function isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
}

/**
 * Check if environment is development
 */
export function isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
}
