import LastFish from "./LastFish";

export default class Player {
  id: string;
  username: string;
  score: number;
  cooldown: number;
  lastFish: LastFish;
  
  constructor(id: string, username: string, score: number, cooldown: number, lastFish: LastFish) {
    this.id = id;
    this.username = username;
    this.score = score;
    this.cooldown = cooldown;
    this.lastFish = lastFish;
  }

  static new(id: string, username: string): Player {
    return new Player(id, username, 0, 0, null);
  }

}
