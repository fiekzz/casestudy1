import jwt from "@elysiajs/jwt";
import type { ElysiaApp } from "../..";
import { t } from "elysia";
import { prisma } from "../../app/prisma";
import { DateTime } from "luxon";

export default (app: ElysiaApp) => {
  app
    .use(jwt({ secret: process.env.JWT_SECRET! }))
    .post(
      "/",
      async ({ body, jwt }) => {
        const reqData = body;

        const userCandidate = await prisma.users.findFirst({
          where: {
            email: reqData.email,
          },
          select: {
            userID: true,
            fullName: true,
            password: true,
            roles: true,
            email: true,
          },
        });

        if (!userCandidate) {
          return {
            success: false,
            message: "User not found",
            data: {},
            date: DateTime.now().toISO(),
          };
        }

        const passwordMatch = Bun.password.verifySync(
          reqData.password,
          userCandidate.password
        );

        if (!passwordMatch) {
          return {
            success: false,
            message: "Password not match",
            data: {},
            date: DateTime.now().toISO(),
          };
        }

        const token = await jwt.sign({
          sub: userCandidate.userID,
          email: userCandidate.email,
            //   @ts-ignore
          role: userCandidate.roles.map((item) => item.roleName.toLowerCase()),
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
        });

        return {
          message: "Login success",
          data: {
            userId: userCandidate.userID,
            token,
          },
          date: DateTime.now().toISO(),
          success: true,
        };


      },
      {
        body: t.Object({
          email: t.String(),
          password: t.String(),
        }),
      }
    );

  return app;
};
