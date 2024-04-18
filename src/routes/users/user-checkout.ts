import jwt from "@elysiajs/jwt";
import type { ElysiaApp } from "../..";
import { t } from "elysia";
import { prisma } from "../../app/prisma";
import { DateTime } from "luxon";
import { bearer } from "@elysiajs/bearer";
import { UserToken } from "../../model/interfaces/user-token";

export default (app: ElysiaApp) => {

    app
    .use(jwt({ secret: process.env.JWT_SECRET! }))
    .use(bearer())
    .post(
        "/",
        async ({ body, jwt, bearer}) => {

            const tokenResponse = await jwt.verify(bearer);

            if (!tokenResponse) {
                return {
                    message: "Unauthorized",
                    data: {},
                    success: false,
                }
            }

            const decodedToken = tokenResponse.valueOf() as UserToken;

            const reqData = body;

            const userCandidate = await prisma.users.findFirst({
                where: {
                    userID: decodedToken.sub,
                },
                select: {
                    userID: true,
                    roles: {
                        select: {
                            rate: true,
                        }
                    }
                }
            })

            if (!userCandidate) {
                return {
                    success: false,
                    message: "User not found",
                    data: {},
                    date: DateTime.now().toISO(),
                };
            }

            let currentDateTime = DateTime.now();

            // check if the currentdatetime is is passed 5pm
            if (currentDateTime.hour > 17) {
                currentDateTime = currentDateTime.set({ hour: 17, minute: 0, second: 0, millisecond: 0 });
            }

            const getCheckIn = await prisma.attendance.findFirst({
                where: {
                    userID: userCandidate.userID,
                    checkIn: {
                        gte: DateTime.now().startOf('day').toJSDate(),
                        lt: DateTime.now().endOf('day').toJSDate(),
                    }
                },
                select: {
                    attendanceID: true,
                    checkIn: true,
                    checkOut: true,
                }
            })

            if (!getCheckIn) {
                return {
                    success: false,
                    message: "You have not checked in today",
                    data: {},
                    date: DateTime.now().toISO(),
                }
            }

            if (getCheckIn.checkOut) {
                return {
                    success: false,
                    message: "You have already checked out today",
                    data: {},
                    date: DateTime.now().toISO(),
                }
            }

            const checkInDateTime = DateTime.fromJSDate(getCheckIn?.checkIn!);

            // get the total hours
            const totalHours = currentDateTime.diff(checkInDateTime, 'hours').hours;

            const totalAmount = Math.floor(totalHours) * userCandidate.roles[0].rate;

            const getPaymentByWeek = await prisma.paymentByWeek.findFirst({
                where: {
                    userID: userCandidate.userID,
                    startDateOfTheWeek: {
                        gte: DateTime.now().startOf('week').toJSDate(),
                        lt: DateTime.now().endOf('week').toJSDate(),
                    }
                },
                select: {
                    paymentID: true,
                    amount: true,
                    totalHours: true,
                }
            })

            let amountWork = getPaymentByWeek?.amount! + totalAmount
            let totalHoursWork = getPaymentByWeek?.totalHours! + totalHours

            if (getPaymentByWeek?.totalHours! + totalHours > 40) {
                amountWork = 40 * userCandidate.roles[0].rate;
                totalHoursWork = 40;
            }

            await prisma.paymentByWeek.update({
                where: {
                    paymentID: getPaymentByWeek?.paymentID,
                },
                data: {
                    amount: amountWork,
                    totalHours: totalHoursWork,
                }
            })

            await prisma.attendance.update({
                where: {
                    attendanceID: getCheckIn?.attendanceID,
                },
                data: {
                    checkOut: currentDateTime.toJSDate(),
                }
            })

            return {
                message: "Checkout success",
                data: {
                    user: userCandidate,
                    totalHours,
                    totalAmount,
                },
                success: true,
            }
        }
    )

    return app

}