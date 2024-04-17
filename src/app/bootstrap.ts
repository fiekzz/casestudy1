import { ElysiaLogging } from "@otherguy/elysia-logging";
import Elysia from "elysia";


export function bootstrap() {
    const app = new Elysia();

    app.use(ElysiaLogging());

    return app;
}