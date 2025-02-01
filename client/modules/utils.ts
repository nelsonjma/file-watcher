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

export function filesMaxTime(path: string): number {
  const filesTime = listFiles(path)
    .map(readFileStat)
    .map((f) => f.time)
    .filter((t) => t !== null);

  // if files exists get max else from the begining of time
  return filesTime.length > 0 ? Math.max(...filesTime) : 0;
}

export function findNewFiles(rootPath: string, maxTime: number): string[] {
  const filesTime = listFiles(rootPath)
    .map(readFileStat)
    .filter((f) => f.time !== null && f.time > maxTime)
    .map((f) => f.name);

  return filesTime;
}
