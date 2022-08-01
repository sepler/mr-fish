import pg from 'pg';
import Player from './Player.js';

export default class PlayerDao {
  constructor() {
    this.pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  async getPlayer(id) {
    console.log('Getting player by id: ' + id);
    const { rows } = await this.pool.query('SELECT * FROM players WHERE id = $1', [id]);
    console.log(rows);
    if (rows.length === 0) {
      console.log('No player found for id: ' + id);
      return null;
    }
    const row = rows[0];
    return new Player(row.id, row.username, row.score, row.cooldown, JSON.parse(row.lastFish));
  }

  async createPlayer(id, username) {
    console.log('Creating player (id, username): ' + id, + ', ' + username);
    const player = new Player(id, username);
    console.log(JSON.stringify(player));
    this.pool.query('INSERT INTO players(id, username, score, cooldown, lastFish) VALUES ($1, $2, $3, $4, $5)', [player.id, player.username, player.score, player.cooldown, player.lastFish])
    return player;
  }

  async updatePlayer(player) {
    console.log('Updating player: ' + JSON.stringify(player));
    this.pool.query('UPDATE players SET username = $1, score = $2, cooldown = $3, lastFish = $4 WHERE id = $5', [player.username, player.score, player.cooldown, player.lastFish, player.id]);
  }
}