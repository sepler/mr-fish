import {
  InteractionResponseFlags, InteractionResponseType, InteractionType
} from 'discord-interactions';
import 'dotenv/config';
import express, { Request, Response } from 'express';
import {
  BIG_FISH_COMMAND, FISH_COMMAND, FISH_DUEL_COMMAND, HasGuildCommands
} from './commands.js';
import FishService from './FishService.js';
import { DiscordInteractionBody, DiscordInteractionMemberUser } from './types/types.js';
import { VerifyDiscordRequest } from './utils.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

// Create FishService
const fishService = new FishService();

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', (req: Request<Record<string, unknown>, Record<string, unknown>, DiscordInteractionBody>, res: Response): void => {
  // Interaction type and data
  const body: DiscordInteractionBody = req.body;
  const { type, data, member } = body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    res.send({ type: InteractionResponseType.PONG });
    return;
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;
    const { user } = member;

    if (name === 'fish') {
      fishService.fish(user)
        .then(output => res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: output
        }))
        .catch(error => {
          console.error(error);
          res.status(500).send('Unexpected error')
        });
      return;
    }

    if (name === 'bigfish') {
      fishService.leaderboard()
        .then(output => res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: output
          }
        }))
        .catch(error => {
          console.error(error);
          res.status(500).send('Unexpected error')
        });
      return;
    }

    if (name === 'fishduel') {
      const wager: number = data.options.find(option => 'wager' === option.name).value as number;
      const opponentId: string = data.options.find(option => 'opponent' === option.name).value as string;
      const opponent = data.resolved.users[opponentId] as DiscordInteractionMemberUser;
      if (user.id === opponent.id) {
        res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'You cannot duel yourself',
            flags: InteractionResponseFlags.EPHEMERAL
          },
        });
        return;
      }
      if (opponent.bot === true) {
        res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'You cannot duel bots',
            flags: InteractionResponseFlags.EPHEMERAL
          },
        });
        return;
      }
      fishService.initiateFishDuel(user, opponent, wager)
        .then(output => res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: output
        }))
        .catch(error => {
          console.error(error);
          res.status(500).send('Unexpected error')
        });
      return;
    }
  }
  if (type === InteractionType.MESSAGE_COMPONENT) {
    // custom_id set in payload when sending message component
    const customId: string = data.custom_id;
    // user who clicked button
    const { user } = req.body.member;
    if (customId === 'fish_double_or_nothing') {
      if (user.id !== req.body.message.interaction.user.id) {
        res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Not your button to press',
            flags: InteractionResponseFlags.EPHEMERAL
          },
        });
        return;
      }
      fishService.doubleOrNothing(user)
        .then(output => res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: output,
        }))
        .catch(error => {
          console.error(error);
          res.status(500).send('Unexpected error')
        });
      return;
    }
    if (customId.startsWith('fdi_')) {
      if (user.id !== req.body.message.mentions[0].id) {
        res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Not your button to press',
            flags: InteractionResponseFlags.EPHEMERAL
          },
        });
        return;
      }
      const splitCustomId = customId.split('_');
      if (splitCustomId[1] === 'accepted') {
        fishService.acceptFishDuel(splitCustomId[2])
          .then(output => res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: output,
          }))
          .catch(error => {
            console.error(error);
            res.status(500).send('Unexpected error')
          });
        return;
      }
      if (splitCustomId[1] === 'declined') {
        fishService.declineFishDuel(splitCustomId[2])
          .then(output => res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: output,
          }))
          .catch(error => {
            console.error(error);
            res.status(500).send('Unexpected error')
          });
        return;
      }
    }
  }
})

app.listen(PORT, () => {
  console.log('Listening on port', PORT);

  // Check if guild commands from commands.json are installed (if not, install them)
  void HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, [
    FISH_COMMAND,
    BIG_FISH_COMMAND,
    FISH_DUEL_COMMAND
  ]);
});
