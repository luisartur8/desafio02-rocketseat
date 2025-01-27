import { config } from 'dotenv';
import { z } from 'zod';

if (process.env.NODE_ENV === 'test') {
    config({ path: '.env.test' })
} else {
    config()
}

const envSchema = z.object({
    PORT: z.coerce.number().default(3333),
    DATABASE_CLIENT: z.enum(['sqlite', 'pg']).default('sqlite'),
    DATABASE_URL: z.string(),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
})

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
    console.error('Variáveis de ambiente inválidas:', _env.error.format())
    throw new Error('Variáveis de ambiente inválidas');
}

export const env = _env.data;