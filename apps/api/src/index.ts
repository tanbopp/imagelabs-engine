import { buildServer } from './server';
import { env } from './config/env';

const server = buildServer();

async function start() {
  try {
    await server.listen({
      port: env.PORT,
      host: env.HOST,
    });
    console.info(`[ImageLabs API] Listening on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();

export default server;
