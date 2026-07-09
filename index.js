import fs from "node:fs";
import bencode from "bencode";
import dgram from "node:dgram";

import { Buffer } from "buffer";

const torrent = bencode.decode(
  fs.readFileSync("lib/peter-thomas-ZIfKCrvR81I-unsplash.jpg.torrent"),
);

const tracker = Buffer.from(torrent.announce).toString("utf8");

const url = new URL(tracker);

const socket = dgram.createSocket("udp4");

const myMsg = Buffer.from("hello", "utf8");

socket.send(myMsg, 0, myMsg.length, url.port, url.hostname, (err) => {
  console.log(err);
});

socket.on("message", (msg) => {
  console.log("message is ", msg);
});
