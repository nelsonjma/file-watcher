import { parseArgs } from "jsr:@std/cli/parse-args";

/*
  deno compile -A \
    --include=modules/server/out-worker.ts \
    --include=modules/server/in-worker.ts \
    --include=modules/watch-file-worker.ts \
    --include *.ts \
    main.ts

  deno run -A main.ts \
    --url="http://localhost:3000" \
    --outPath="/code/javascript/deno/watcher/tests/client_1_output" \
    --inPath="/code/javascript/deno/watcher/tests/client_2_output,/code/javascript/deno/watcher/tests/client_3_output"

 */
function main() {
  const flags = parseArgs(Deno.args, {
    string: ["outPath", "inPath", "url"],
  });

  if (flags.url === undefined) throw "url is not defined";

  const runOutWorker = flags.outPath === undefined ? false : true;
  const runInWorker = flags.inPath === undefined ? false : true;

  const serverUrl = flags.url;
  console.log("url: %s", serverUrl);

  // start worker that get files from the server
  if (runInWorker === true) {
    // files on the server are sent here.
    const inRootPaths: string = flags.inPath ?? "";

    const gInWorkerServerUrl = new URL("./modules/server/in-worker.ts", import.meta.url).href;
    const gInWorkerServer = new Worker(gInWorkerServerUrl, { type: "module" });

    for (const inPath of inRootPaths.split(",")) {
      console.log("inPath: %s", inPath);
      const inRootFolder: string = inPath.split("/").splice(-1)[0];
      gInWorkerServer.postMessage({ url: serverUrl, rootPath: inPath, rootFolder: inRootFolder });
    }
  }

  // start workers that will send files to server
  if (runOutWorker === true) {
    // changes on this folder are sent to remote server.
    const outRootPath: string = flags.outPath ?? "";
    const outRootFolder: string = outRootPath.split("/").splice(-1)[0];
    console.log("outPath: %s", outRootPath);

    const gOutWorkerServerUrl = new URL("./modules/server/out-worker.ts", import.meta.url).href;
    const gOutWorkerServer = new Worker(gOutWorkerServerUrl, { type: "module" });

    const gWorkerWatcherUrl = new URL("./modules/watch-file-worker.ts", import.meta.url).href;
    const gWorkerWatcher = new Worker(gWorkerWatcherUrl, { type: "module" });

    gWorkerWatcher.postMessage({ rootPath: outRootPath });
    gWorkerWatcher.onmessage = (event: MessageEvent) => {
      const { path, kind } = event.data;
      console.log(`[%s] %s`, kind, path);

      if (kind === "remove") {
        gOutWorkerServer.postMessage({
          type: "remove",
          payload: { url: `${serverUrl}/remove/${outRootFolder}`, rootPath: outRootPath, filePath: path },
        });
      } else {
        gOutWorkerServer.postMessage({
          type: "upload",
          payload: { url: `${serverUrl}/upload/${outRootFolder}`, rootPath: outRootPath, filePath: path },
        });
      }
    };
  }
}

main();
