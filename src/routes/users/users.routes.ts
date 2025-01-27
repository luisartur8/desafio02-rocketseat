import { randomUUID } from "crypto";
import { FastifyInstance } from "fastify";
import { knex } from "../../database";
import { z } from 'zod';

export async function userRoutes(app: FastifyInstance) {

    app.post('/users', async (req, reply) => {
        const userSchema = z.object({
            name: z.string(),
            email: z.string().email()
        })
        
        let sessionId = req.cookies.sessionId;

        if (!sessionId) {
            sessionId = randomUUID();

            reply.setCookie('sessionId', sessionId, {
                path: '/',
                maxAge: 1000 * 60 * 60 * 24 * 7
            })
        }

        const { name, email } = userSchema.parse(req.body);

        const userByEmail = await knex('users').where({ email }).first();

        if (userByEmail) {
            return reply.code(400).send({ message: 'Usuário já existe!' })
        }

        await knex('users').insert({
            id: randomUUID(),
            name,
            email,
            session_id: sessionId
        })

        reply.status(201).send();

    })

}