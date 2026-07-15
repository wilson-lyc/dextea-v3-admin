import { createModuleClient, type ApiResponse, type PaginatedData } from "./client"
import type {
  GalleryImage,
  GetGalleryImageListRequest,
  UploadGalleryImageResponse,
  DeleteGalleryImageResponse,
} from "@dextea-admin/contracts"

// ──── DTO 类型（统一来自 @dextea-admin/contracts） ────
export type {
  GalleryImage,
  GetGalleryImageListRequest,
  UploadGalleryImageResponse,
  DeleteGalleryImageResponse,
} from "@dextea-admin/contracts"

const http = createModuleClient("gallery")

/**
 * 获取图片列表（分页）
 * GET /gallery/images
 */
export function getGalleryImages(params?: Partial<GetGalleryImageListRequest>) {
  return http
    .get<ApiResponse<PaginatedData<GalleryImage>>>("/gallery/images", { params })
    .then((res) => res.data)
}

/**
 * 上传单张图片（带上传进度回调）
 * POST /gallery/images  multipart/form-data
 * @param file 图片文件（单张）
 * @param name 图片名称（必填，用于检索）
 */
export function uploadGalleryImage(
  file: File,
  name: string,
  onProgress?: (percent: number) => void,
) {
  const form = new FormData()
  form.append("name", name)
  form.append("file", file)

  return http
    .post<ApiResponse<UploadGalleryImageResponse>>("/gallery/images", form, {
      // 显式清除默认的 application/json，让 axios 自动设置
      // multipart/form-data 及正确的 boundary，否则后端 multipart 解析会失败
      headers: { "Content-Type": undefined },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      },
    })
    .then((res) => res.data)
}

/**
 * 删除图片
 * DELETE /gallery/images/:id
 */
export function deleteGalleryImage(id: number) {
  return http
    .delete<ApiResponse<DeleteGalleryImageResponse>>(`/gallery/images/${id}`)
    .then((res) => res.data)
}
