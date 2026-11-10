import { Server } from 'socket.io'
import server from '@adonisjs/core/services/server'
import db from '@adonisjs/lucid/services/db'

// socket.io server
class Ws {
  io: Server | undefined

  boot() {
    if (this.io) return
    this.io = new Server(server.getNodeServer(), {
      cors: { origin: '*' },
    })
  }

  // poslanie udalosti konkretnemu pouzivatelovi
  toUsers(userIds: number[], event: string, payload: unknown = {}) {
    for (const id of new Set(userIds)) {
      this.io?.to(`user:${id}`).emit(event, payload)
    }
  }

  // ID vsetkych clenov kanala
  async memberIds(channelId: number) {
    const rows = await db.from('channel_members').where('channel_id', channelId).select('user_id')
    return rows.map((row) => row.user_id as number)
  }
}

export default new Ws()