import { join, dirname } from 'path'
import { Low, JSONFile } from 'lowdb'
import { fileURLToPath } from 'url'
import { getRandomInt } from './utils.js';
import {
  MessageComponentTypes,
  InteractionResponseFlags,
  ButtonStyleTypes
} from 'discord-interactions';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Use JSON file for storage
const file = join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

await db.read();
db.data ||= {players: {}};

export function leaderboard() {
  return 'The Big Fish:\n' + buildLeaderboard(db.data.players);
}

export function fish(user) {
  const player = getPlayer(user);
  const currTime = Date.now();
  if (Date.now() < player.cooldown) {
    const remainingMin = ((player.cooldown - currTime) / 60000).toFixed(1);
    return {
      content: "chill bro you can’t fish yet: " + remainingMin + " minutes",
      flags: InteractionResponseFlags.EPHEMERAL
    };
  }
  const rarity = getRarity();
  const points = getPoints(rarity);
  const emoji = getEmoji(rarity);
  player.score += points;
  player.cooldown = Date.now() + (45 * 60000); // 45min
  player.lastFish = new LastFish(rarity, points);
  updatePlayer(player);
  return {
    content: `Caught a ${rarity} fish ${emoji} (${points}).\nTotal score: ${player.score}`,
    components: [
      {
        type: MessageComponentTypes.ACTION_ROW,
        components: [
          {
            type: MessageComponentTypes.BUTTON,
            // Value for your app to identify the button
            custom_id: 'fish_double_or_nothing',
            label: 'Double or nothing',
            style: ButtonStyleTypes.PRIMARY,
          },
        ],
      }
    ]
  };
}

export function doubleOrNothing(user) {
  const player = getPlayer(user);
  if (player.lastFish.expired) {
    return {
      content: 'Opportunity expired',
      flags: InteractionResponseFlags.EPHEMERAL
    };
  }
  if (Date.now() > player.lastFish.expiresAt) {
    player.lastFish.expired = true;
    updatePlayer(player);
    return {
      content: 'Opportunity expired',
      flags: InteractionResponseFlags.EPHEMERAL
    };
  }
  if (getRandomInt(0, 2) === 0) {
    player.score += player.lastFish.points
    player.lastFish.expired = true;
    updatePlayer(player);
    return {
      content: `Doubled 📈 Caught another ${player.lastFish.rarity} fish (${player.lastFish.points}).\nTotal score: ${player.score}`
    };
  } else {
    player.score -= player.lastFish.points
    player.lastFish.expired = true;
    updatePlayer(player);
    return {
      content: `Oops 📉 Lost your catch of a ${player.lastFish.rarity} fish (-${player.lastFish.points}).\nTotal score: ${player.score}`
    };
  }
}

function buildLeaderboard(players) {
  const sortedPlayers = Object.values(players).sort((a, b) => {
    return b.score - a.score;
  }).splice(0,20);
  return sortedPlayers.map((player, i) => {
    return `${getLeaderboardEmoji(i)} ${player.username} (${player.score} pts)`;
  }).join('\n');
}

function getLeaderboardEmoji(rank) {
  if (rank == 0) {
    return '🥇';
  } else if (rank == 1) {
    return '🥈';
  } else if (rank == 2) {
    return '🥉';
  } else {
    return rank+1 + '';
  }
}

function getPlayer(user) {
  let player = db.data.players[user.id];
  player ||= new Player(user.id, user.username);
  return player;
}

function updatePlayer(player) {
  db.data.players[player.id] = player;
  db.write();
}

function getRarity() {
  const rand = getRandomInt(0, 100);
  if (rand < 45) { // 45%
    return Rarity.Retarded;
  } else if (rand < 80) { // 35%
    return Rarity.Common;
  } else if (rand < 95) { // 15%
    return Rarity.Rare;
  } else if (rand < 100) { // 5%
    return Rarity.Legendary;
  }
}

function getPoints(rarity) {
  if (rarity === Rarity.Retarded) {
    return getRandomInt(0, 2);
  } else if (rarity === Rarity.Common) {
    return getRandomInt(2, 50);
  } else if (rarity === Rarity.Rare) {
    return getRandomInt(50, 200);
  } else if (rarity === Rarity.Legendary) {
    return getRandomInt(200, 1000);
  }
}

function getEmoji(rarity) {
  if (rarity === Rarity.Retarded) {
    return '🦦';
  } else if (rarity === Rarity.Common) {
    return '🐟';
  } else if (rarity === Rarity.Rare) {
    return '🐡';
  } else if (rarity === Rarity.Legendary) {
    return '🐠';
  }
}

const Rarity = {
  Retarded: "Retarded",
  Common: "Common",
  Rare: "Rare",
  Legendary: "Legendary"
};

class Player {
  
  constructor(id, username) {
    this.id = id;
    this.username = username;
    this.score = 0;
    this.cooldown = 0;
    this.lastFish = null;
  }
}

class LastFish {

  constructor(rarity, points) {
    this.rarity = rarity;
    this.points = points;
    this.expired = false;
    this.expiresAt = Date.now() + (15 * 60000); // 15 min
  }
}
