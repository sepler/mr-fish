import { randomUUID } from 'crypto';
import { DuelStatus } from './DuelStatus.js';

export default class Duel {
  id: string;
  playerId: string;
  opponentId: string;
  wager: number;
  status: DuelStatus;
  createdAt: number;

  constructor(id: string, playerId: string, opponentId: string, wager: number, status: DuelStatus, createdAt: number) {
    this.id = id;
    this.playerId = playerId;
    this.opponentId = opponentId;
    this.wager = wager;
    this.status = status;
    this.createdAt = createdAt;
  }

  static new(playerId: string, opponentId: string, wager: number) {
    return new Duel(randomUUID(), playerId, opponentId, wager, DuelStatus.Proposed, Date.now())
  }
}