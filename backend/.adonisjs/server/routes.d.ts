import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'channels.index': { paramsTuple?: []; params?: {} }
    'channels.store': { paramsTuple?: []; params?: {} }
    'channels.join': { paramsTuple?: []; params?: {} }
    'channels.leave': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.remove_member': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'userId': ParamValue} }
    'channels.invite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.kick': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.accept_invitation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.decline_invitation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'channels.index': { paramsTuple?: []; params?: {} }
    'messages.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'channels.index': { paramsTuple?: []; params?: {} }
    'messages.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'channels.store': { paramsTuple?: []; params?: {} }
    'channels.join': { paramsTuple?: []; params?: {} }
    'channels.leave': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.invite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.kick': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.accept_invitation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.decline_invitation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'channels.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.remove_member': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'userId': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}