export default class LastFish {

  constructor(rarity, points) {
    this.rarity = rarity;
    this.points = points;
    this.expired = false;
    this.expiresAt = Date.now() + (15 * 60000); // 15 min
  }
}