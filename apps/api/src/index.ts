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
import { config } from './config.js';
import { authHook } from './middleware/auth.js';
import { registerRedis } from './plugins/db/redis/index.js';
import { registerDb } from './plugins/db/mysql/index.js';
import { globalErrorHandler, schemaErrorFormatter } from '@/common/exceptions/index.js';
import { registerModules } from './register-modules.js';

async function main() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      transport: config.nodeEnv === 'development'
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
    credentials: config.corsCredentials,
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
      tags: [
        { name: 'Employees', description: '员工管理' },
        { name: 'Auth', description: '认证与账号' },
        { name: 'Customers', description: '顾客管理' },
        { name: 'Roles', description: '角色管理' },
        { name: 'Permissions', description: '权限管理' },
        { name: 'Stores', description: '门店管理' },
        { name: 'Products', description: '商品管理' },
        { name: 'Menus', description: '菜单管理' },
        { name: 'Ingredients', description: '原料管理' },
        { name: 'Customizations', description: '客制化管理' },
        { name: 'Tags', description: '标签管理' },
        { name: 'Gallery', description: '图库管理' },
        { name: 'Areas', description: '行政区划' },
        { name: 'Dashboard', description: '仪表盘' },
        { name: 'Config', description: '系统配置' },
        { name: 'Init', description: '系统初始化' },
        { name: 'StoreCatalog', description: '门店目录' },
      ],
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
  await registerModules(app);

  // 启动服务
  await app.listen({ port: config.port, host: config.host });
  app.log.info(`Server running at http://${config.host}:${config.port}`);
}

main();
