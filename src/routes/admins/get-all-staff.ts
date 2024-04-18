import jwt from "@elysiajs/jwt";
import type { ElysiaApp } from "../..";
import { t } from "elysia";
import { prisma } from "../../app/prisma";
import { DateTime } from "luxon";
import { bearer } from "@elysiajs/bearer";
import { UserToken } from "../../model/interfaces/user-token";
import { privileges } from "../../model/privileges";

export default (app: ElysiaApp) => {

    app
    .use(jwt({ secret: process.env.JWT_SECRET! }))
    .use(bearer())
    .get(
        "/",
        async ({ jwt, bearer, set }) => {

            try {

                const tokenResponse = await jwt.verify(bearer);

                if (!tokenResponse) {

                    set.status = 401;

                    return  {
                        message: "Unauthorized",
                        data: {},
                        success: false,
                    }
                }

                const decodedToken = tokenResponse.valueOf() as UserToken;

                const isAllowed = privileges.admins.some((privilege) => decodedToken.role.includes(privilege));

                if (!isAllowed) {

                    set.status = 403;

                    return {
                        message: "Forbidden",
                        data: {},
                        success: false,
                    }

                }

                const data = await prisma.users.findMany({
                    select: {
                        userID: true,
                        fullName: true,
                        email: true,
                        roles: true,
                        PaymentByWeek: true,
                        Attendance: true,
                    },
                })

                return {
                    message: "All staff",
                    data,
                    success: true,
                }

            } catch (error) {

                set.status = 500;

                return {
                    message: "Something went wrong",
                    data: {
                        error,
                    },
                    success: false,
                }

            }

        }
    )

    return app

}