import { S3Storage } from "coze-coding-dev-sdk";

// 单例存储实例
let storageInstance: S3Storage | null = null;

export function getStorage(): S3Storage {
  if (!storageInstance) {
    storageInstance = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: "",
      secretKey: "",
      bucketName: process.env.COZE_BUCKET_NAME,
      region: "cn-beijing",
    });
  }
  return storageInstance;
}

// 上传 Agent 截图到对象存储
export async function uploadVisionImage(
  agentId: string,
  captureId: string,
  imageData: string, // Base64
  thumbnailData?: string, // Base64
): Promise<{ imageKey: string; thumbnailKey?: string; imageUrl: string; thumbnailUrl?: string; sizeBytes: number }> {
  const storage = getStorage();

  // 解码 Base64
  const imageBuffer = Buffer.from(imageData, "base64");
  const sizeBytes = imageBuffer.length;

  // 上传原始图片
  const imageKey = await storage.uploadFile({
    fileContent: imageBuffer,
    fileName: `vision/${agentId}/${captureId}.png`,
    contentType: "image/png",
  });

  // 生成签名 URL（7天有效期）
  const imageUrl = await storage.generatePresignedUrl({
    key: imageKey,
    expireTime: 604800,
  });

  let thumbnailKey: string | undefined;
  let thumbnailUrl: string | undefined;

  // 上传缩略图
  if (thumbnailData) {
    const thumbBuffer = Buffer.from(thumbnailData, "base64");
    thumbnailKey = await storage.uploadFile({
      fileContent: thumbBuffer,
      fileName: `vision/${agentId}/${captureId}_thumb.png`,
      contentType: "image/png",
    });

    thumbnailUrl = await storage.generatePresignedUrl({
      key: thumbnailKey,
      expireTime: 604800,
    });
  }

  return { imageKey, thumbnailKey, imageUrl, thumbnailUrl, sizeBytes };
}

// 获取截图的签名 URL
export async function getVisionUrl(imageKey: string, expireTime: number = 604800): Promise<string> {
  const storage = getStorage();
  return storage.generatePresignedUrl({ key: imageKey, expireTime });
}
