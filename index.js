import fs from "node:fs";
import bencode from "bencode";
import dgram from "node:dgram";
import { getPeers } from "./src/tracker.js";
import { Buffer } from "buffer";
import * as torrentParser from "./src/torrent-parser.js";
import * as download from "./src/download.js";

const torrent = torrentParser.open(
  "lib/The Bureau XCOM Declassified - [DODI Repack].torrent",
);

download(torrent);

getPeers(torrent, (peers) => {
  console.log("list o peers ", peers);
});
