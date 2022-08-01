import Pool from 'pg';
import Player from './Player';

export default class PlayerDao {
  constructor() {
    this.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
    });
  }

  async getPlayer(id) {
    const { rows } = await this.pool.query('SELECT * FROM players WHERE id = $1', [id]);
    if (rows.length === 0) {
      return null;
    }
    const row = rows[0];
    return new Player(row.id, row.username, row.score, row.cooldown, JSON.parse(row.lastFish));
  }

  async createPlayer(id, username) {
    const player = new Player(id, username);
    this.pool.query('INSERT INTO players(id, username, score, cooldown, lastFish) VALUES ($1, $2, $3, $4, $5)', [player.id, player.username, player.score, player.cooldown, player.lastFish])
    return player;
  }

  async updatePlayer(player) {
    this.pool.query('UPDATE players SET username = $1, score = $2, cooldown = $3, lastFish = $4 WHERE id = $5', [player.username, player.score, player.cooldown, player.lastFish, player.id]);
  }
}