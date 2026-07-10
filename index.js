import fs from "node:fs";
import bencode from "bencode";
import dgram from "node:dgram";
import { getPeers } from "./tracker.js";
import { Buffer } from "buffer";

const torrent = bencode.decode(
  fs.readFileSync("lib/peter-thomas-ZIfKCrvR81I-unsplash.jpg.torrent"),
);

getPeers(torrent, (peers) => {
  console.log("list o peers ", peers);
});
