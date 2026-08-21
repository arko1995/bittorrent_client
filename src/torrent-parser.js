import fs from "node:fs";
import bencode from "bencode";
import crypto from "node:crypto";

export const open = (filepath) => {
  return bencode.decode(fs.readFileSync(filepath));
};

export const size = (torrent) => {
  const size = torrent.info.files
    ? torrent.info.files.reduce(
        (total, file) => total + BigInt(file.length),
        0n,
      )
    : BigInt(torrent.info.length);

  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(size);
  return buffer;
};

export const infoHash = (torrent) => {
  const info = bencode.encode(torrent.info);
  return crypto.createHash("sha1").update(info).digest();
};

export const BLOCK_LEN = Math.pow(2, 14);

/**
 * 
  calculating how many bytes the piece with pieceindex will contain
  it checks what size the last piece needs to be since all pieces of a torrent contain same size, except the last piece may vary
  piecelen function calculates the how many bytes the last piece of a torrent will contain
 */

export const pieceLen = (torrent, pieceIndex) => {
  const totalLength = Number(size(torrent).readBigUint64BE());
  const pieceLength = torrent.info["piece length"];

  const lastPieceLength = totalLength % pieceLength;
  const lastPieceIndex = Math.floor(totalLength / pieceLength);

  return lastPieceIndex === pieceIndex ? lastPieceLength : pieceLength;
};

export const blocksPerPiece = (torrent, pieceIndex) => {
  const pieceLength = pieceLen(torrent, pieceIndex);

  return Math.ceil(pieceLength, BLOCK_LEN);
};

export const blockLen = (torrent, pieceIndex, blockIndex) => {
  const pieceLength = pieceLen(torrent, pieceIndex);
  const lastPieceLength = pieceLength % BLOCK_LEN;
  const lastPieceIndex = Math.floor(pieceLength / BLOCK_LEN);

  return blockIndex === lastPieceIndex ? lastPieceLength : BLOCK_LEN;
};
