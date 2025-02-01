import { dtToUnixTs } from "../utils.ts";

interface ServerResponse {
  status?: string;
  message?: string;
}

export async function uploadFile(url: string, rootPath: string, filePath: string): Promise<string> {
  console.log(`Uploading file: ${filePath}`);

  const filename = filePath.split("/").slice(-1)[0];
  const subfolder = filePath
    .replace(rootPath, "")
    .replace(/^\/*/gm, "")
    .replace(filename, "")
    .replace(/\/$/, "");
  const fileData = await Deno.readFile(filePath);
  const fileStat = await Deno.stat(filePath);
  const mtime = fileStat.mtime === null ? dtToUnixTs(new Date()) : dtToUnixTs(fileStat.mtime);
  const filePayload = new File([fileData], filename);

  console.log("filename: %s", filename);
  console.log("subfolder: %s", subfolder);

  const form = new FormData();
  form.append("file", filePayload);
  form.append("filetime", mtime.toString());
  form.append("subfolder", subfolder);

  const res = await fetch(url, { method: "POST", body: form });

  return await res.text();
}

export async function downloadFile(url: string, rootPath: string, filename: string) {
  console.log(`Download file ${filename}`);

  const filepath = filename.split("/");

  // if filename contains folders ex: conflict/hello.txt_1738017177
  if (filepath.length > 1) {
    // remove hello.txt_1738017177
    filepath.splice(-1);

    // just the folder conflict
    const folder = filepath.join("/");
    console.log(`Filename contains the folder ${folder}`);
    Deno.mkdirSync(`${rootPath}/${folder}`, { recursive: true });
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: filename }),
  });

  if (res.body) {
    // first remove the file to have new metadata
    try {
      Deno.removeSync(`${rootPath}/${filename}`);
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) {
        throw err;
      }
    }

    const file = await Deno.open(`${rootPath}/${filename}`, { write: true, create: true });
    await res.body.pipeTo(file.writable);
  }
}

export async function getChangedFiles(url: string, maxTime: number): Promise<string[]> {
  const res = await fetch(`${url}/${maxTime}`);
  const filesToDownload = await res.json();
  return filesToDownload;
}

export async function removeFile(url: string, rootPath: string, filename: string): Promise<ServerResponse> {
  // remove root path from file path
  const serverFilePath = filename.replace(rootPath, "").replace(/^\/*/gm, "");
  console.log(`Remove file ${serverFilePath}`);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: serverFilePath }),
  });

  return await res.json();
}

export async function allFiles(url: string): Promise<string[]> {
  const res = await fetch(url);

  return await res.json();
}

export async function ping(url: string): Promise<boolean> {
  try {
    await fetch(url);
    return true;
  } catch (_) {
    return false;
  }
}
