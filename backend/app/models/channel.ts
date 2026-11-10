import { ChannelSchema } from '#database/schema'
import { belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'

// formatovany cas do sql
export function sqlNow(date: DateTime = DateTime.local()) {
  return date.toFormat('yyyy-MM-dd HH:mm:ss')
}

export default class Channel extends ChannelSchema {
  @belongsTo(() => User, { foreignKey: 'adminId' })
  declare admin: BelongsTo<typeof User>

  // clenovia kanalu
  @manyToMany(() => User, {
    pivotTable: 'channel_members',
    pivotForeignKey: 'channel_id',
    pivotRelatedForeignKey: 'user_id',
    pivotColumns: ['joined_at'],
  })
  declare members: ManyToMany<typeof User>

  // trvalo zabanovani pouzivatelia 
  @manyToMany(() => User, {
    pivotTable: 'channel_bans',
    pivotForeignKey: 'channel_id',
    pivotRelatedForeignKey: 'user_id',
  })
  declare bannedUsers: ManyToMany<typeof User>

  // kanal bez novej spravy viac ako 30 dni zanika
  static async deleteInactive() {
    const limit = sqlNow(DateTime.local().minus({ days: 30 }))
    await Channel.query().where('last_activity_at', '<', limit).delete()
  }

  // toLower -> aby sme mohli kanal vyhladat, ked sa pripajani
  static findByName(name: string) {
    return Channel.query().whereRaw('lower(name) = ?', [name.toLowerCase()]).first()
  }

  // kontrola ci je pouzivatel clenom kanalu
  async hasMember(userId: number) {
    const channel = this as Channel
    const row = await channel.related('members').query().where('users.id', userId).first()
    return !!row
  }

  // kontrola ci je pouzivatel zabanovany v kanali
  async isBanned(userId: number) {
    const channel = this as Channel
    const row = await channel.related('bannedUsers').query().where('users.id', userId).first()
    return !!row
  }
}