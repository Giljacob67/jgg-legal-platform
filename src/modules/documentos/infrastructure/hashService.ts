import { createHash } from "node:crypto";
import type { FileHashService } from "@/modules/documentos/application/contracts";

export class CryptoHashService implements FileHashService {
  async sha256(bytes: Buffer): Promise<string | null> {
    try {
      return createHash("sha256").update(bytes).digest("hex");
    } catch {
      return null;
    }
  }
}
