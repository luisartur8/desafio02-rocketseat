import fastify from 'fastify';
import { routes } from './routes/routes';
import cookie from '@fastify/cookie';

export const app = fastify();

app.register(cookie);

app.register(routes);