import 'dotenv/config';
import Fastify, { type FastifyError } from 'fastify';
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
import { BizError } from '@/common/exceptions/index.js';
import { ApiResponse } from '@/common/types/index.js';
import { SystemErrorCodes } from '@/module/system/system.errorcode.js';

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
  app.setSchemaErrorFormatter((errors, _dataVar) => {
    const err = errors[0];
    if (!err) return new Error('请求参数校验失败');

    let message: string;
    switch (err.keyword) {
      case 'required': {
        const field = (err.params as { missingProperty?: string }).missingProperty ?? '';
        message = `缺少必填字段「${field}」`;
        break;
      }
      case 'type': {
        const field = err.instancePath.replace(/^\//, '');
        message = field ? `「${field}」格式不正确` : '请求参数格式不正确';
        break;
      }
      case 'minLength': {
        const field = err.instancePath.replace(/^\//, '');
        message = `「${field}」不能为空`;
        break;
      }
      case 'minimum':
      case 'maximum': {
        const field = err.instancePath.replace(/^\//, '');
        message = `「${field}」超出范围`;
        break;
      }
      case 'enum': {
        const field = err.instancePath.replace(/^\//, '');
        message = `「${field}」的值无效`;
        break;
      }
      default:
        message = err.message ?? '请求参数校验失败';
    }

    return new Error(message);
  });

  // 全局异常处理
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error instanceof BizError) {
      return reply.status(error.httpStatus).send(
        ApiResponse.error(error.code, error.message),
      );
    }

    // Fastify 验证错误
    if (error.validation) {
      return reply.status(400).send(
        ApiResponse.error(400, error.message),
      );
    }

    // 未知错误
    reply.log.error(error);
    return reply.status(500).send(
      ApiResponse.error(SystemErrorCodes.INTERNAL_ERROR.code, SystemErrorCodes.INTERNAL_ERROR.message),
    );
  });

  // 全局认证钩子
  app.addHook('preHandler', authHook);

  // 注册路由模块
  // [已弃用] 旧版 routes 路由整体取消注册（代码保留在 src/routes 下，未删除）
  // await registerRoutes(app);
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
