import jwt from "@elysiajs/jwt";
import type { ElysiaApp } from "../..";
import { t } from "elysia";
import { prisma } from "../../app/prisma";
import { DateTime } from "luxon";
import { bearer } from "@elysiajs/bearer";
import { UserToken } from "../../model/interfaces/user-token";
import { privileges } from "../../model/privileges";

enum WorkingStatus {
    NOTSTARTED = "NOTSTARTED",
    WORKING = "WORKING",
    FINISHED = "FINISHED",
}

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

                const data = await prisma.attendance.findFirst({
                    where: {
                        userID: decodedToken.sub,
                        checkIn: {
                            gte: DateTime.now().startOf('day').toJSDate(),
                            lt: DateTime.now().endOf('day').toJSDate(),
                        },
                    },
                    select: {
                        checkIn: true,
                        checkOut: true,
                    }
                })

                if (!data) {
                    return {
                        message: "No check-in record found",
                        data: {
                            status: WorkingStatus.NOTSTARTED,
                        },
                        success: false,
                    }
                }

                if (!data.checkOut) {
                    return {
                        message: "Working",
                        data: {
                            status: WorkingStatus.WORKING,
                        },
                        success: true,
                    }
                }

                return {
                    message: "Finished",
                    data: {
                        status: WorkingStatus.FINISHED,
                    },
                    success: true,
                }

            } catch (error) {

                set.status = 500;

                return {
                    message: "Internal server error",
                    data: {},
                    success: false,
                }

            }

        }
    )

    return app

}