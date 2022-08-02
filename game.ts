import { getRandomInt } from './utils.js';
import {
  MessageComponentTypes,
  InteractionResponseFlags,
  ButtonStyleTypes
} from 'discord-interactions';
import PlayerDao from './PlayerDao.js';
import LastFish from './models/LastFish.js';
import { DiscordInteractionMemberUser } from './types/types.js';
import { Rarity } from './models/Rarity.js';
import Player from './models/Player.js';

const playerDao = new PlayerDao();

export async function leaderboard() {
  return 'The Big Fish:\n' + buildLeaderboard(await playerDao.listByScore(20));
}

export async function fish(user: DiscordInteractionMemberUser) {
  let player: Player;
  const playerMaybe = await playerDao.getPlayer(user.id);
  if (playerMaybe != null) {
    player = playerMaybe;
  } else {
    player = await playerDao.createPlayer(user.id, user.username);
  }
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
  await playerDao.updatePlayer(player);
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

export async function doubleOrNothing(user: DiscordInteractionMemberUser) {
  const player = await playerDao.getPlayer(user.id);
  if (player.lastFish.expired) {
    return {
      content: 'Opportunity expired',
      flags: InteractionResponseFlags.EPHEMERAL
    };
  }
  if (Date.now() > player.lastFish.expiresAt) {
    player.lastFish.expired = true;
    await playerDao.updatePlayer(player);
    return {
      content: 'Opportunity expired',
      flags: InteractionResponseFlags.EPHEMERAL
    };
  }
  if (getRandomInt(0, 2) === 0) {
    player.score += player.lastFish.points
    player.lastFish.expired = true;
    await playerDao.updatePlayer(player);
    return {
      content: `Doubled 📈 Caught another ${player.lastFish.rarity} fish (${player.lastFish.points}).\nTotal score: ${player.score}`
    };
  } else {
    player.score -= player.lastFish.points
    player.lastFish.expired = true;
    await playerDao.updatePlayer(player);
    return {
      content: `Oops 📉 Lost your catch of a ${player.lastFish.rarity} fish (-${player.lastFish.points}).\nTotal score: ${player.score}`
    };
  }
}

function buildLeaderboard(players: Player[]): string {
  return players.map((player, i) => {
    return `${getLeaderboardEmoji(i)} ${player.username} (${player.score} pts)`;
  }).join('\n');
}

function getLeaderboardEmoji(rank: number): string {
  if (rank == 0) {
    return '🥇';
  } else if (rank == 1) {
    return '🥈';
  } else if (rank == 2) {
    return '🥉';
  } else {
    return `${rank+1}`;
  }
}

function getRarity(): Rarity {
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

function getPoints(rarity: Rarity): number {
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

function getEmoji(rarity: Rarity): string {
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
