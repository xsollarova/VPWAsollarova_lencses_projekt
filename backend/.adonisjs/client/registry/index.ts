/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

export type { Route, Path } from './schema.d.ts'

const placeholder: any = {}

const routes = {
  'auth.new_account.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/signup',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"signup"]],
    types: placeholder as Registry['auth.new_account.store']['types'],
  },
  'auth.access_tokens.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"login"]],
    types: placeholder as Registry['auth.access_tokens.store']['types'],
  },
  'profile.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"profile"]],
    types: placeholder as Registry['profile.profile.show']['types'],
  },
  'profile.access_tokens.destroy': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"logout"]],
    types: placeholder as Registry['profile.access_tokens.destroy']['types'],
  },
  'channels.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/channels',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"]],
    types: placeholder as Registry['channels.index']['types'],
  },
  'channels.store': {
    methods: ["POST"],
    pattern: '/api/v1/channels',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"]],
    types: placeholder as Registry['channels.store']['types'],
  },
  'channels.join': {
    methods: ["POST"],
    pattern: '/api/v1/channels/join',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[0,"join"]],
    types: placeholder as Registry['channels.join']['types'],
  },
  'channels.leave': {
    methods: ["POST"],
    pattern: '/api/v1/channels/:id/leave',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"id"],[0,"leave"]],
    types: placeholder as Registry['channels.leave']['types'],
  },
  'channels.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/channels/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"id"]],
    types: placeholder as Registry['channels.destroy']['types'],
  },
  'channels.remove_member': {
    methods: ["DELETE"],
    pattern: '/api/v1/channels/:id/members/:userId',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"id"],[0,"members"],[1,"userId"]],
    types: placeholder as Registry['channels.remove_member']['types'],
  },
  'channels.invite': {
    methods: ["POST"],
    pattern: '/api/v1/channels/:id/invitations',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"id"],[0,"invitations"]],
    types: placeholder as Registry['channels.invite']['types'],
  },
  'channels.kick': {
    methods: ["POST"],
    pattern: '/api/v1/channels/:id/kick',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"id"],[0,"kick"]],
    types: placeholder as Registry['channels.kick']['types'],
  },
  'channels.accept_invitation': {
    methods: ["POST"],
    pattern: '/api/v1/invitations/:id/accept',
    tokens: [[0,"api"],[0,"v1"],[0,"invitations"],[1,"id"],[0,"accept"]],
    types: placeholder as Registry['channels.accept_invitation']['types'],
  },
  'channels.decline_invitation': {
    methods: ["POST"],
    pattern: '/api/v1/invitations/:id/decline',
    tokens: [[0,"api"],[0,"v1"],[0,"invitations"],[1,"id"],[0,"decline"]],
    types: placeholder as Registry['channels.decline_invitation']['types'],
  },
  'messages.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/channels/:id/messages',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"id"],[0,"messages"]],
    types: placeholder as Registry['messages.index']['types'],
  },
  'messages.store': {
    methods: ["POST"],
    pattern: '/api/v1/channels/:id/messages',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"id"],[0,"messages"]],
    types: placeholder as Registry['messages.store']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
