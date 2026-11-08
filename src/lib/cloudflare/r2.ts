import "server-only";
import { DeleteObjectsCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

function client() {
  const config = env();
  if (!config.R2_ACCESS_KEY_ID || !config.R2_SECRET_ACCESS_KEY || !config.R2_ENDPOINT) throw new Error("R2 is not configured");
  return new S3Client({ region: "auto", endpoint: config.R2_ENDPOINT, credentials: { accessKeyId: config.R2_ACCESS_KEY_ID, secretAccessKey: config.R2_SECRET_ACCESS_KEY } });
}

export async function signedUpload(key: string, contentType: string, length: number) {
  return getSignedUrl(client(), new PutObjectCommand({ Bucket: env().R2_BUCKET_NAME, Key: key, ContentType: contentType, ContentLength: length }), { expiresIn: 300 });
}

export async function signedDownload(key: string, filename?: string) {
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: env().R2_BUCKET_NAME, Key: key, ResponseContentDisposition: filename ? `attachment; filename="${filename.replaceAll('"', "")}"` : undefined }), { expiresIn: 300 });
}

export async function headObject(key: string) {
  return client().send(new HeadObjectCommand({ Bucket: env().R2_BUCKET_NAME, Key: key }));
}

export async function getObjectBytes(key: string) {
  const response = await client().send(new GetObjectCommand({ Bucket: env().R2_BUCKET_NAME, Key: key }));
  if (!response.Body) throw new Error("Object body is empty");
  return Buffer.from(await response.Body.transformToByteArray());
}

export async function putObjectBytes(key: string, bytes: Buffer, contentType: string) {
  return client().send(new PutObjectCommand({ Bucket: env().R2_BUCKET_NAME, Key: key, Body: bytes, ContentType: contentType, ContentLength: bytes.byteLength }));
}

export async function deleteObjectKeys(keys: string[]) {
  const unique = [...new Set(keys.filter(Boolean))];
  for (let index = 0; index < unique.length; index += 1000) {
    const batch = unique.slice(index, index + 1000);
    await client().send(new DeleteObjectsCommand({ Bucket: env().R2_BUCKET_NAME, Delete: { Objects: batch.map(Key => ({ Key })), Quiet: true } }));
  }
}
