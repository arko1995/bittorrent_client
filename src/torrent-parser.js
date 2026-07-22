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
