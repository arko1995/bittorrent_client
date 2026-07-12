import fs from "node:fs";
import bencode from "bencode";
import crypto from "node:crypto";

export const open = (filepath) => {
  return bencode.decode(fs.readFileSync(filepath));
};

export const size = (torrent) => {};

export const infoHash = (torrent) => {
  const info = bencode.encode(torrent.info);
  return crypto.createHash("sha1").update(info).digest();
};
