import { InteractionType } from "discord-interactions"

type DiscordInteractionData = {
  name: string,
  custom_id: string
}

type DiscordInteractionMember = {
  user: DiscordInteractionMemberUser
}

type DiscordInteractionMemberUser = {
  id: string,
  username: string
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
    }
  }
}
