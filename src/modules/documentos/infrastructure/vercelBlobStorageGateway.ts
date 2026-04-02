import "server-only";

import { put } from "@vercel/blob";
import type { FileStorageGateway } from "@/modules/documentos/application/contracts";

export class VercelBlobStorageGateway implements FileStorageGateway {
  async upload(input: { filename: string; contentType: string; bytes: Buffer }): Promise<{
    provider: "vercel_blob" | "mock";
    providerKey: string;
    url: string;
    sizeBytes: number;
  }> {
    const blob = await put(`jgg/${Date.now()}-${input.filename}`, input.bytes, {
      access: "public",
      addRandomSuffix: true,
      contentType: input.contentType,
    });

    return {
      provider: "vercel_blob",
      providerKey: blob.pathname,
      url: blob.url,
      sizeBytes: input.bytes.length,
    };
  }
}
