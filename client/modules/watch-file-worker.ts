declare global {
  interface Window {
    onmessage?: any;
    postMessage?: any;
  }
}

self.onmessage = async (e: any) => {
  const { rootPath } = e.data;
  console.log(`Watching folder: ${rootPath}`);

  const watcher = Deno.watchFs(rootPath);

  for await (const event of watcher) {
    self.postMessage({ path: event.paths[0], kind: event.kind });
  }
};
