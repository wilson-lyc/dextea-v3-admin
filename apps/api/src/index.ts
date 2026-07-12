import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  ZodTypeProvider,
  jsonSchemaTransform,
  validatorCompiler,
  serializerCompiler,
} from 'fastify-type-provider-zod';
import { config } from './config/index.js';
// [已弃用] 旧版 routes 路由，统一由 module 层（V2）接管，代码保留但取消注册
// import { registerRoutes } from './routes/index.js';
import { authHook } from './middleware/auth.js';
import { registerEmployeeModule } from './module/employees/employees.module.js';
import { registerStoreModule } from './module/stores/store.module.js';
import { registerInitModule } from './module/init/init.module.js';
import { registerConfigModule } from './module/config/config.module.js';
import { registerAreaModule } from './module/areas/area.module.js';
import { registerAuthModule } from './module/auth/auth.module.js';
import { registerTagModule } from './module/tags/tag.module.js';
import { registerProductModule } from './module/products/product.module.js';
import { registerIngredientModule } from './module/ingredients/ingredient.module.js';
import { registerMenuModule } from './module/menus/menu.module.js';
import { registerCustomizationModule } from './module/customizations/customization.module.js';
import { registerStoreStatusModule } from './module/store-status/store-status.module.js';
import { registerRedis } from './plugins/db/redis/index.js';
import { registerDb } from './plugins/db/mysql/index.js';
import { globalErrorHandler, schemaErrorFormatter } from '@/common/exceptions/index.js';

async function main() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      transport: config.isDev
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  }).withTypeProvider<ZodTypeProvider>();

  // Zod 校验编译
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // CORS 跨域
  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  });

  // MySQL 数据库连接池
  await registerDb(app);

  // Redis 缓存
  await registerRedis(app);

  // Swagger OpenAPI 文档
  await app.register(swagger, {
    transform: jsonSchemaTransform,
    openapi: {
      info: {
        title: 'DexTea Admin API',
        description: 'DexTea 茶饮连锁管理系统后端接口文档',
        version: '0.0.1',
      },
      servers: [
        {
          url: `http://localhost:${config.port}`,
          description: '开发服务器',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: '输入 Bearer token（登录接口返回的 token 值）',
          },
        },
      },
    },
  });

  // Swagger UI
  await app.register(swaggerUi, {
    routePrefix: '/api/v2/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      defaultModelsExpandDepth: 3,
    },
  });

  // 参数校验错误格式化
  app.setSchemaErrorFormatter(schemaErrorFormatter);

  // 全局异常处理
  app.setErrorHandler(globalErrorHandler);

  // 全局认证钩子
  app.addHook('preValidation', authHook);

  // 注册路由模块
  await app.register(registerEmployeeModule);
  await app.register(registerStoreModule);
  await app.register(registerInitModule);
  await app.register(registerConfigModule);
  await app.register(registerAreaModule);
  await app.register(registerAuthModule);
  await app.register(registerTagModule);
  await app.register(registerProductModule);
  await app.register(registerIngredientModule);
  await app.register(registerMenuModule);
  await app.register(registerCustomizationModule);
  await app.register(registerStoreStatusModule);

  // 启动服务
  await app.listen({ port: config.port, host: config.host });
  app.log.info(`Server running at http://${config.host}:${config.port}`);
}

main();
