interface FileStat {
  name: string;
  time: number | null;
  timeDt: Date | null;
}

export function readFileStat(filename: string): FileStat {
  const stat = Deno.statSync(filename);
  return {
    name: filename,
    time: dtToUnixTs(stat.mtime),
    timeDt: stat.mtime,
  };
}

export function unixTsToDt(unixTs: number): Date {
  return new Date(unixTs * 1000);
}

export function dtToUnixTs(dt: Date | null): number {
  if (dt === null) {
    return Math.floor(new Date().getTime() / 1000);
  }
  return Math.floor(dt.getTime() / 1000);
}

export function listFiles(path: string): string[] {
  /* Deno readDirSync object format
      name: "express",
      isFile: false,
      isDirectory: true,
      isSymlink: false
     */

  let files: string[] = [];

  for (const entry of Deno.readDirSync(path)) {
    if (entry.isFile === true) {
      files.push(`${path}/${entry.name}`);
    } else if (entry.isDirectory === true) {
      const subDirFiles = listFiles(`${path}/${entry.name}`);
      files = files.concat(subDirFiles);
    }
  }

  return files;
}
