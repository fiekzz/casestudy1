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
        async ({ body, jwt, bearer }) => {

            try {

                const tokenResponse = await jwt.verify(bearer);

                if (!tokenResponse) {

                    return  {
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

                const checkTodaysAttendance = await prisma.attendance.findFirst({
                    where: {
                        userID: userCandidate.userID,
                        checkIn: {
                            gte: DateTime.now().startOf('day').toJSDate(),
                            lt: DateTime.now().endOf('day').toJSDate(),
                        },
                    },
                    select: {
                        attendanceID: true,
                    }
                })

                if (checkTodaysAttendance) {
                    return {
                        success: false,
                        message: "You have checked in today",
                        data: {},
                        date: DateTime.now().toISO(),
                    }
                }

                let checkinTime = DateTime.now().toJSDate();

                // check if the currentdatetime is is passed 5pm
                if (DateTime.now().hour > 17) {
                    // checkinTime = DateTime.now().set({ hour: 17, minute: 0, second: 0, millisecond: 0 }).toJSDate();
                    return {
                        success: false,
                        message: "You can only check in before 5pm",
                        data: {},
                        date: DateTime.now().toISO(),
                    }
                }

                // get first date of the week
                const firstDayOfWeek = DateTime.now().startOf('week').toJSDate();

                const checkPaymentByWeek = await prisma.paymentByWeek.findFirst({
                    where: {
                        userID: userCandidate.userID,
                        startDateOfTheWeek: firstDayOfWeek,
                    },
                    select: {
                        paymentID: true,
                        totalHours: true,
                    }
                })

                if (!checkPaymentByWeek) {
                    await prisma.paymentByWeek.create({
                        data: {
                            startDateOfTheWeek: firstDayOfWeek,
                            users: {
                                connect: {
                                    userID: userCandidate.userID,
                                }
                            },
                            amount: 0,
                        }
                    })
                }

                if (checkPaymentByWeek!.totalHours! >= 40) {
                    return {
                        success: false,
                        message: "You have reached the maximum working hours for this week",
                        data: {},
                        date: DateTime.now().toISO(),
                    }
                }

                await prisma.attendance.create({
                    data: {
                        checkIn: checkinTime,
                        users: {
                            connect: {
                                userID: userCandidate.userID,
                            }
                        },
                    },
                })

                return {
                    message: "Checkin success",
                    data: {},
                    date: DateTime.now().toISO(),
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
        
        },
    )

    return app

}