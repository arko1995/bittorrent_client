import net from "node:net";
import { Buffer } from "node:buffer";
import * as tracker from "./tracker.js";
import * as message from "./message.js";

export default (torrent) => {
  const requested = [];
  tracker.getPeers(torrent, (peers) =>
    peers.forEach((peer) => download(peer, torrent, requested)),
  );
};

function download(peer, torrent, requested) {
  const socket = new net.Socket();

  socket.on("error", (error) => {
    console.log(error);
  });

  socket.connect(peer.port, peer.ip, () => {
    socket.write(message.buildHandShake(torrent));
  });

  onWholeMsg(socket, (msg) => msgHandler(msg, socket, requested));

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

function msgHandler(msg, socket, requested) {
  if (isHandshake(msg)) socket.write(message.buildInterested());
  else {
    const m = message.parse(msg);

    if (m.id === 0) chokeHandler();
    if (m.id === 1) unChokeHandler();
    if (m.id === 4) haveHandler(m.payload, socket, requested);
    if (m.id === 5) bitfieldHandler(m.payload);
    if (m.id === 7) pieceHandler(m.payload);
  }
}

function chokeHandler() {}

function unChokeHandler() {}

function haveHandler(payload, socket, requested) {
  const pieceIndex = payload.readUInt32BE(0);

  if (!requested[pieceIndex]) {
    socket.write(message.buildRequest());
  }
  requested[pieceIndex] = true;
}

function bitfieldHandler(payload) {}

function pieceHandler(payload) {}

function isHandshake(msg) {
  return (
    msg.length === msg.readUInt8(0) + 49 &&
    msg.toString("utf8", 1) === "BitTorrent protocol"
  );
}
