import fs from "node:fs";
import bencode from "bencode";
import dgram from "node:dgram";

import { Buffer } from "buffer";

const torrent = bencode.decode(
  fs.readFileSync("lib/peter-thomas-ZIfKCrvR81I-unsplash.jpg.torrent"),
);

const tracker = Buffer.from(torrent.announce).toString("utf8");

const url = new URL(tracker);

console.log(tracker);
console.log(url);
