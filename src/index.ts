import { Elysia } from "elysia";
import { bootstrap } from "./app/bootstrap";
import { DateTime } from "luxon";
import jwt from "@elysiajs/jwt";
import { autoroutes } from "elysia-autoroutes";
import { html } from "@elysiajs/html";
import { cors } from '@elysiajs/cors'

const app = bootstrap();

app.use(autoroutes());

app.use(cors())

app.onError(({ code, set }) => {
  if (code === "NOT_FOUND") {

    //   set.headers["Content-Type"] = "text/html";

    //   return `<html lang="en">
    //   <head>
    //     <title>404</title>
    //   </head>
    //   <body>
    //     <h1>Mano ado nate beruk</h1>
    //   </body>
    // </html>`;

    set.status = 404;

    return {
      message: "Mu cari bendo nate beruk",
      data: {},
      date: DateTime.now().toISO(),
      success: false,
    }
  }
});

app.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});

export type ElysiaApp = typeof app;
