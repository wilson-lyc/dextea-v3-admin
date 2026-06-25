import type { FastifyInstance } from 'fastify';
import { eq, inArray, sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import {
  productsTable,
  productTagRelationsTable,
  productTagsTable,
  productCustomizationsTable,
  productCustomizationRelationsTable,
} from '../db/schema.js';
import { AppError } from '../errorcode/index.js';
import { productErrors } from '../errorcode/products.js';
import { tagErrors } from '../errorcode/tags.js';
import { parsePositiveInt, validateMaxLength, validatePrice, validateStatus } from '../utils/validation.js';
import type {
  ApiResponse,
  PaginatedData,
  Product,
  ProductTag,
  ProductQuery,
  CreateProductInput,
  CreateProductResponse,
} from '@dextea/shared-types';
import { PRODUCT_STATUS_VALUES } from '@dextea/shared-types';


export async function productRoutes(app: FastifyInstance) {
  /** 商品列表 */
  app.get<{
    Querystring: ProductQuery;
    Reply: ApiResponse<PaginatedData<Product>>;
  }>('/products', {
    schema: {
      description: '商品列表',
      tags: ['Products'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', description: '页码' },
          pageSize: { type: 'string', description: '每页数量' },
          keyword: { type: 'string', description: '搜索关键词' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                      brief: { type: 'string' },
                      description: { type: 'string' },
                      status: { type: 'integer', description: '0=下架 1=可售' },
                      price: { type: 'number' },
                      tags: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer' },
                            name: { type: 'string' },
                          },
                        },
                      },
                      createdAt: { type: 'string' },
                      updatedAt: { type: 'string' },
                    },
                  },
                },
                total: { type: 'integer' },
                page: { type: 'integer' },
                pageSize: { type: 'integer' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const db = await getDb();
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const offset = (page - 1) * pageSize;
      const keyword = request.query.keyword;

      let query = db
        .select()
        .from(productsTable)
        .$dynamic();

      let countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(productsTable)
        .$dynamic();

      if (keyword) {
        const pattern = `%${keyword}%`;
        const filter = sql`${productsTable.name} like ${pattern}`;
        query = query.where(filter);
        countQuery = countQuery.where(filter);
      }

      const items = await query
        .limit(pageSize)
        .offset(offset)
        .orderBy(productsTable.id);

      if (items.length > 0) {
        const productIds = items.map(p => p.id);
        const tagRelations = await db
          .select({
            productId: productTagRelationsTable.productId,
            tagId: productTagsTable.id,
            tagName: productTagsTable.name,
          })
          .from(productTagRelationsTable)
          .innerJoin(productTagsTable, eq(productTagRelationsTable.tagId, productTagsTable.id))
          .where(inArray(productTagRelationsTable.productId, productIds));

        const tagsByProductId = new Map<number, { id: number; name: string }[]>();
        for (const rel of tagRelations) {
          if (!tagsByProductId.has(rel.productId)) {
            tagsByProductId.set(rel.productId, []);
          }
          tagsByProductId.get(rel.productId)!.push({ id: rel.tagId, name: rel.tagName });
        }

        for (const product of items) {
          (product as Product).tags = tagsByProductId.get(product.id) ?? [];
        }
      }

      const countResult = await countQuery;
      const total = Number(countResult[0]?.count ?? 0);

      return {
        code: 0,
        data: { items, total, page, pageSize },
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productErrors.LIST_FAILED);
    }
  });

  /** 新增商品 */
  app.post<{
    Body: CreateProductInput;
    Reply: ApiResponse<CreateProductResponse>;
  }>('/products', {
    schema: {
      description: '新增商品',
      tags: ['Products'],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, description: '商品名称' },
          brief: { type: 'string', description: '简介' },
          description: { type: 'string', description: '描述' },
          price: { type: 'number', description: '价格' },
          tagIds: { type: 'array', items: { type: 'integer' }, description: '标签ID列表' },
          status: { type: 'integer', description: '0=下架 1=可售' },
        },
        required: ['name'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer', description: '商品ID' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const db = await getDb();
      const { name, brief, description, price, status, tagIds } = request.body;

      validateMaxLength(name, 255, '商品名称');
      validateMaxLength(brief, 500, '简介');
      validateMaxLength(description, 2000, '描述');

      if (price !== undefined) {
        validatePrice(price);
      }
      if (status !== undefined) {
        validateStatus(status, PRODUCT_STATUS_VALUES, '商品状态');
      }

      const result = await db.insert(productsTable).values({
        name,
        brief: brief ?? '',
        description: description ?? '',
        price: price ?? 0,
        status: status ?? 1,
      });

      const insertId = Number(result[0]?.insertId ?? 0);

      if (tagIds && tagIds.length > 0) {
        await db.insert(productTagRelationsTable).values(
          tagIds.map(tagId => ({
            productId: insertId,
            tagId,
          })),
        );
      }

      return {
        code: 0,
        data: { id: insertId },
        message: '创建成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productErrors.CREATE_FAILED);
    }
  });

  /** 商品基础信息 */
  app.get<{
    Params: { id: string };
    Reply: ApiResponse<Product>;
  }>('/products/:id/basic-info', {
    schema: {
      description: '商品基础信息',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                brief: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'integer', description: '0=下架 1=可售' },
                price: { type: 'number' },
                tags: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                    },
                  },
                },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '商品ID');

      const [product] = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, id))
        .limit(1);

      if (!product) {
        throw new AppError(productErrors.PRODUCT_NOT_FOUND);
      }

      return {
        code: 0,
        data: product as Product,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productErrors.LIST_FAILED);
    }
  });

  /** 商品标签列表 */
  app.get<{
    Params: { id: string };
    Reply: ApiResponse<ProductTag[]>;
  }>('/products/:id/tags', {
    schema: {
      description: '商品标签列表',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '商品ID');

      const tags = await db
        .select({
          id: productTagsTable.id,
          name: productTagsTable.name,
        })
        .from(productTagRelationsTable)
        .innerJoin(productTagsTable, eq(productTagRelationsTable.tagId, productTagsTable.id))
        .where(eq(productTagRelationsTable.productId, id))
        .orderBy(productTagsTable.id);

      return {
        code: 0,
        data: tags,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productErrors.LIST_FAILED);
    }
  });

  /** 更新商品 */
  app.put<{
    Params: { id: string };
    Body: Partial<CreateProductInput>;
    Reply: ApiResponse<Product>;
  }>('/products/:id', {
    schema: {
      description: '更新商品',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '商品名称' },
          brief: { type: 'string', description: '简介' },
          description: { type: 'string', description: '描述' },
          price: { type: 'number', description: '价格' },
          status: { type: 'integer', description: '0=下架 1=可售' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                brief: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'integer', description: '0=下架 1=可售' },
                price: { type: 'number' },
                tags: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                    },
                  },
                },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '商品ID');
      const { name, brief, description, price, status } = request.body;

      const [product] = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, id))
        .limit(1);

      if (!product) {
        throw new AppError(productErrors.PRODUCT_NOT_FOUND);
      }

      if (name !== undefined) {
        if (!name) throw new AppError(productErrors.NAME_REQUIRED);
        validateMaxLength(name, 255, '商品名称');
      }
      validateMaxLength(brief, 500, '简介');
      validateMaxLength(description, 2000, '描述');

      if (price !== undefined) {
        validatePrice(price);
      }
      if (status !== undefined) {
        validateStatus(status, PRODUCT_STATUS_VALUES, '商品状态');
      }

      const updateData: Partial<typeof productsTable.$inferInsert> = {};
      if (name !== undefined) updateData.name = name;
      if (brief !== undefined) updateData.brief = brief;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = price;
      if (status !== undefined) updateData.status = status;

      if (Object.keys(updateData).length > 0) {
        await db
          .update(productsTable)
          .set(updateData)
          .where(eq(productsTable.id, id));
      }

      const [updated] = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, id))
        .limit(1);

      return {
        code: 0,
        data: updated as Product,
        message: '更新成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productErrors.UPDATE_FAILED);
    }
  });

  /** 添加商品标签 */
  app.post<{
    Params: { id: string };
    Body: { tagId: number };
    Reply: ApiResponse<null>;
  }>('/products/:id/tags', {
    schema: {
      description: '添加商品标签',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          tagId: { type: 'integer', description: '标签ID' },
        },
        required: ['tagId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: { type: 'null' },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const productId = parsePositiveInt(request.params.id, '商品ID');
      const { tagId } = request.body;

      // 检查商品是否存在
      const [product] = await db
        .select({ id: productsTable.id })
        .from(productsTable)
        .where(eq(productsTable.id, productId))
        .limit(1);

      if (!product) {
        throw new AppError(productErrors.PRODUCT_NOT_FOUND);
      }

      // 检查标签是否存在
      const [tag] = await db
        .select({ id: productTagsTable.id })
        .from(productTagsTable)
        .where(eq(productTagsTable.id, tagId))
        .limit(1);

      if (!tag) {
        throw new AppError(tagErrors.TAG_NOT_FOUND);
      }

      // 检查是否已关联
      const [existing] = await db
        .select()
        .from(productTagRelationsTable)
        .where(
          sql`${productTagRelationsTable.productId} = ${productId} and ${productTagRelationsTable.tagId} = ${tagId}`,
        )
        .limit(1);

      if (existing) {
        throw new AppError(productErrors.TAG_ALREADY_EXISTS);
      }

      await db.insert(productTagRelationsTable).values({ productId, tagId });

      return {
        code: 0,
        data: null,
        message: '添加成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productErrors.TAG_ADD_FAILED);
    }
  });

  /** 删除商品标签 */
  app.delete<{
    Params: { id: string; tagId: string };
    Reply: ApiResponse<null>;
  }>('/products/:id/tags/:tagId', {
    schema: {
      description: '删除商品标签',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
          tagId: { type: 'string', minLength: 1, description: '标签ID' },
        },
        required: ['id', 'tagId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: { type: 'null' },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const productId = parsePositiveInt(request.params.id, '商品ID');
      const tagId = parsePositiveInt(request.params.tagId, '标签ID');

      await db
        .delete(productTagRelationsTable)
        .where(
          sql`${productTagRelationsTable.productId} = ${productId} and ${productTagRelationsTable.tagId} = ${tagId}`,
        );

      return {
        code: 0,
        data: null,
        message: '删除成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productErrors.TAG_REMOVE_FAILED);
    }
  });

  /** 获取商品绑定的客制化项目列表 */
  app.get<{
    Params: { id: string };
    Reply: ApiResponse<{ customizationId: number; customizationName: string; displayName: string; sort: number }[]>;
  }>('/products/:id/customizations', {
    schema: {
      description: '获取商品绑定的客制化项目列表',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  customizationId: { type: 'integer' },
                  customizationName: { type: 'string' },
                  displayName: { type: 'string' },
                  sort: { type: 'integer' },
                },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const productId = parsePositiveInt(request.params.id, '商品ID');

      const rows = await db
        .select({
          customizationId: productCustomizationRelationsTable.customizationId,
          customizationName: productCustomizationsTable.name,
          displayName: productCustomizationsTable.displayName,
          sort: productCustomizationRelationsTable.sort,
        })
        .from(productCustomizationRelationsTable)
        .innerJoin(
          productCustomizationsTable,
          eq(productCustomizationRelationsTable.customizationId, productCustomizationsTable.id),
        )
        .where(eq(productCustomizationRelationsTable.productId, productId))
        .orderBy(productCustomizationRelationsTable.sort, productCustomizationRelationsTable.customizationId);

      return {
        code: 0,
        data: rows,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productErrors.CUSTOMIZATION_LIST_FAILED);
    }
  });

  /** 绑定客制化项目到商品 */
  app.post<{
    Params: { id: string };
    Body: { customizationId: number; sort?: number };
    Reply: ApiResponse<null>;
  }>('/products/:id/customizations', {
    schema: {
      description: '绑定客制化项目到商品',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          customizationId: { type: 'integer', description: '客制化项目ID' },
          sort: { type: 'integer', description: '排序序号' },
        },
        required: ['customizationId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: { type: 'null' },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const productId = parsePositiveInt(request.params.id, '商品ID');
      const customizationId = parsePositiveInt(String(request.body.customizationId), '客制化项目ID');
      const sort = request.body.sort;

      // 检查商品是否存在
      const [product] = await db
        .select({ id: productsTable.id })
        .from(productsTable)
        .where(eq(productsTable.id, productId))
        .limit(1);

      if (!product) {
        throw new AppError(productErrors.PRODUCT_NOT_FOUND);
      }

      // 检查客制化项目是否存在
      const [customization] = await db
        .select({ id: productCustomizationsTable.id })
        .from(productCustomizationsTable)
        .where(eq(productCustomizationsTable.id, customizationId))
        .limit(1);

      if (!customization) {
        throw new AppError(productErrors.CUSTOMIZATION_NOT_FOUND);
      }

      // 检查是否已绑定
      const [existing] = await db
        .select()
        .from(productCustomizationRelationsTable)
        .where(
          sql`${productCustomizationRelationsTable.productId} = ${productId} and ${productCustomizationRelationsTable.customizationId} = ${customizationId}`,
        )
        .limit(1);

      if (existing) {
        throw new AppError(productErrors.CUSTOMIZATION_ALREADY_BOUND);
      }

      await db.insert(productCustomizationRelationsTable).values({ productId, customizationId, sort: sort ?? 0 });

      return {
        code: 0,
        data: null,
        message: '绑定成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productErrors.CUSTOMIZATION_BIND_FAILED);
    }
  });

  /** 更新客制化项目绑定排序 */
  app.patch<{
    Params: { id: string; customizationId: string };
    Body: { sort: number };
    Reply: ApiResponse<null>;
  }>('/products/:id/customizations/:customizationId/sort', {
    schema: {
      description: '更新客制化项目绑定排序',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
          customizationId: { type: 'string', minLength: 1, description: '客制化项目ID' },
        },
        required: ['id', 'customizationId'],
      },
      body: {
        type: 'object',
        properties: {
          sort: { type: 'integer', description: '排序序号' },
        },
        required: ['sort'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: { type: 'null' },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const productId = parsePositiveInt(request.params.id, '商品ID');
      const customizationId = parsePositiveInt(request.params.customizationId, '客制化项目ID');
      const { sort } = request.body;

      const [existing] = await db
        .select()
        .from(productCustomizationRelationsTable)
        .where(
          sql`${productCustomizationRelationsTable.productId} = ${productId} and ${productCustomizationRelationsTable.customizationId} = ${customizationId}`,
        )
        .limit(1);

      if (!existing) {
        throw new AppError(productErrors.CUSTOMIZATION_BIND_NOT_FOUND);
      }

      await db
        .update(productCustomizationRelationsTable)
        .set({ sort })
        .where(
          sql`${productCustomizationRelationsTable.productId} = ${productId} and ${productCustomizationRelationsTable.customizationId} = ${customizationId}`,
        );

      return {
        code: 0,
        data: null,
        message: '更新排序成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productErrors.CUSTOMIZATION_SORT_UPDATE_FAILED);
    }
  });

  /** 解绑客制化项目 */
  app.delete<{
    Params: { id: string; customizationId: string };
    Reply: ApiResponse<null>;
  }>('/products/:id/customizations/:customizationId', {
    schema: {
      description: '解绑客制化项目',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
          customizationId: { type: 'string', minLength: 1, description: '客制化项目ID' },
        },
        required: ['id', 'customizationId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: { type: 'null' },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const productId = parsePositiveInt(request.params.id, '商品ID');
      const customizationId = parsePositiveInt(request.params.customizationId, '客制化项目ID');

      await db
        .delete(productCustomizationRelationsTable)
        .where(
          sql`${productCustomizationRelationsTable.productId} = ${productId} and ${productCustomizationRelationsTable.customizationId} = ${customizationId}`,
        );

      return {
        code: 0,
        data: null,
        message: '解绑成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productErrors.CUSTOMIZATION_UNBIND_FAILED);
    }
  });
}
