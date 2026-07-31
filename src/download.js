import net from "node:net";
import { Buffer } from "node:buffer";
import * as tracker from "./tracker.js";

export default (torrent) => {
  tracker.getPeers(torrent, (peers) => peers.forEach(download));
};

function download(peer) {
  const socket = new net.Socket();

  socket.on("error", (error) => {
    console.log(error);
  });

  socket.connect(peer.port, peer.ip, () => {});

  socket.on("data", (data) => {});
}

function onWholeMsg(socket, callback) {
  let savedBuff = Buffer.alloc(0);
  let handShake = true;

  socket.on("data", (rcvBuf) => {
    const msglen = () => {
      handShake ? savedBuff.readUInt8(0) + 49 : savedBuff.readInt32BE(0) + 4;
    };

    Buffer.concat([savedBuff, rcvBuf]);

    while (savedBuff.length >= 4 && savedBuff.length >= msglen()) {
      callback(savedBuff.slice(0, msglen()));
      savedBuff = savedBuff.slice(msglen());
      handShake = false;
    }
  });
}
