import { Buffer } from "node:buffer";
import * as torrentParser from "./torrent-parser.js";
import * as util from "./util.js";

export const buildHandShake = (torrent) => {
  const buf = Buffer.alloc(68);

  //pstrlen
  buf.writeUint8(19, 0);
  //pstr
  buf.write("BitTorrent Protocol", 1);
  //reserved
  buf.writeUint32BE(0, 20);
  buf.writeUint32BE(0, 24);
  //info hash
  torrentParser.infoHash(torrent).copy(buf, 28);

  buf.write(util.genId(), 48);

  return buf;
};

export const buildKeepAlive = () => Buffer.alloc(4);

export const buildChoke = () => {
  const buf = Buffer.alloc(5);
  //length
  buf.writeUInt32BE(1, 0);
  //id
  buf.writeUint8(0, 4);

  return buf;
};

export const buildUnchoke = () => {
  const buf = Buffer.alloc(5);
  //length
  buf.writeUint32BE(1, 0);
  //id
  buf.writeUInt8(1, 4);

  return buf;
};

export const buildInterested = () => {
  const buf = Buffer.alloc(5);
  //length
  buf.writeUint32BE(1, 0);
  //id
  buf.writeUint8(2, 4);

  return buf;
};

export const buildUninterested = () => {
  const buf = Buffer.alloc(5);

  //length
  buf.writeUint32BE(1, 0);
  //id
  buf.writeUInt8(3, 4);

  return buf;
};

export const buildHave = (payload) => {
  const buf = Buffer.alloc(9);

  //length
  buf.writeUint32BE(5, 0);
  //id
  buf.writeUint8(4, 4);
  //piece index
  buf.writeUInt32BE(payload, 5);

  return buf;
};

export const buildBitfield = (bitfield) => {
  const buf = Buffer.alloc(5 + bitfield.length);

  buf.writeUInt32BE(bitfield.length + 1, 0);

  buf.writeUInt8(5, 4);

  bitfield.copy(buf, 5);

  return buf;
};

export const buildRequest = (payload) => {
  const buf = Buffer.alloc(17);

  buf.writeUInt32BE(13, 0);

  buf.writeUint8(6, 4);

  buf.writeUInt32BE(payload.index, 5);
  buf.writeUint32BE(payload.begin, 9);
  buf.writeUInt32BE(payload.length, 13);

  return buf;
};

export const buildPiece = (payload) => {
  const buf = Buffer.alloc(payload.block.length + 13);
  //length
  buf.writeInt32BE(payload.block.length + 9, 0);
  //id
  buf.writeInt8(7, 4);

  buf.writeInt32BE(payload.index, 5);
  buf.writeInt32BE(payload.begin, 9);

  payload.copy(buf, 13);

  return buf;
};

export const buildCancel = (payload) => {
  const buf = Buffer.alloc(17);
  //length
  buf.writeInt32BE(13, 0);
  //id
  buf.writeInt8(8, 4);
  buf.writeInt32BE(payload.index, 5);
  buf.writeInt32BE(payload.begin, 9);
  buf.writeInt32BE(payload.length, 13);

  return buf;
};

export const buildPort = (payload) => {
  const buf = Buffer.alloc(7);

  //length
  buf.writeInt32BE(3, 0);
  //id
  buf.writeInt8(9, 4);

  buf.writeInt16BE(payload, 5);

  return buf;
};

export const parse = (msg) => {
  const id = msg.length > 4 ? msg.readInt8(4) : null;
  let payload = msg.length > 5 ? msg.slice(5) : null;

  if (id === 6 || id === 7 || id === 8) {
    const rest = payload.slice(8);

    payload = {
      index: payload.readInt32BE(0),
      begin: payload.readInt32BE(4),
    };

    payload[id === 7 ? "block" : length] = rest;
  }

  return {
    size: msg.readInt32BE(0),
    id: id,
    payload: payload,
  };
};
