export default class Player {
  
  constructor(id, username, score, cooldown, lastFish) {
    if (id != undefined && username != undefined && score != undefined && cooldown != undefined && lastFish != undefined) {
      this.id = id;
      this.username = username;
      this.score = score;
      this.cooldown = cooldown;
      this.lastFish = lastFish;
    } else if (id != undefined && username != undefined) {
      this.id = id;
      this.username = username;
      this.score = 0;
      this.cooldown = 0;
      this.lastFish = null;
    }
  }
}
