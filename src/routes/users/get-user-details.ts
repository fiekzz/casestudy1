import jwt from "@elysiajs/jwt";
import type { ElysiaApp } from "../..";
import { t } from "elysia";
import { prisma } from "../../app/prisma";
import { DateTime } from "luxon";
import { bearer } from "@elysiajs/bearer";
import { UserToken } from "../../model/interfaces/user-token";
import { privileges } from "../../model/privileges";

export default (app:ElysiaApp) => {

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

                const data = await prisma.users.findFirst({
                    where: {
                        userID: decodedToken.sub,
                    },
                    select: {
                        userID: true,
                        fullName: true,
                        email: true,
                        roles: true,
                        PaymentByWeek: {
                            select: {
                                amount: true,
                                startDateOfTheWeek: true,
                            }
                        },
                        Attendance: {
                            orderBy: {
                                checkOut: 'desc',
                            },
                            select: {
                                checkOut: true,
                            },
                            take: 1,
                        },
                    },
                })

                const getUserWorkingTime = await prisma.attendance.findMany({
                    where: {
                        userID: decodedToken.sub,
                        checkOut: {
                            not: null,
                        }
                    },
                    select: {
                        checkIn: true,
                        checkOut: true,
                    }
                })

                const userWorkingTime = getUserWorkingTime.map((item) => {
                    const checkIn = DateTime.fromJSDate(item.checkIn ?? new Date());
                    const checkOut = DateTime.fromJSDate(item.checkOut ?? new Date());

                    return {
                        checkIn: checkIn.toFormat('yyyy-MM-dd HH:mm:ss'),
                        checkOut: checkOut.toFormat('yyyy-MM-dd HH:mm:ss'),
                        workingTime: Math.floor(checkOut.diff(checkIn, 'hours').toObject().hours ?? 0),
                    }
                })

                const totalHoursPerMonthData = await prisma.attendance.findMany({
                    where: {
                        userID: decodedToken.sub,
                        checkOut: {
                            not: null,
                            gte: DateTime.now().startOf('month').toJSDate(),
                            lt: DateTime.now().endOf('month').toJSDate(),
                        }
                    },
                    select: {
                        checkIn: true,
                        checkOut: true,
                    }
                })

                const totalHoursPerMonth = totalHoursPerMonthData.map((item) => {
                    const checkIn = DateTime.fromJSDate(item.checkIn ?? new Date());
                    const checkOut = DateTime.fromJSDate(item.checkOut ?? new Date());

                    return Math.floor(checkOut.diff(checkIn, 'hours').toObject().hours ?? 0);
                }).reduce((acc, curr) => acc + curr, 0);

                const getMaxRole = privileges.admins.some((privilege) => data?.roles.map((item) => item.roleName.toLowerCase()).includes(privilege));

                const thisMonthRevenue = totalHoursPerMonth * (getMaxRole ? 20 : 8);

                const overallRevenue = data?.PaymentByWeek.map((item) => item.amount).reduce((acc, curr) => acc + curr, 0);

                return {
                    message: "User details",
                    data,
                    userWorkingTime,
                    totalHoursPerMonth,
                    thisMonthRevenue,
                    overallRevenue,
                    success: true,
                }

            } catch (error) {

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