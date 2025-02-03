declare global {
  interface Window {
    onmessage?: any;
    postMessage?: any;
  }
}

let gSendEvent: number | null = null;
let gEvents: Deno.FsEvent[] = [];

self.onmessage = async (e: any) => {
  const { rootPath } = e.data;
  console.log(`Watching folder: ${rootPath}`);

  const watcher = Deno.watchFs(rootPath);

  for await (const event of watcher) {
    gEvents.push(event);

    // resets the event to trigger again
    if (gSendEvent !== null) {
      clearTimeout(gSendEvent);
    }

    gSendEvent = setTimeout(() => {
      processWatcherEvents();
    }, 1000);
  }
};

function processWatcherEvents() {
  const removePaths = gEvents.filter((f) => f.kind === "remove").map((f) => f.paths[0]);

  const distinctPaths = new Set(gEvents.map((f) => f.paths[0]));

  const newEvents = [];
  for (const path of distinctPaths) {
    if (removePaths.indexOf(path) !== -1) {
      newEvents.push({ path: path, kind: "remove" });
    } else {
      newEvents.push({ path: path, kind: "unified" });
    }
  }

  // send unified messages
  for (const event of newEvents) {
    self.postMessage({ path: event.path, kind: event.kind });
  }

  console.log(gEvents);
  console.log(newEvents);

  // "clean" the array
  gEvents = [];
}
