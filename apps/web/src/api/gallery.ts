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
 */
export function uploadGalleryImage(
  file: File,
  onProgress?: (percent: number) => void,
) {
  const form = new FormData()
  form.append("file", file)

  return http
    .post<ApiResponse<UploadGalleryImageResponse>>("/gallery/images", form, {
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
