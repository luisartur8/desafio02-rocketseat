import { FastifyInstance } from "fastify";
import { userRoutes } from "./users/users.routes";
import { mealRoutes } from "./meals/meals.routes";

export async function routes(app: FastifyInstance) {

    app.register(userRoutes);
    app.register(mealRoutes);

}