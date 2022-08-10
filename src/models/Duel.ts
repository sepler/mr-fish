import { randomUUID } from 'crypto';
import { DuelStatus } from './DuelStatus.js';

export default class Duel {
  id: string;
  initiatiorId: string;
  challengedId: string;
  wager: number;
  status: DuelStatus;
  createdAt: number;

  constructor(id: string, initiatiorId: string, challengedId: string, wager: number, status: DuelStatus, createdAt: number) {
    this.id = id;
    this.initiatiorId = initiatiorId;
    this.challengedId = challengedId;
    this.wager = wager;
    this.status = status;
    this.createdAt = createdAt;
  }

  static new(initiatiorId: string, challengedId: string, wager: number) {
    return new Duel(randomUUID.toString(), initiatiorId, challengedId, wager, DuelStatus.Proposed, Date.now())
  }
}