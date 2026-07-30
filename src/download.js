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
