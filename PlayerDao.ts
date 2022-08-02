import pg from 'pg';
import Player from './models/Player.js';

export default class PlayerDao {
  pool: pg.Pool;

  constructor() {
    this.pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  async getPlayer(id: string) {
    console.log(`Getting player by id: ${id}`);
    const { rows } = await this.pool.query('SELECT * FROM players WHERE id = $1', [id]);
    if (rows.length === 0) {
      console.log(`No player found for id: ${id}`);
      return null;
    }
    return toPlayer(rows[0]);
  }

  async createPlayer(id: string, username: string) {
    console.log(`Creating player (id, username): ${id}, ${username}`);
    const player = Player.new(id, username);
    console.log(JSON.stringify(player));
    await this.pool.query('INSERT INTO players(id, username, score, cooldown, last_fish) VALUES ($1, $2, $3, $4, $5)', [player.id, player.username, player.score, player.cooldown, player.lastFish])
    return player;
  }

  async updatePlayer(player: Player) {
    console.log('Updating player: ' + JSON.stringify(player));
    await this.pool.query('UPDATE players SET username = $1, score = $2, cooldown = $3, last_fish = $4 WHERE id = $5', [player.username, player.score, player.cooldown, player.lastFish, player.id]);
  }

  async listByScore(maxResults: number) {
    console.log(`Listing top ${maxResults} players`);
    const { rows } = await this.pool.query('SELECT * from players ORDER BY score DESC LIMIT $1', [maxResults]);
    return rows.map(row => toPlayer(row));
  }

}

/*eslint-disable */
function toPlayer(row: any): Player {
  // eslint-disable-next-line no-unsafe-member-access no-unsafe-argument
  return new Player(row.id, row.username, row.score, row.cooldown, row.last_fish);
}
/*eslint-enable */
