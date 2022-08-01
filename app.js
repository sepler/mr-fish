import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags
} from 'discord-interactions';
import { VerifyDiscordRequest, } from './utils.js';
import {
  FISH_COMMAND,
  BIG_FISH_COMMAND,
  HasGuildCommands,
} from './commands.js';
import { fish, leaderboard, doubleOrNothing } from './game.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async function (req, res) {
  // Interaction type and data
  const { type, id, data, member } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;
    const { user } = member;

    if (name === 'fish') {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: fish(user)
        });
    }

    if (name === 'bigfish') {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: leaderboard()
        }
      });
    }
  }
  if (type === InteractionType.MESSAGE_COMPONENT) {
    // custom_id set in payload when sending message component
    const componentId = data.custom_id;
    // user who clicked button
    const { user } = req.body.member;
    if (componentId === 'fish_double_or_nothing') {
      if (user.id !== req.body.message.interaction.user.id) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Not your button to press',
            flags: InteractionResponseFlags.EPHEMERAL
          },
        })
      }
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: doubleOrNothing(user),
      });
    }
  }
})

app.listen(PORT, () => {
  console.log('Listening on port', PORT);

  // Check if guild commands from commands.json are installed (if not, install them)
  HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, [
    FISH_COMMAND,
    BIG_FISH_COMMAND
  ]);
});
