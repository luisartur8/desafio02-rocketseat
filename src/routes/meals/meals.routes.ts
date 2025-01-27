import { randomUUID } from "crypto";
import { FastifyInstance } from "fastify";
import knex from "knex";
import { z } from "zod";
import { checkSessionIdExists } from '../../middlewares/check-session-id-exists';

export async function mealRoutes(app: FastifyInstance) {

    app.post('/meals', { preHandler: [checkSessionIdExists] }, async (req, reply) => {

        const mealsSchema = z.object({
            name: z.string(),
            description: z.string(),
            date: z.coerce.date(),
            is_on_diet: z.boolean()
        })

        const { name, description, date, is_on_diet } = mealsSchema.parse(req.body);

        await knex('meals').insert({
            id: randomUUID(),
            name,
            description,
            date: date.getTime(),
            is_on_diet,
            user_id: req.user?.id
        })

        reply.status(201).send();
    })

    app.get('/meals', { preHandler: [checkSessionIdExists] }, async (req, reply) => {
        const meals = await knex('meals').where({ user_id: req.user?.id }).orderBy('date', 'desc');

        reply.status(201).send({ meals });
    })

    app.get('/meals/:mealId', { preHandler: [checkSessionIdExists] }, async (req, reply) => {

        const paramSchema = z.object({ mealId: z.string().uuid() });

        const { mealId } = paramSchema.parse(req.params);

        const meals = await knex('meals').where({ user_id: mealId }).first();

        if (!meals) {
            return reply.status(404).send({ error: 'Meal not found' })
        }

        reply.status(201).send({ meals });
    })

    app.put('/meals/:mealId', { preHandler: [checkSessionIdExists] }, async (req, reply) => {

        const paramsSchema = z.object({
            mealId: z.string().uuid()
        })

        const bodySchema = z.object({
            name: z.string(),
            description: z.string(),
            is_on_diet: z.boolean(),
            date: z.coerce.date()
        })

        const { mealId } = paramsSchema.parse(req.params);
        const { name, description, is_on_diet, date } = bodySchema.parse(req.body);

        const meal = await knex('meals').where({ id: mealId }).first();

        if (!meal) {
            return reply.status(404).send({ message: 'Meal não encontrado!' });
        }

        await knex('meals').where({ id: mealId }).update({
            name,
            description,
            is_on_diet,
            date: date.getTime()
        })

        reply.code(201).send();

    })

    app.delete('/meals/:mealId', { preHandler: [checkSessionIdExists] }, async (req, reply) => {

        const { mealId } = z.object({ mealId: z.string().uuid() }).parse(req.params);

        const meal = await knex('meals').where({ id: mealId }).first();

        if (!meal) {
            return reply.code(404).send({ message: 'Meal not Found!' });
        }

        await knex('meals').where({ id: mealId }).delete();

        reply.status(204).send()

    })

    app.get('/metrics', { preHandler: [checkSessionIdExists] }, async (req, reply) => {
        const totalMealsOnDiet = await knex('meals').where({ user_id: req.user?.id, is_on_diet: true }).count('id', { as: 'total' }).first()

        const totalMealsOffDiet = await knex('meals').where({ user_id: req.user?.id, is_on_diet: false }).count('id', { as: 'total' }).first()

        const totalMeals = await knex('meals').where({ user_id: req.user?.id }).orderBy('date', 'desc')

        const { bestOnDietSequence } = totalMeals.reduce(
            (acc, meal) => {
                if (meal.is_on_diet) {
                    acc.currentSequence += 1
                } else {
                    acc.currentSequence = 0
                }

                if (acc.currentSequence > acc.bestOnDietSequence) {
                    acc.bestOnDietSequence = acc.currentSequence
                }

                return acc
            },
            { bestOnDietSequence: 0, currentSequence: 0 },
        )

        return reply.send({
            totalMeals: totalMeals.length,
            totalMealsOnDiet: totalMealsOnDiet?.total,
            totalMealsOffDiet: totalMealsOffDiet?.total,
            bestOnDietSequence,
        })
    })

}