import { DiscordRequest } from './utils.js';

/* eslint-disable */
export async function HasGuildCommands(appId, guildId, commands) {
  if (guildId === '' || appId === '') return;

  commands.forEach((c) => HasGuildCommand(appId, guildId, c));
}

// Checks for a command
async function HasGuildCommand(appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;

  try {
    const res = await DiscordRequest(endpoint, { method: 'GET' });
    const data = await res.json();

    if (data) {
      const installedNames = (data as any[]).map((c) => c['name']);
      // This is just matching on the name, so it's not good for updates
      //if (!installedNames.includes(command['name'])) {
        console.log(`Installing "${command['name']}"`);
        InstallGuildCommand(appId, guildId, command);
      // } else {
      //   console.log(`"${command['name']}" command already installed`);
      // }
    }
  } catch (err) {
    console.error(err);
  }
}

// Installs a command
export async function InstallGuildCommand(appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;
  // install command
  try {
    await DiscordRequest(endpoint, { method: 'POST', body: command });
  } catch (err) {
    console.error(err);
  }
}
/* eslint-enable */

export const FISH_COMMAND = {
  name: 'fish',
  description: 'fish command',
  type: 1
};

export const BIG_FISH_COMMAND = {
  name: 'bigfish',
  description: 'big fish command',
  type: 1
};

export const FISH_DUEL_COMMAND = {
  name: 'fishduel',
  description: 'fish duel command',
  type: 1,
  options: [
    {
      type: 6,
      name: 'opponent',
      description: 'User you want to duel',
      required: true
    },
    {
      type: 4,
      name: 'wager',
      description: 'Amount you want to bet',
      required: true,
      min_value: 1
    }
  ]
};
