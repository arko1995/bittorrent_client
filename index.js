import * as torrentParser from "./src/torrent-parser.js";
import download from "./src/download.js";

const torrentPath = process.argv[2];

if (!torrentPath) {
  console.error("Usage: node index.js <path-to-torrent>");
  process.exit(1);
}
const torrent = torrentParser.open(torrentPath);

download(torrent);
