import jwt from "@elysiajs/jwt";
import type { ElysiaApp } from "..";
import { t } from "elysia";
import { prisma } from "../app/prisma";
import { DateTime } from "luxon";

export default (app: ElysiaApp) => {

    app
    .use(jwt({ secret: process.env.JWT_SECRET! }))
    .get(
        "/",
        async ({ body, jwt }) => {

            return {
                message: "Testing",
                data: {
                    testHello: "Hello World",
                },
                success: true,
            };

        },
    )

    return app

}