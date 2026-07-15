import { z } from 'zod/v4';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import multipart from '@fastify/multipart';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { BizError } from '@/common/exceptions/index.js';
import { getStorageAdapter } from '@/plugins/storage/index.js';
import { galleryRepository } from './gallery.repository.js';
import { galleryService } from './gallery.service.js';
import { GalleryErrorCodes } from './gallery.errorcode.js';
import {
  GetGalleryImageListRequestSchema,
  GetGalleryImageListResponseSchema,
  UploadGalleryImageResponseSchema,
  DeleteGalleryImageResponseSchema,
} from '@dextea-admin/contracts';

export const registerGalleryRoutes: FastifyPluginAsyncZod = async (app) => {
  // 注册 multipart 解析（单文件、最大 10MB）
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  });

  // 上传图片（单文件，前端按文件逐个上传以获得进度反馈）
  app.post(
    '/gallery/images',
    {
      schema: {
        tags: ['Gallery'],
        description: '上传图片',
        response: {
          200: ApiResponseSchema(UploadGalleryImageResponseSchema).describe('上传成功'),
        },
      },
    },
    async (request, _reply) => {
      const data = await request.file();
      if (!data) {
        throw new BizError(GalleryErrorCodes.INVALID_FILE, '请选择要上传的文件');
      }

      const buffer = await data.toBuffer();
      const result = await galleryService.uploadImage({
        buffer,
        filename: data.filename,
        mimetype: data.mimetype,
      });

      return ApiResponse.success(result);
    },
  );

  // 获取图片列表（分页）
  app.get(
    '/gallery/images',
    {
      schema: {
        tags: ['Gallery'],
        description: '获取图片列表',
        querystring: GetGalleryImageListRequestSchema,
        response: {
          200: ApiResponseSchema(GetGalleryImageListResponseSchema).describe('图片列表'),
        },
      },
    },
    async (request, _reply) => {
      const data = await galleryService.getGalleryImageList(request.query);
      return ApiResponse.success(data);
    },
  );

  // 删除图片
  app.delete(
    '/gallery/images/:id',
    {
      schema: {
        tags: ['Gallery'],
        description: '删除图片',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        response: {
          200: ApiResponseSchema(DeleteGalleryImageResponseSchema).describe('删除成功'),
        },
      },
    },
    async (request, _reply) => {
      const data = await galleryService.deleteGalleryImage(request.params.id);
      return ApiResponse.success(data, '删除成功');
    },
  );

  // 读取图片文件（local 存储回源；S3 等云存储直接使用 url 字段，不会走到此路由）
  app.get(
    '/gallery/files/:key',
    {
      schema: {
        tags: ['Gallery'],
        description: '读取图片文件',
      },
    },
    async (request, reply) => {
      const { key } = request.params as { key: string };
      const record = await galleryRepository.getGalleryImageByObjectKey(key);
      if (!record) {
        return reply.code(404).send({ code: 404, message: '图片不存在' });
      }

      const obj = await getStorageAdapter().read(key);
      if (!obj) {
        return reply.code(404).send({ code: 404, message: '图片文件不存在' });
      }

      reply.header('Content-Type', record.contentType);
      reply.header('Cache-Control', 'public, max-age=31536000, immutable');
      return reply.send(obj.stream);
    },
  );
};
