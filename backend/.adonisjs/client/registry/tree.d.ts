/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    newAccount: {
      store: typeof routes['auth.new_account.store']
    }
    accessTokens: {
      store: typeof routes['auth.access_tokens.store']
    }
  }
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
    }
    accessTokens: {
      destroy: typeof routes['profile.access_tokens.destroy']
    }
  }
  channels: {
    index: typeof routes['channels.index']
    store: typeof routes['channels.store']
    join: typeof routes['channels.join']
    leave: typeof routes['channels.leave']
    destroy: typeof routes['channels.destroy']
    removeMember: typeof routes['channels.remove_member']
    invite: typeof routes['channels.invite']
    kick: typeof routes['channels.kick']
    acceptInvitation: typeof routes['channels.accept_invitation']
    declineInvitation: typeof routes['channels.decline_invitation']
  }
  messages: {
    index: typeof routes['messages.index']
    store: typeof routes['messages.store']
  }
}
