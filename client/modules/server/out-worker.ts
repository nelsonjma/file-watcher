import { uploadFile, removeFile } from "./operations.ts";

declare global {
  interface Window {
    onmessage?: any;
  }
}

self.onmessage = async (e: any) => {
  const { type, payload } = e.data;

  try {
    console.log(`operation type: ${type}`);
    console.log("payload:");
    console.log(payload);

    if (type == "upload") {
      const uploadResp = await uploadFile(payload.url, payload.rootPath, payload.filePath);
      console.log(uploadResp);
    } else if (type === "remove") {
      const removeResp = await removeFile(payload.url, payload.rootPath, payload.filePath);
      console.log("status: %s message: %s", removeResp.status, removeResp.message);
    } else {
      console.log("Invalid type of operation");
    }
  } catch (error) {
    console.log("Failed to execute operation with error: %s", error);
  }
};
