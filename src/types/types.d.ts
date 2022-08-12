import { InteractionType } from "discord-interactions"

type DiscordInteractionData = {
  name: string,
  custom_id: string,
  options: DiscordInteractionDataOption[],
  resolved: {
    users: DiscordInteractionMemberUser[]
  }
}

type DiscordInteractionDataOption = {
  name: string,
  type: number,
  value: unknown
}

type DiscordInteractionMember = {
  user: DiscordInteractionMemberUser
}

type DiscordInteractionMemberUser = {
  id: string,
  username: string,
  bot?: boolean
}

type DiscordInteractionBody = {
  type: InteractionType,
  data: DiscordInteractionData,
  member: DiscordInteractionMember,
  message: {
    interaction: {
      user: {
        id: string
      }
    },
    mentions: DiscordInteractionMemberUser[]
  }
}
