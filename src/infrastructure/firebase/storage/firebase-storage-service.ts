import { Result } from '@domain/shared'
import type {
  StorageClient,
  StorageDownloadRequest,
  StorageUploadRequest,
} from '../types'

export type UploadAssetInput = StorageUploadRequest

export type UploadAssetResult = {
  path: string
  downloadUrl?: string
  size: number
  checksum?: string
}

export class FirebaseStorageService {
  private readonly storage: StorageClient

  constructor(storage: StorageClient) {
    this.storage = storage
  }

  async uploadAsset(input: UploadAssetInput): Promise<Result<UploadAssetResult>> {
    try {
      const response = await this.storage.upload(input)
      let downloadUrl: string | undefined

      try {
        downloadUrl = await this.storage.getDownloadUrl({ path: response.path })
      } catch {
        downloadUrl = undefined
      }

      return Result.ok({
        path: response.path,
        size: response.size,
        checksum: response.checksum,
        downloadUrl,
      })
    } catch (error) {
      const description = error instanceof Error ? error.message : 'upload failed'
      return Result.fail(description)
    }
  }

  async getDownloadUrl(input: StorageDownloadRequest): Promise<Result<string>> {
    try {
      const url = await this.storage.getDownloadUrl(input)
      return Result.ok(url)
    } catch (error) {
      const description = error instanceof Error ? error.message : 'unable to fetch download url'
      return Result.fail(description)
    }
  }

  async deleteAsset(path: string): Promise<Result<void>> {
    try {
      await this.storage.deleteObject(path)
      return Result.ok(undefined)
    } catch (error) {
      const description = error instanceof Error ? error.message : 'delete failed'
      return Result.fail(description)
    }
  }
}
