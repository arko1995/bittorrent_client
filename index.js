import fs from "node:fs";
import bencode from "bencode";
import dgram from "node:dgram";
import { getPeers } from "./tracker.js";
import { Buffer } from "buffer";
import * as torrentParser from "./torrent-parser.js";

const torrent = torrentParser.open(
  "lib/peter-thomas-ZIfKCrvR81I-unsplash.jpg.torrent",
);

getPeers(torrent, (peers) => {
  console.log("list o peers ", peers);
});
