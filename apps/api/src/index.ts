import { buildApp } from './app.js';
import { config } from './config/index.js';
import { registerEmployeeModule } from './module/employees/Employee.Module.js';

async function main() {
  const app = await buildApp();

  await app.register(registerEmployeeModule);

  try {
    await app.listen({ port: config.port, host: config.host });
    console.log(`Server running at http://${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
