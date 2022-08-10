import pg from 'pg';
import Duel from '../models/Duel.js';
import { DuelStatus } from '../models/DuelStatus.js';

export default class DuelDao {
  pool: pg.Pool;

  constructor() {
    this.pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    this.pool.query(`
      CREATE TABLE IF NOT EXISTS duels(
        id TEXT PRIMARY KEY,
        initiatior_id TEXT NOT NULL,
        challenged_id TEXT NOT NULL,
        wager INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `).catch(error => {
      throw error;
    });
  }

  async getDuel(id: string) {
    console.log(`Getting duel by id: ${id}`);
    const { rows } = await this.pool.query('SELECT * FROM duels WHERE id = $1', [id]);
    if (rows.length === 0) {
      console.log(`No duel found for id: ${id}`);
      return null;
    }
    return toDuel(rows[0]);
  }

  async createDuel(initiatiorId: string, challengedId: string, wager: number) {
    const duel = Duel.new(initiatiorId, challengedId, wager);
    console.log(`Creating duel: ${JSON.stringify(duel)}`);
    await this.pool.query('INSERT INTO duels(id, initiatior_id, challenged_id, wager, status, created_at) VALUES ($1, $2, $3, $4, $5, $6)', [duel.id, duel.initiatiorId, duel.challengedId, duel.wager, duel.status, duel.createdAt])
    return duel;
  }

  async updateDuel(duel: Duel) {
    console.log('Updating duel: ' + JSON.stringify(duel));
    await this.pool.query('UPDATE duels SET status = $1 WHERE id = $2', [duel.status, duel.id]);
  }
}

/*eslint-disable */
function toDuel(row: any): Duel {
  // eslint-disable-next-line no-unsafe-member-access no-unsafe-argument
  return new Duel(row.id, row.initiatior_id, row.challenged_id, row.wager, DuelStatus[row.status], row.created_at);
}
/*eslint-enable */
