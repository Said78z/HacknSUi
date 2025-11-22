import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { createWalrusService } from "@/services/walrusService";
import { ClipLoader } from "react-spinners";
import { WriteFilesFlow } from "@mysten/walrus";

type UploadTab = "file" | "text" | "json";

interface UploadedItem {
  blobId: string;
  id: string;
  url: string;
  size: number;
  type: string;
  timestamp: number;
  filename?: string;
}

export function WalrusUpload() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  const walrus = useMemo(() => {
    if (typeof window === "undefined") {
      return null as any;
    }
    return createWalrusService({ network: "testnet", epochs: 10 });
  }, []);

  const [activeTab, setActiveTab] = useState<UploadTab>("file");
  const [uploading, setUploading] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [textContent, setTextContent] = useState("");
  const [jsonContent, setJsonContent] = useState("");

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!currentAccount) {
      setError("Please connect your wallet first");
      return;
    }

    if (!walrus) {
      setError("Walrus service not available. Please refresh the page.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const contents = await file.arrayBuffer();

      const flow: WriteFilesFlow = walrus.uploadWithFlow(
        [
          {
            contents: new Uint8Array(contents),
            identifier: file.name,
            tags: { "content-type": file.type || "application/octet-stream" },
          },
        ],
        { epochs: 10, deletable: true }
      );

      await flow.encode();

      const registerTx = flow.register({
        owner: currentAccount.address,
        epochs: 10,
        deletable: true,
      });

      let registerDigest: string;
      let blobObjectId: string | null = null;
      await new Promise<void>((resolve, reject) => {
        signAndExecute(
          { transaction: registerTx },
          {
            onSuccess: async ({ digest }) => {
              try {
                registerDigest = digest;
                const result = await suiClient.waitForTransaction({
                  digest,
                  options: {
                    showEffects: true,
                    showEvents: true,
                  },
                });

                if (result.events) {
                  const blobRegisteredEvent = result.events.find((event) =>
                    event.type.includes("BlobRegistered")
                  );

                  if (blobRegisteredEvent?.parsedJson) {
                    const eventData = blobRegisteredEvent.parsedJson as {
                      object_id?: string;
                      objectId?: string;
                    };
                    blobObjectId =
                      eventData.object_id || eventData.objectId || null;
                  }
                }
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            onError: reject,
          }
        );
      });

      await flow.upload({ digest: registerDigest! });

      const certifyTx = flow.certify();

      await new Promise<void>((resolve, reject) => {
        signAndExecute(
          { transaction: certifyTx },
          {
            onSuccess: async ({ digest }) => {
              try {
                await suiClient.waitForTransaction({ digest });
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            onError: reject,
          }
        );
      });

      const files = await flow.listFiles();
      const blobId = files[0]?.blobId;

      if (!blobId) {
        throw new Error("Failed to get blobId after upload");
      }

      const metadataId = blobObjectId || blobId;

      const uploadedItem: UploadedItem = {
        blobId,
        id: metadataId,
        url: `https://aggregator.walrus-testnet.walrus.space/v1/${blobId}`,
        size: file.size,
        type: file.type || "application/octet-stream",
        timestamp: Date.now(),
        filename: file.name,
      };
      setUploadHistory([uploadedItem, ...uploadHistory]);
      setSuccess(`File "${file.name}" uploaded successfully!`);

      event.target.value = "";
    } catch (err) {
      setError(
        `Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleTextUpload = async () => {
    if (!textContent.trim()) {
      setError("Please enter some text to upload");
      return;
    }

    if (!currentAccount) {
      setError("Please connect your wallet first");
      return;
    }

    if (!walrus) {
      setError("Walrus service not available. Please refresh the page.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const flow = walrus.uploadWithFlow(
        [
          {
            contents: textContent,
            identifier: "text.txt",
            tags: { "content-type": "text/plain" },
          },
        ],
        { epochs: 10, deletable: true }
      );

      await flow.encode();

      const registerTx = flow.register({
        owner: currentAccount.address,
        epochs: 10,
        deletable: true,
      });

      let registerDigest: string;
      let blobObjectId: string | null = null;
      await new Promise<void>((resolve, reject) => {
        signAndExecute(
          { transaction: registerTx },
          {
            onSuccess: async ({ digest }) => {
              try {
                registerDigest = digest;
                const result = await suiClient.waitForTransaction({
                  digest,
                  options: {
                    showEffects: true,
                    showEvents: true,
                  },
                });

                if (result.events) {
                  const blobRegisteredEvent = result.events.find((event) =>
                    event.type.includes("BlobRegistered")
                  );

                  if (blobRegisteredEvent?.parsedJson) {
                    const eventData = blobRegisteredEvent.parsedJson as {
                      object_id?: string;
                      objectId?: string;
                    };
                    blobObjectId =
                      eventData.object_id || eventData.objectId || null;
                  }
                }
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            onError: reject,
          }
        );
      });

      await flow.upload({ digest: registerDigest! });

      const certifyTx = flow.certify();
      await new Promise<void>((resolve, reject) => {
        signAndExecute(
          { transaction: certifyTx },
          {
            onSuccess: async ({ digest }) => {
              try {
                await suiClient.waitForTransaction({ digest });
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            onError: reject,
          }
        );
      });

      const files = await flow.listFiles();
      const blobId = files[0]?.blobId;

      if (!blobId) {
        throw new Error("Failed to get blobId after upload");
      }

      const metadataId = blobObjectId || blobId;

      const uploadedItem: UploadedItem = {
        blobId,
        id: metadataId,
        url: `https://aggregator.walrus-testnet.walrus.space/v1/${blobId}`,
        size: textContent.length,
        type: "text/plain",
        timestamp: Date.now(),
      };
      setUploadHistory([uploadedItem, ...uploadHistory]);
      setSuccess("Text uploaded successfully!");
      setTextContent("");
    } catch (err) {
      setError(
        `Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleJsonUpload = async () => {
    if (!jsonContent.trim()) {
      setError("Please enter JSON data to upload");
      return;
    }

    try {
      JSON.parse(jsonContent);
    } catch {
      setError("Invalid JSON format. Please check your syntax.");
      return;
    }

    if (!currentAccount) {
      setError("Please connect your wallet first");
      return;
    }

    if (!walrus) {
      setError("Walrus service not available. Please refresh the page.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const flow = walrus.uploadWithFlow(
        [
          {
            contents: jsonContent,
            identifier: "data.json",
            tags: { "content-type": "application/json" },
          },
        ],
        { epochs: 10, deletable: true }
      );

      await flow.encode();

      const registerTx = flow.register({
        owner: currentAccount.address,
        epochs: 10,
        deletable: true,
      });

      let registerDigest: string;
      let blobObjectId: string | null = null;
      await new Promise<void>((resolve, reject) => {
        signAndExecute(
          { transaction: registerTx },
          {
            onSuccess: async ({ digest }) => {
              try {
                registerDigest = digest;
                const result = await suiClient.waitForTransaction({
                  digest,
                  options: {
                    showEffects: true,
                    showEvents: true,
                  },
                });

                if (result.events) {
                  const blobRegisteredEvent = result.events.find((event) =>
                    event.type.includes("BlobRegistered")
                  );

                  if (blobRegisteredEvent?.parsedJson) {
                    const eventData = blobRegisteredEvent.parsedJson as {
                      object_id?: string;
                      objectId?: string;
                    };
                    blobObjectId =
                      eventData.object_id || eventData.objectId || null;
                  }
                }
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            onError: reject,
          }
        );
      });

      await flow.upload({ digest: registerDigest! });

      const certifyTx = flow.certify();
      await new Promise<void>((resolve, reject) => {
        signAndExecute(
          { transaction: certifyTx },
          {
            onSuccess: async ({ digest }) => {
              try {
                await suiClient.waitForTransaction({ digest });
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            onError: reject,
          }
        );
      });

      const files = await flow.listFiles();
      const blobId = files[0]?.blobId;

      if (!blobId) {
        throw new Error("Failed to get blobId after upload");
      }

      const metadataId = blobObjectId || blobId;

      const uploadedItem: UploadedItem = {
        blobId,
        id: metadataId,
        url: `https://aggregator.walrus-testnet.walrus.space/v1/${blobId}`,
        size: jsonContent.length,
        type: "application/json",
        timestamp: Date.now(),
      };
      setUploadHistory([uploadedItem, ...uploadHistory]);
      setSuccess("JSON uploaded successfully!");
      setJsonContent("");
    } catch (err) {
      setError(
        `Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(`${label} copied to clipboard!`);
    setTimeout(() => setSuccess(null), 2000);
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Walrus Storage Upload</CardTitle>
            <CardDescription>
              Upload files, text, or JSON to Walrus decentralized storage
              network. Files are stored for 10 epochs (~30 days on testnet).
            </CardDescription>
          </CardHeader>
        </Card>

        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-900">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-900 border-green-200">
            <AlertDescription className="text-green-900">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Upload Content</CardTitle>
            <div className="flex gap-2 pt-4">
              <Button
                variant={activeTab === "file" ? "default" : "outline"}
                onClick={() => setActiveTab("file")}
              >
                File
              </Button>
              <Button
                variant={activeTab === "text" ? "default" : "outline"}
                onClick={() => setActiveTab("text")}
              >
                Text
              </Button>
              <Button
                variant={activeTab === "json" ? "default" : "outline"}
                onClick={() => setActiveTab("json")}
              >
                JSON
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "file" && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    id="file-upload"
                    accept="*/*"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <div className="text-5xl mb-4">📤</div>
                    <div className="text-lg font-semibold mb-2">
                      {uploading
                        ? "Uploading..."
                        : "Choose a file or drag it here"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Any file type supported
                    </div>
                  </label>
                </div>
                {uploading && (
                  <div className="flex items-center justify-center">
                    <ClipLoader size={30} color="#2563eb" />
                    <span className="ml-3">Uploading to Walrus...</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === "text" && (
              <div className="space-y-4">
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Enter your text here..."
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                  disabled={uploading}
                />
                <Button
                  onClick={handleTextUpload}
                  disabled={uploading || !textContent.trim()}
                  className="w-full"
                  size="lg"
                >
                  {uploading ? (
                    <>
                      <ClipLoader size={20} color="white" className="mr-2" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Text to Walrus"
                  )}
                </Button>
              </div>
            )}

            {activeTab === "json" && (
              <div className="space-y-4">
                <textarea
                  value={jsonContent}
                  onChange={(e) => setJsonContent(e.target.value)}
                  placeholder={'{\n  "key": "value",\n  "data": "your JSON here"\n}'}
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                  disabled={uploading}
                />
                <Button
                  onClick={handleJsonUpload}
                  disabled={uploading || !jsonContent.trim()}
                  className="w-full"
                  size="lg"
                >
                  {uploading ? (
                    <>
                      <ClipLoader size={20} color="white" className="mr-2" />
                      Uploading...
                    </>
                  ) : (
                    "Upload JSON to Walrus"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {uploadHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload History ({uploadHistory.length})</CardTitle>
              <CardDescription>Your recently uploaded items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uploadHistory.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        {item.filename && (
                          <div className="font-semibold">
                            {item.filename}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          Type: {item.type} • Size: {formatSize(item.size)} • Time: {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="flex flex-col gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Blob ID:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                              {item.blobId}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                copyToClipboard(item.blobId, "Blob ID")
                              }
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() =>
                          window.open(
                            `https://walruscan.com/testnet/blob/${item.blobId}`,
                            "_blank"
                          )
                        }
                      >
                        View on WalrusCan
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(item.url, "URL")}
                      >
                        Copy URL
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">About Walrus Storage</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900 space-y-2">
            <p>
              <strong>Walrus</strong> is a decentralized storage network built
              on Sui blockchain.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Files are stored redundantly across multiple nodes</li>
              <li>Content is permanently accessible via blob ID</li>
              <li>Storage duration is set in epochs (currently 10 epochs ≈ 30 days)</li>
              <li>No central point of failure - fully decentralized</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
