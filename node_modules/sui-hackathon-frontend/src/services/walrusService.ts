/**
 * Walrus Service - Official SDK Version
 *
 * This service uses the official @mysten/walrus TypeScript SDK
 * Documentation: https://sdk.mystenlabs.com/walrus
 */

import { SuiClient } from "@mysten/sui/client";
import { getFullnodeUrl } from "@mysten/sui/client";
import { walrus, WalrusFile } from "@mysten/walrus";

export interface WalrusConfig {
  network?: "testnet" | "mainnet";
  epochs?: number;
  deletable?: boolean;
}

/**
 * Walrus Service using Official SDK
 */
export class WalrusService {
  private client: any;
  private defaultEpochs: number;
  private defaultDeletable: boolean;

  constructor(config?: WalrusConfig) {
    const network = config?.network || "testnet";

    // Create SuiClient and extend with Walrus
    const suiClient = new SuiClient({ url: getFullnodeUrl(network) });

    this.client = (suiClient as any).$extend(
      walrus({
        wasmUrl:
          "https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm",
      })
    );

    this.defaultEpochs = config?.epochs || 5;
    this.defaultDeletable = config?.deletable !== undefined ? config.deletable : true;
  }

  /**
   * Upload using writeFilesFlow for browser environments
   */
  uploadWithFlow(
    files: Array<{
      contents: Uint8Array | Blob | string;
      identifier?: string;
      tags?: Record<string, string>;
    }>,
    options: {
      epochs?: number;
      deletable?: boolean;
    }
  ) {
    // Convert files to WalrusFile format
    const walrusFiles = files.map((file) => {
      const contents =
        typeof file.contents === "string"
          ? new TextEncoder().encode(file.contents)
          : file.contents;

      const fileConfig: any = { contents };
      if (file.identifier) fileConfig.identifier = file.identifier;
      if (file.tags) fileConfig.tags = file.tags;

      return WalrusFile.from(fileConfig);
    });

    // Use writeFilesFlow from Walrus SDK
    return this.client.walrus.writeFilesFlow({
      files: walrusFiles,
    });
  }

  /**
   * Read a blob
   */
  async readBlob(blobId: string): Promise<Uint8Array> {
    return await this.client.walrus.readBlob({ blobId });
  }

  /**
   * Get files
   */
  async getFiles(ids: string[]): Promise<any[]> {
    return await this.client.walrus.getFiles({ ids });
  }

  /**
   * Download as text
   */
  async downloadAsText(id: string): Promise<string> {
    const [file] = await this.client.walrus.getFiles({ ids: [id] });
    return await file.text();
  }

  /**
   * Download as JSON
   */
  async downloadAsJson<T = any>(id: string): Promise<T> {
    const [file] = await this.client.walrus.getFiles({ ids: [id] });
    return await file.json();
  }
}

/**
 * Factory function to create WalrusService
 */
export function createWalrusService(config?: WalrusConfig): WalrusService {
  return new WalrusService(config);
}
