import {
  getChangedFiles,
  downloadFile,
  allFiles,
  uploadFile,
  ping,
} from "../../modules/server/operations.ts";
import { listFiles, filesMaxTime, findNewFiles, readFileStat } from "../../modules/utils.ts";

declare global {
  interface Window {
    onmessage?: any;
  }
}

self.onmessage = async (e: any) => {
  const { url, rootPath, rootFolder } = e.data;

  console.log("[%s] Watching remote folder", rootFolder);

  setInterval(async () => {
    await watcher(url, rootPath, rootFolder);
  }, 15000);
};

async function watcher(url: string, rootPath: string, rootFolder: string): Promise<void> {
  // ping server
  if ((await ping(`${url}/ping`)) === false) {
    console.log(`[${rootFolder}] Ping failed, server is not available at ${url}`);
    return;
  }

  // calculate new maxTime from the files
  const maxTime = filesMaxTime(rootPath);

  const changedFiles = await getChangedFiles(`${url}/changed/${rootFolder}`, maxTime);

  if (changedFiles.length > 0) {
    console.log(`[${rootFolder}] Downloading ${changedFiles.length} files`);

    for (const file of changedFiles) {
      await downloadFile(`${url}/download/${rootFolder}`, rootPath, file);
    }
  }
}
