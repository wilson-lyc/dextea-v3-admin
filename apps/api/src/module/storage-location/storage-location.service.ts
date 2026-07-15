import { BizError } from '@/common/exceptions/index.js';
import { createStorageAdapter } from '@/plugins/storage/index.js';
import { encryptSecret } from '@/utils/crypto.js';
import { storageLocationRepository } from './storage-location.repository.js';
import { StorageLocationErrorCodes } from './storage-location.errorcode.js';
import type { StorageLocationRow } from './storage-location.repository.js';
import type {
  CreateStorageLocationRequest,
  StorageLocation,
  TestStorageLocationConnectionRequest,
  UpdateStorageLocationRequest,
} from '@dextea-admin/contracts';

const SECRET_MASK = '********';

/** 将数据库行映射为前端 DTO：secretKey 脱敏、forcePathStyle 转为布尔 */
function toDTO(row: StorageLocationRow): StorageLocation {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    region: row.region,
    endpoint: row.endpoint,
    bucket: row.bucket,
    accessKey: row.accessKey,
    secretKey: SECRET_MASK,
    forcePathStyle: row.forcePathStyle === 1,
    publicBaseUrl: row.publicBaseUrl,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const storageLocationService = {
  async getList(params: {
    page: number;
    pageSize: number;
    keyword?: string;
  }) {
    const { items, total, page, pageSize } = await storageLocationRepository.getList(
      params.page,
      params.pageSize,
      params.keyword,
    );
    return {
      items: items.map((row) => toDTO(row)),
      total,
      page,
      pageSize,
    };
  },

  async getById(id: number) {
    const row = await storageLocationRepository.getById(id);
    if (!row) throw new BizError(StorageLocationErrorCodes.NOT_FOUND);
    return toDTO(row);
  },

  async getOptions() {
    return storageLocationRepository.getOptions();
  },

  async create(input: CreateStorageLocationRequest) {
    if (await storageLocationRepository.nameExists(input.name)) {
      throw new BizError(StorageLocationErrorCodes.NAME_CONFLICT);
    }
    const id = await storageLocationRepository.create({
      name: input.name,
      provider: input.provider,
      region: input.region,
      endpoint: input.endpoint,
      bucket: input.bucket,
      accessKey: input.accessKey,
      secretKey: encryptSecret(input.secretKey),
      forcePathStyle: input.forcePathStyle ? 1 : 0,
      publicBaseUrl: input.publicBaseUrl,
      status: input.status ?? 1,
    });
    return { id };
  },

  async update(id: number, input: UpdateStorageLocationRequest) {
    const existing = await storageLocationRepository.getById(id);
    if (!existing) throw new BizError(StorageLocationErrorCodes.NOT_FOUND);

    if (input.name && input.name !== existing.name) {
      if (await storageLocationRepository.nameExists(input.name, id)) {
        throw new BizError(StorageLocationErrorCodes.NAME_CONFLICT);
      }
    }

    const patch: Partial<typeof storageLocationsTable.$inferInsert> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.provider !== undefined) patch.provider = input.provider;
    if (input.region !== undefined) patch.region = input.region;
    if (input.endpoint !== undefined) patch.endpoint = input.endpoint;
    if (input.bucket !== undefined) patch.bucket = input.bucket;
    if (input.accessKey !== undefined) patch.accessKey = input.accessKey;
    // secretKey 留空表示保留原值（沿用库中既有密文），仅当填写时才重新加密
    if (input.secretKey) patch.secretKey = encryptSecret(input.secretKey);
    if (input.forcePathStyle !== undefined) patch.forcePathStyle = input.forcePathStyle ? 1 : 0;
    if (input.publicBaseUrl !== undefined) patch.publicBaseUrl = input.publicBaseUrl;
    if (input.status !== undefined) patch.status = input.status;

    await storageLocationRepository.update(id, patch);
    const updated = await storageLocationRepository.getById(id);
    return updated ? toDTO(updated) : toDTO(existing);
  },

  async remove(id: number) {
    const existing = await storageLocationRepository.getById(id);
    if (!existing) throw new BizError(StorageLocationErrorCodes.NOT_FOUND);
    await storageLocationRepository.delete(id);
    return { id };
  },

  async testConnection(input: TestStorageLocationConnectionRequest) {
    const adapter = createStorageAdapter({
      provider: input.provider,
      region: input.region,
      endpoint: input.endpoint,
      bucket: input.bucket,
      accessKey: input.accessKey,
      secretKey: input.secretKey,
      forcePathStyle: input.forcePathStyle ?? false,
      publicBaseUrl: input.publicBaseUrl,
    });
    return adapter.testConnection();
  },
};
