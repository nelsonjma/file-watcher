import express, { Request, Response } from "npm:express@4.18.2";
import bodyParser from "npm:body-parser@1.19.0";
import multer from "npm:multer@1.4.5-lts.1";

import { unixTsToDt, listFiles, readFileStat, dtToUnixTs } from "./utils.ts";

function moveFileToDestination(userFolder: string, filename: string, subfolder: string, remoteTime: number) {
  const destinationPath =
    subfolder !== "" ? `${userFolder}/${subfolder}/${filename}` : `${userFolder}/${filename}`;
  const destinationFolder = `${userFolder}/${subfolder}`;
  const tmpPath = `${userFolder}/tmp/${filename}`; // ! this does not contain sub folder
  const conflictFolder = `${userFolder}/conflict`;
  const conflictPath = `${userFolder}/conflict/${filename}_${remoteTime}`;

  try {
    // get local file if already exists
    const localFileStat = Deno.statSync(destinationPath);

    const localTime = localFileStat.mtime === null ? 0 : dtToUnixTs(localFileStat.mtime);

    const localDt = unixTsToDt(localTime).toLocaleString();
    const remoteDt = unixTsToDt(remoteTime).toLocaleString();

    if (remoteTime < localTime) {
      // move new file to conflit folder
      console.log(`[${userFolder}] conflit ${filename}: local: ${localDt}) / remote: ${remoteDt}`);
      console.log(`---- local: ${localTime} / remote: ${remoteTime}`);
      Deno.mkdirSync(conflictFolder, { recursive: true });
      Deno.copyFileSync(tmpPath, conflictPath);
    } else {
      // if the file already exists it will overwrite the file.
      console.log(`[${userFolder}] replace ${filename}: local: ${localDt}) / remote: ${remoteDt}`);
      Deno.copyFileSync(tmpPath, destinationPath);
    }
  } catch (error) {
    if (error.name === "NotFound") {
      // its a new file, copy to final file location
      console.log(`[${userFolder}] new file ${filename}.`);
      Deno.mkdirSync(destinationFolder, { recursive: true });
      Deno.copyFileSync(tmpPath, destinationPath);
    } else {
      console.log(error);
    }
  }

  // remove tmp file
  console.log(`Remove tmp file ${filename}.`);
  Deno.removeSync(tmpPath);
}

const globalRootPath = "uploads";

const storage = multer.diskStorage({
  destination: function (req: Request, file, cb) {
    // create tmp path for the file
    // TODO! add subfolder to here.
    // const destinationPath = subfolder !== "" ? `${userFolder}/${subfolder}/${filename}` : `${userFolder}/${filename}`;
    const uploadTmpFolder = `${globalRootPath}/${req.params.path}/tmp`;
    Deno.mkdirSync(uploadTmpFolder, { recursive: true });

    cb(null, uploadTmpFolder);
  },
  filename: function (req: Request, file, cb) {
    cb(null, `${file.originalname}`);
  },
});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const upload = multer({ storage });

app.post("/upload/:path", upload.single("file"), (req: Request, res: Response) => {
  const uploadPath = req.params.path;
  const filename = req.file.filename;
  const subfolder = req.body.subfolder;
  const filetime = req.body.filetime;
  const filetimeDt = `${new Date(filetime * 1000).toLocaleString()}`;
  const uploadFolder = `${globalRootPath}/${uploadPath}`;

  console.log(`[${uploadPath}] filename: ${subfolder}/${filename}, filetime: ${filetimeDt}`);

  moveFileToDestination(uploadFolder, filename, subfolder, filetime);

  res.send(JSON.stringify({ status: "ok", message: "" }));
});

app.get("/changed/:path/:time", (req: Request, res: Response) => {
  const changePath = req.params.path;
  const time = req.params.time;
  const changeFolder = `${globalRootPath}/${changePath}`;
  const files = listFiles(changeFolder)
    .map(readFileStat)
    .filter((f) => f.time > time)
    .map((f) => f.name.replace(`${changeFolder}/`, ""));

  for (const file of files) {
    console.log(`[${changePath}] changed file ${file}`);
  }

  res.send(JSON.stringify(files));
});

app.post("/download/:path", (req: Request, res: Response) => {
  const filepath = req.params.path;
  const filename = req.body.filename;
  const downloadFilePath = `${globalRootPath}/${filepath}/${filename}`;

  console.log(`[${filepath}] download file path: ${downloadFilePath}`);

  res.download(downloadFilePath);
});

app.post("/remove/:path", (req: Request, res: Response) => {
  const filepath = req.params.path;
  const filename = req.body.filename;
  const removeFilePath = `${globalRootPath}/${filepath}/${filename}`;

  console.log(`[${filepath}] remove file path: ${removeFilePath}`);

  try {
    const fileStat = Deno.statSync(removeFilePath);
    if (fileStat.isDirectory === true) {
      Deno.removeSync(removeFilePath, { recursive: true });
    } else {
      Deno.removeSync(removeFilePath);
    }

    res.send(JSON.stringify({ status: "ok", message: "" }));
  } catch (error) {
    console.log(`[${filepath}] failed to be removed ${removeFilePath} with error ${error}`);

    res.send(JSON.stringify({ status: "nok", message: error.toString() }));
  }
});

app.get("/all/:path/", (req: Request, res: Response) => {
  const filesPath = req.params.path;
  const filesFolder = `${globalRootPath}/${filesPath}`;
  const files = listFiles(filesFolder).map((f) => f.replace(filesFolder, "").replace(/^\/*/gm, ""));

  res.send(JSON.stringify(files));
});

app.get("/ping/", (_: Request, res: Response) => {
  res.send(JSON.stringify({ status: "ok" }));
});

console.log("Starting web server");
app.listen(3000);
