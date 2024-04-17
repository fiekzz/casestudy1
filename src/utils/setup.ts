import Elysia, { t } from "elysia";

export const userLoginModel = new Elysia().model({
  userLoginModel: t.Object({
    email: t.String(),
    password: t.String(),
  }),
});
