import type { ElysiaApp } from '..'

export default (app: ElysiaApp) => {

    app.get("/", async () => {

        return {
            message: "Hello World",
            data: {},
            success: true,
            timestamp: new Date().toISOString(),
        }
    })

    return app

}