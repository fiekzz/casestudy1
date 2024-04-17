import type { ElysiaApp } from '..'

export default (app: ElysiaApp) => app.get('/', { hello: 'world' })