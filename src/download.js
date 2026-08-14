import net from "node:net";
import { Buffer } from "node:buffer";
import * as tracker from "./tracker.js";
import * as message from "./message.js";

export default (torrent) => {
  tracker.getPeers(torrent, (peers) =>
    peers.forEach((peer) => download(peer, torrent)),
  );
};

function download(peer, torrent) {
  const socket = new net.Socket();

  socket.on("error", (error) => {
    console.log(error);
  });

  socket.connect(peer.port, peer.ip, () => {
    socket.write(message.buildHandShake(torrent));
  });

  onWholeMsg(socket, (msg) => msgHandler(msg, socket));

  socket.on("data", (data) => {});
}

function onWholeMsg(socket, callback) {
  let savedBuff = Buffer.alloc(0);
  let handShake = true;

  socket.on("data", (rcvBuf) => {
    const msglen = () => {
      return handShake
        ? savedBuff.readUInt8(0) + 49
        : savedBuff.readInt32BE(0) + 4;
    };

    savedBuff = Buffer.concat([savedBuff, rcvBuf]);

    while (savedBuff.length >= 4 && savedBuff.length >= msglen()) {
      callback(savedBuff.slice(0, msglen()));
      savedBuff = savedBuff.slice(msglen());
      handShake = false;
    }
  });
}

function msgHandler(msg, socket) {
  if (isHandshake(msg)) socket.write(message.buildInterested());
}

function isHandshake(msg) {
  return (
    msg.length === msg.readUInt8(0) + 48 &&
    msg.toString("utf8", 1) === "BitTorrent protocol"
  );
}
