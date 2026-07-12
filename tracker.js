import dgram from "node:dgram";
import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import * as torrentParser from "./torrent-parser.js";
import { genId } from "./util.js";

export const getPeers = (torrent, callback) => {
  const socket = dgram.createSocket("udp4");
  const url = new URL(Buffer.from(torrent.announce)).toString("utf8");

  udpSend(socket, buildConnReq(), url);

  socket.on("message", (response) => {
    if (respType(response) === "connect") {
      const connResp = parseConnResp(response);

      const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
      udpSend(socket, announceReq, url);
    } else if (respType(response) === "announce") {
      const announceResp = parseAnnounceResp(response);

      callback(announceResp.peers);
    }
  });
};

function udpSend(socket, message, rawUrl, callback = () => {}) {
  const url = new URL(rawUrl);
  socket.send(message, 0, message.length, url.port, url.hostname, callback);
}

function respType(resp) {}
function buildConnReq() {
  const buf = Buffer.alloc(16);
  buf.writeUInt32BE(0x417, 0);
  buf.writeUInt32BE(0x27101980, 4);
  buf.writeUInt32BE(0, 8);

  crypto.randomBytes(4).copy(buf, 12);
  return buf;
}
function parseConnResp(resp) {
  return {
    action: resp.readUint32BE(0),
    transactionId: resp.readUint32BE(4),
    connectionId: resp.slice(8),
  };
}
function buildAnnounceReq(connId, torrent, port = 6881) {
  const buf = Buffer.allocUnsafe(98);

  connId.copy(buf, 0);

  buf.writeUInt32BE(1, 8);

  crypto.randomBytes(4).copy(buf, 12);

  torrentParser.infoHash(torrent).copy(buf, 16);

  genId().copy(buf, 36);

  Buffer.alloc(8).copy(buf, 56);

  torrentParser.size(torrent).copy(buf, 64);

  Buffer.alloc(8).copy(buf, 72);

  buf.writeUint32BE(0, 80);

  buf.writeUint32BE(0, 84);

  crypto.randomBytes(4).copy(buf, 88);

  buf.writeInt32BE(-1, 92);

  buf.writeUint16BE(port, 96);

  return buf;
}
function parseAnnounceResp(resp) {
  function group(iterable, groupSize) {
    const groups = [];

    for (let i = 0; i < iterable.length; i += groupSize) {
      groups.push(iterable.slice(i, i + groupSize));
    }
    return groups;
  }

  return {
    action: resp.readUint32BE(0),
    transactionId: resp.readUint32BE(4),
    interval: resp.readUint32BE(8),
    leechers: resp.readUint32BE(12),
    seeders: resp.readUint32BE(16),
    peers: group(resp.slice(20), 6).map((address) => {
      return {
        ip: address.slice(0, 4).join("."),
        port: address.readUint16BE(4),
      };
    }),
  };
}
