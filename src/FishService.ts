import { ButtonStyleTypes, InteractionResponseFlags, MessageComponentTypes } from "discord-interactions";
import DuelDao from "./dao/DuelDao.js";
import PlayerDao from "./dao/PlayerDao.js";
import { DuelStatus } from "./models/DuelStatus.js";
import LastFish from "./models/LastFish.js";
import Player from "./models/Player.js";
import { Rarity } from "./models/Rarity.js";
import { DiscordInteractionMemberUser } from "./types/types.js";
import { getRandomInt } from "./utils.js";

export default class FishService {
  playerDao: PlayerDao;
  duelDao: DuelDao;

  constructor() {
    this.playerDao = new PlayerDao();
    this.duelDao = new DuelDao();
  }

  async fish(user: DiscordInteractionMemberUser) {
    let player: Player;
    const playerMaybe = await this.playerDao.getPlayer(user.id);
    if (playerMaybe != null) {
      player = playerMaybe;
    } else {
      player = await this.playerDao.createPlayer(user.id, user.username);
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
    await this.playerDao.updatePlayer(player);
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

  async doubleOrNothing(user: DiscordInteractionMemberUser) {
    const player = await this.playerDao.getPlayer(user.id);
    if (player.lastFish.expired) {
      return {
        content: 'Opportunity expired',
        flags: InteractionResponseFlags.EPHEMERAL
      };
    }
    if (Date.now() > player.lastFish.expiresAt) {
      player.lastFish.expired = true;
      await this.playerDao.updatePlayer(player);
      return {
        content: 'Opportunity expired',
        flags: InteractionResponseFlags.EPHEMERAL
      };
    }
    if (getRandomInt(0, 2) === 0) {
      player.score += player.lastFish.points
      player.lastFish.expired = true;
      await this.playerDao.updatePlayer(player);
      return {
        content: `Doubled 📈 Caught another ${player.lastFish.rarity} fish (${player.lastFish.points}).\nTotal score: ${player.score}`
      };
    } else {
      player.score -= player.lastFish.points
      player.lastFish.expired = true;
      await this.playerDao.updatePlayer(player);
      return {
        content: `Oops 📉 Lost your catch of a ${player.lastFish.rarity} fish (-${player.lastFish.points}).\nTotal score: ${player.score}`
      };
    }
  }

  async leaderboard() {
    return 'The Big fish:\n' + (await this.playerDao.listByScore(20)).map((player, i) => {
      return `${getLeaderboardEmoji(i)} ${player.username} (${player.score} pts)`;
    }).join('\n');
  }

  async initiateFishDuel(user: DiscordInteractionMemberUser, opponent: DiscordInteractionMemberUser, wager: number) {
    const player = await this.playerDao.getPlayer(user.id);
    const opponentPlayer = await this.playerDao.getPlayer(opponent.id);
    if (player === null) {
      return {
        content: `You need to fish first`,
        flags: InteractionResponseFlags.EPHEMERAL
      };
    }
    if (opponentPlayer === null) {
      return {
        content: `${opponent.username} needs to fish first`,
        flags: InteractionResponseFlags.EPHEMERAL
      };
    }
    if (player.score < wager) {
      return {
        content: `Your score (${player.score}) must be greater than or equal to the wager (${wager})`,
        flags: InteractionResponseFlags.EPHEMERAL
      }
    }
    if (opponentPlayer.score < wager) {
      return {
        content: `${opponent.username}'s score (${opponentPlayer.score}) must be greater than or equal to the wager (${wager})`,
        flags: InteractionResponseFlags.EPHEMERAL
      }
    }
    const duel = await this.duelDao.createDuel(player.id, opponentPlayer.id, wager);
    return {
      content: `challenged <@${opponentPlayer.id}> to a duel! Wager is ${wager} points`,
      components: [
        {
          type: MessageComponentTypes.ACTION_ROW,
          components: [
            {
              type: MessageComponentTypes.BUTTON,
              // Value for your app to identify the button
              custom_id: 'fdi_accepted_' + duel.id,
              label: 'Accept',
              style: ButtonStyleTypes.SUCCESS,
              bar: 'foo'
            },
            {
              type: MessageComponentTypes.BUTTON,
              // Value for your app to identify the button
              custom_id: 'fdi_declined_' + duel.id,
              label: 'Decline',
              style: ButtonStyleTypes.DANGER,
            }
          ],
          foo: 'bar'
        }
      ]
    }
  }

  async acceptFishDuel(duelId: string) {
    const duel = await this.duelDao.getDuel(duelId);
    if (duel.status === DuelStatus.Proposed) {
      const player = await this.playerDao.getPlayer(duel.playerId);
      const opponent = await this.playerDao.getPlayer(duel.opponentId);
      if (player.score < duel.wager || opponent.score < duel.wager) {
        duel.status = DuelStatus.Canceled;
        await this.duelDao.updateDuel(duel);
        return {
          content: 'Both players no longer have enough points. Duel canceled.'
        }
      }
      const rand = getRandomInt(0, 2);
      if (rand === 0) {
        duel.status = DuelStatus.PlayerWon;
        player.score += duel.wager;
        opponent.score -= duel.wager;
        await this.duelDao.updateDuel(duel);
        await this.playerDao.updatePlayer(player);
        await this.playerDao.updatePlayer(opponent);
        return {
          content: `${player.username} won the duel and stole ${duel.wager} points!\n${player.username} total score: ${player.score}\n${opponent.username} total score: ${opponent.score}`
        }
      } else {
        duel.status = DuelStatus.OpponentWon;
        player.score -= duel.wager;
        opponent.score += duel.wager;
        await this.duelDao.updateDuel(duel);
        await this.playerDao.updatePlayer(player);
        await this.playerDao.updatePlayer(opponent);
        return {
          content: `${opponent.username} won the duel and stole ${duel.wager} points!\n${player.username} total score: ${player.score}\n${opponent.username} total score: ${opponent.score}`
        }
      }
    }
    return {
      content: 'Duel has already completed.',
      flags: InteractionResponseFlags.EPHEMERAL
    }
  }

  async declineFishDuel(duelId: string) {
    const duel = await this.duelDao.getDuel(duelId);
    if (duel.status === DuelStatus.Proposed) {
      duel.status = DuelStatus.Declined;
      await this.duelDao.updateDuel(duel);
      return {
        content: 'Duel declined.'
      }
    }
    return {
      content: 'Duel has already completed.',
      flags: InteractionResponseFlags.EPHEMERAL
    }
  }

}

function getRarity(): Rarity {
  const rand = getRandomInt(0, 100);
  if (rand < 10) { // 10%
    return Rarity.Trash;
  } else if (rand < 40) { // 30%
    return Rarity.Retarded;
  } else if (rand < 80) { // 40%
    return Rarity.Common;
  } else if (rand < 95) { // 15%
    return Rarity.Rare;
  } else if (rand < 100) { // 5%
    return Rarity.Legendary;
  }
}

function getPoints(rarity: Rarity): number {
  if (rarity === Rarity.Trash) {
    return 0;
  } else if (rarity === Rarity.Retarded) {
    return getRandomInt(1, 6);
  } else if (rarity === Rarity.Common) {
    return getRandomInt(10, 50);
  } else if (rarity === Rarity.Rare) {
    return getRandomInt(50, 200);
  } else if (rarity === Rarity.Legendary) {
    return getRandomInt(200, 1000);
  }
}

function getEmoji(rarity: Rarity): string {
  if (rarity === Rarity.Trash) {
    return '🌿';
  } else if (rarity === Rarity.Retarded) {
    return '🦦';
  } else if (rarity === Rarity.Common) {
    return '🐟';
  } else if (rarity === Rarity.Rare) {
    return '🐡';
  } else if (rarity === Rarity.Legendary) {
    return '🐠';
  }
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
