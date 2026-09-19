import * as torrentParser from "./src/torrent-parser.js";
import download from "./src/download.js";

const torrent = torrentParser.open(process.argv[2]);

if (!torrent) {
  console.error("Usage: node index.js <path-to-torrent>");
  process.exit(1);
}

download(torrent);
