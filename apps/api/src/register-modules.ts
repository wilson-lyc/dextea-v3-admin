import type { FastifyInstance } from 'fastify';
import { registerEmployeeModule } from './module/employees/employees.module.js';
import { registerStoreModule } from './module/stores/store.module.js';
import { registerStoreCatalogModule } from './module/store-catalog/store-catalog.module.js';
import { registerInitModule } from './module/init/init.module.js';
import { registerConfigModule } from './module/config/config.module.js';
import { registerAreaModule } from './module/areas/area.module.js';
import { registerAuthModule } from './module/auth/auth.module.js';
import { registerTagModule } from './module/tags/tag.module.js';
import { registerProductModule } from './module/products/product.module.js';
import { registerIngredientModule } from './module/ingredients/ingredient.module.js';
import { registerMenuModule } from './module/menus/menu.module.js';
import { registerCustomizationModule } from './module/customizations/customization.module.js';
import { registerDashboardModule } from './module/dashboard/dashboard.module.js';

/**
 * 注册所有业务路由模块
 * 旧版 src/routes 整体已弃用，统一由 V2 module 层接管。
 */
export async function registerModules(app: FastifyInstance) {
  await app.register(registerEmployeeModule);
  await app.register(registerStoreModule);
  await app.register(registerStoreCatalogModule);
  await app.register(registerInitModule);
  await app.register(registerConfigModule);
  await app.register(registerAreaModule);
  await app.register(registerAuthModule);
  await app.register(registerTagModule);
  await app.register(registerProductModule);
  await app.register(registerIngredientModule);
  await app.register(registerMenuModule);
  await app.register(registerCustomizationModule);
  await app.register(registerDashboardModule);
}
