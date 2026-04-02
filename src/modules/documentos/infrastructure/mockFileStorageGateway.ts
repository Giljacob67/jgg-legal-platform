import type { FileStorageGateway } from "@/modules/documentos/application/contracts";

export class MockFileStorageGateway implements FileStorageGateway {
  async upload(input: { filename: string; contentType: string; bytes: Buffer }): Promise<{
    provider: "vercel_blob" | "mock";
    providerKey: string;
    url: string;
    sizeBytes: number;
  }> {
    const timestamp = Date.now();
    const providerKey = `mock/${timestamp}-${Math.random().toString(36).slice(2)}-${input.filename}`;

    return {
      provider: "mock",
      providerKey,
      url: `mock://storage/${providerKey}`,
      sizeBytes: input.bytes.length,
    };
  }

  async get(_input: { providerKey: string }): Promise<{
    downloadUrl: string;
    contentType?: string;
    size?: number;
  } | null> {
    void _input;
    return null;
  }
}
