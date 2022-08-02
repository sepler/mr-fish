import { Rarity } from "./Rarity";

export default class LastFish {
  rarity: Rarity;
  points: number;
  expired: boolean;
  expiresAt: number;

  constructor(rarity: Rarity, points: number) {
    this.rarity = rarity;
    this.points = points;
    this.expired = false;
    this.expiresAt = Date.now() + (15 * 60000); // 15 min
  }
}