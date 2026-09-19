import net from "node:net";
import { Buffer } from "node:buffer";
import * as tracker from "./tracker.js";
import * as message from "./message.js";
import Queue from "./Queue.js";
import Pieces from "./Pieces.js";

export default (torrent) => {
  tracker.getPeers(torrent, (peers) => {
    const pieces = new Pieces(torrent);
    peers.forEach((peer) => download(peer, torrent, pieces));
  });
};

function download(peer, torrent, pieces) {
  const socket = new net.Socket();
  socket.on("error", (error) => {
    console.log(error);
  });

  socket.connect(peer.port, peer.ip, () => {
    socket.write(message.buildHandShake(torrent));
  });

  const queue = new Queue(torrent);
  onWholeMsg(socket, (msg) => msgHandler(msg, socket, pieces, queue));
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
      callback(savedBuff.subarray(0, msglen()));
      savedBuff = savedBuff.subarray(msglen());
      handShake = false;
    }
  });
}

function msgHandler(msg, socket, pieces, queue) {
  if (isHandshake(msg)) socket.write(message.buildInterested());
  else {
    const m = message.parse(msg);

    if (m.id === 0) chokeHandler(queue);
    if (m.id === 1) unChokeHandler(socket, pieces, queue);
    if (m.id === 4) haveHandler(socket, pieces, m.payload, queue);
    if (m.id === 5) bitfieldHandler(socket, pieces, m.payload, queue);
    if (m.id === 7) pieceHandler(socket, pieces, queue, m.payload);
  }
}

function chokeHandler(queue) {
  queue.choked = true;
}

function unChokeHandler(socket, pieces, queue) {
  queue.choked = false;
  requestPiece(socket, pieces, queue);
}

function haveHandler(socket, pieces, payload, queue) {
  const pieceIndex = payload.readUInt32BE(0);
  const queueEmpty = queue.length() === 0;
  queue.queue(pieceIndex);
  if (queueEmpty) requestPiece(socket, pieces, queue);
}

function bitfieldHandler(socket, pieces, queue, payload) {
  const pieceCount = queue.torrent.info.pieces.length / 20;
  const queueEmpty = queue.length() === 0;
  payload.forEach((byte, i) => {
    for (let j = 0; j < 8; j++) {
      const pieceIndex = i * 8 + j;

      if (pieceIndex >= pieceCount) break;

      if (byte & (1 << (7 - j))) {
        queue.queue(pieceIndex);
      }
    }
  });
  if (queueEmpty) requestPiece(socket, pieces, queue);
}

function pieceHandler(socket, pieces, queue, pieceResp) {
  pieces.addReceive(pieceResp);

  if (pieces.isDone()) {
    socket.end();
    console.log("DONE");
  } else {
    requestPiece(socket, pieces, queue);
  }
}

function requestPiece(socket, pieces, queue) {
  if (queue.choked) return null;

  while (queue.length()) {
    const pieceBlock = queue.dequeue();

    if (pieces.needed(pieceBlock)) {
      socket.write(message.buildRequest(pieceBlock));
      pieces.addRequest(pieceBlock);
      break;
    }
  }
}

function isHandshake(msg) {
  return (
    msg.length === msg.readUInt8(0) + 49 &&
    msg.toString("utf8", 1, 20) === "BitTorrent protocol" //converts the entire bugger into string starting from offset 1
  );
}
