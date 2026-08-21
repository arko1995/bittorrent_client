import * as tp from "./torrent-parser.js";

export default class {
  constructor(torrent) {
    function buildPiecesArray() {
      const nPieces = torrent.info.pieces.length / 20;
      const arr = new Array(nPieces).fill(null);

      return arr.map((_, i) =>
        new Array(tp.blocksPerPiece(torrent, i)).fill(false),
      );
    }
    this._requested = buildPiecesArray();
    this._received = buildPiecesArray;
  }

  addRequest(pieceBLock) {
    const blockIndex = pieceBLock.begin / tp.BLOCK_LEN;
    this._requested[pieceBLock.index][blockIndex] = true;
  }

  addReceive(pieceBLock) {
    const blockIndex = pieceBLock.begin / tp.BLOCK_LEN;
    this._requested[pieceBLock][blockIndex] = true;
  }

  needed(pieceBlock) {
    if (this._requested.every((blocks) => blocks.every((i) => i))) {
      this._requested = this._received.map((blocks) => blocks.slice());
    }
    const blockIndex = pieceBlock.being / tp.BLOCK_LEN;
    return !this._requested[pieceBlock.index][blockIndex];
  }

  isDone() {
    return this._received.every((blocks) => blocks.every((i) => i));
  }
}
