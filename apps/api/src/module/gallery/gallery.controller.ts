import { z } from 'zod/v4';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import multipart from '@fastify/multipart';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { BizError } from '@/common/exceptions/index.js';
import { galleryService } from './gallery.service.js';
import { GalleryErrorCodes } from './gallery.errorcode.js';
import {
  GetGalleryImageListRequestSchema,
  GetGalleryImageListResponseSchema,
  UploadGalleryImageResponseSchema,
  DeleteGalleryImageResponseSchema,
  UpdateGalleryImageRequestSchema,
  UpdateGalleryImageResponseSchema,
} from '@dextea-admin/contracts';

/** 从 multipart 字段中安全提取字符串值（兼容 string / string[] / { value } 形态） */
function extractFieldValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return extractFieldValue(value[0]);
  if (typeof value === 'object' && 'value' in value) {
    return extractFieldValue((value as { value: unknown }).value);
  }
  return String(value);
}

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
      // 文件流消费后，busboy 才会解析其后的表单字段
      const name = extractFieldValue(data.fields?.name).trim();
      if (!name) {
        throw new BizError(GalleryErrorCodes.INVALID_FILE, '请填写图片名称');
      }

      const result = await galleryService.uploadImage({
        buffer,
        filename: data.filename,
        mimetype: data.mimetype,
        name,
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

  // 更新图片名称
  app.patch(
    '/gallery/images/:id',
    {
      schema: {
        tags: ['Gallery'],
        description: '更新图片名称',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: UpdateGalleryImageRequestSchema,
        response: {
          200: ApiResponseSchema(UpdateGalleryImageResponseSchema).describe('更新成功'),
        },
      },
    },
    async (request, _reply) => {
      const data = await galleryService.updateGalleryImageName(request.params.id, request.body);
      return ApiResponse.success(data, '更新成功');
    },
  );
};
