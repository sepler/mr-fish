import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgres://miblucrmgrjzpo:9e51bee62bca6aca9c3b4bedace47a2d7fc83f8aee33dcf008a11b4529745df1@ec2-107-22-122-106.compute-1.amazonaws.com:5432/dfeu000ne4v1ht',
  ssl: {
    rejectUnauthorized: false
  }
})

console.log('start');

client.connect();

const res = await client.query('SELECT * from players');
console.log(typeof res.rows[0].last_fish);


// await client.query('DROP TABLE players')
// await client.query(`
//   CREATE TABLE players(
//     id TEXT PRIMARY KEY NOT NULL,
//     username TEXT NOT NULL,
//     score INT NOT NULL,
//     cooldown NUMERIC NOT NULL,
//     last_fish JSON
//   );
// `);

console.log('end');

client.end();