import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Channel, { sqlNow } from '#models/channel'
import Invitation from '#models/invitation'
import User from '#models/user'
import {
  createChannelValidator,
  inviteValidator,
  joinChannelValidator,
} from '#validators/channel'
import db from '@adonisjs/lucid/services/db'
import ws from '#services/ws'

// zobrazenie chyby na frontende
function fail(response: HttpContext['response'], status: number, message: string) {
  return response.status(status).send({ errors: [{ message }] })
}

// info o kanale pre frontend
function serializeChannel(channel: Channel, invitation?: Invitation) {
  return {
    id: channel.id,
    name: channel.name,
    type: channel.type,
    adminId: channel.adminId,
    invited: !!invitation,
    invitationId: invitation?.id ?? null,
    members: channel.members.map((member) => ({
      id: member.id,
      nickName: member.nickName,
      firstName: member.firstName,
      lastName: member.lastName,
      status: member.status,
      avatarUrl: member.avatarUrl,
    })),
  }
}

// real-time: pouzivatelia si znova nacitaju zoznam kanalov
function channelsChanged(userIds: number[]) {
  ws.toUsers(userIds, 'channels:changed')
}

// vytvorenie kanalu
async function createChannel(name: string, type: string, admin: User) {
  const channel = await Channel.create({
    name,
    type,
    adminId: admin.id,
    lastActivityAt: DateTime.local(),
  })
  await channel.related('members').attach({ [admin.id]: { joined_at: sqlNow() } })
  await channel.load('members')
  return channel
}

export default class ChannelsController {
  // ziska kanaly, kde je uzivatel clenom alebo je pozvany
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    await Channel.deleteInactive()

    const invitations = await Invitation.query()
      .where('invited_user_id', user.id)
      .where('status', 'pending')
      .preload('channel', (query) => query.preload('members'))
      .orderBy('created_at', 'desc')

    const channels = await Channel.query()
      .whereHas('members', (query) => query.where('users.id', user.id))
      .preload('members')
      .orderBy('last_activity_at', 'desc')

    return {
      data: [
        ...invitations.map((invitation) => serializeChannel(invitation.channel, invitation)),
        ...channels.map((channel) => serializeChannel(channel)),
      ],
    }
  }
//join
  // vytvorenie kanalu
  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { name, type } = await request.validateUsing(createChannelValidator)
    await Channel.deleteInactive()
    //error
    if (await Channel.findByName(name)) {
      return fail(response, 409, `Channel "${name}" already exists.`)
    }

    const channel = await createChannel(name, type, user)
    return response.created({ data: serializeChannel(channel) })
  }

  // join public kanala
  async join({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { name, type } = await request.validateUsing(joinChannelValidator)
    await Channel.deleteInactive()

    let channel = await Channel.findByName(name)
    //ak neexistuje, vyrobí sa
    if (!channel) {
      channel = await createChannel(name, type ?? 'public', user)
      return response.created({ data: serializeChannel(channel) })
    }

    if (await channel.hasMember(user.id)) {
      await channel.load('members')
      return { data: serializeChannel(channel) }
    }
    if (await channel.isBanned(user.id)) {
      return fail(response, 403, 'You are permanently banned from this channel.')
    }
    if (channel.type === 'private') {
      return fail(response, 403, 'This channel is private. You need an invitation.')
    }

    await channel.related('members').attach({ [user.id]: { joined_at: sqlNow() } })
    await Invitation.query()
      .where('channel_id', channel.id)
      .where('invited_user_id', user.id)
      .where('status', 'pending')
      .update({ status: 'accepted' })
    await channel.load('members')
    channelsChanged(await ws.memberIds(channel.id))
    return { data: serializeChannel(channel) }
  }

  // /leave : channel, ak je admin, kanal sa zmaze
  async leave({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.find(params.id)
    if (!channel || !(await channel.hasMember(user.id))) {
      return fail(response, 404, 'You are not a member of this channel.')
    }

    const memberIds = await ws.memberIds(channel.id)

    if (channel.adminId === user.id) {
      await channel.delete()
      channelsChanged(memberIds)
      return { data: { deleted: true } }
    }

    await channel.related('members').detach([user.id])
    channelsChanged(memberIds)
    return { data: { deleted: false } }
  }

  // mazanie kanala (admin)
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.find(params.id)
    if (!channel) return fail(response, 404, 'Channel not found.')
    if (channel.adminId !== user.id) {
      return fail(response, 403, 'Only the channel admin can delete the channel.')
    }

    const memberIds = await ws.memberIds(channel.id)
    await channel.delete()
    channelsChanged(memberIds)
    return { data: { deleted: true } }
  }

  // /revoke : odobratie clena kanala (admin)
  async removeMember({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.find(params.id)
    if (!channel) return fail(response, 404, 'Channel not found.')
    if (channel.adminId !== user.id) {
      return fail(response, 403, 'Only the channel admin can remove members.')
    }
    if (Number(params.userId) === user.id) {
      return fail(response, 400, 'You cannot remove yourself.')
    }

    const memberIds = await ws.memberIds(channel.id)
    await channel.related('members').detach([params.userId])
    await channel.load('members')
    channelsChanged(memberIds)
    return { data: serializeChannel(channel) }
  }

  // /invite a /revoke : invite do kanalu
  async invite({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { nickName } = await request.validateUsing(inviteValidator)

    const channel = await Channel.find(params.id)
    if (!channel || !(await channel.hasMember(user.id))) {
      return fail(response, 404, 'You are not a member of this channel.')
    }

    const isAdmin = channel.adminId === user.id
    if (channel.type === 'private' && !isAdmin) {
      return fail(response, 403, 'Only the channel admin can invite to a private channel.')
    }

    const target = await User.query().whereRaw('lower(nick_name) = ?', [nickName.toLowerCase()]).first()
    if (!target) return fail(response, 404, `User "${nickName}" does not exist.`)
    if (await channel.hasMember(target.id)) {
      return fail(response, 409, `${target.nickName} is already a member of this channel.`)
    }

    if (await channel.isBanned(target.id)) {
      if (!isAdmin) {
        return fail(response, 403, `${target.nickName} is banned. Only the admin can invite them.`)
      }
      // spravca pozvankou obnovi pristup zabanovanemu
      await channel.related('bannedUsers').detach([target.id])
    }

    const pending = await Invitation.query()
      .where('channel_id', channel.id)
      .where('invited_user_id', target.id)
      .where('status', 'pending')
      .first()
    if (pending) return fail(response, 409, `${target.nickName} has already been invited.`)

    await Invitation.create({
      channelId: channel.id,
      invitedUserId: target.id,
      invitedById: user.id,
      status: 'pending',
    })
    channelsChanged([target.id])
    return response.created({ data: { invited: target.nickName } })
  }

  // prijatie pozvanky do kanalu
  async acceptInvitation({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const invitation = await Invitation.query()
      .where('id', params.id)
      .where('invited_user_id', user.id)
      .where('status', 'pending')
      .preload('channel')
      .first()
    if (!invitation) return fail(response, 404, 'Invitation not found.')

    const channel = invitation.channel
    if (!(await channel.hasMember(user.id))) {
      await channel.related('members').attach({ [user.id]: { joined_at: sqlNow() } })
    }
    invitation.status = 'accepted'
    await invitation.save()

    await channel.load('members')
    channelsChanged(await ws.memberIds(channel.id))
    return { data: serializeChannel(channel) }
  }

  // odmietnutie pozvanky do kanalu
  async declineInvitation({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const invitation = await Invitation.query()
      .where('id', params.id)
      .where('invited_user_id', user.id)
      .where('status', 'pending')
      .first()
    if (!invitation) return fail(response, 404, 'Invitation not found.')

    invitation.status = 'declined'
    await invitation.save()
    return { data: { declined: true } }
  }

  // /kick
  // spravca: okamzity trvaly ban
  // clen verejneho kanala: hlas (3 hlasy = trvaly ban)
  async kick({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { nickName } = await request.validateUsing(inviteValidator)

    const channel = await Channel.find(params.id)
    if (!channel || !(await channel.hasMember(user.id))) {
      return fail(response, 404, 'You are not a member of this channel.')
    }

    const target = await User.query().whereRaw('lower(nick_name) = ?', [nickName.toLowerCase()]).first()
    if (!target || !(await channel.hasMember(target.id))) {
      return fail(response, 404, `${nickName} is not a member of this channel.`)
    }
    if (target.id === user.id) return fail(response, 400, 'You cannot kick yourself.')
    if (target.id === channel.adminId) {
      return fail(response, 403, 'You cannot kick the channel admin.')
    }

    const isAdmin = channel.adminId === user.id
    if (!isAdmin && channel.type === 'private') {
      return fail(response, 403, 'Only the channel admin can kick members in a private channel.')
    }

    // trvaly ban: odobrat z clenov, zapisat do channel_bans, zmazat hlasy
    const ban = async (bannedById: number | null) => {
      const memberIds = await ws.memberIds(channel.id)
      await channel.related('members').detach([target.id])
      await db.table('channel_bans').insert({
        channel_id: channel.id,
        user_id: target.id,
        banned_by_id: bannedById,
        created_at: sqlNow(),
      })
      await db
        .from('kick_votes')
        .where('channel_id', channel.id)
        .where('target_user_id', target.id)
        .delete()
      channelsChanged(memberIds)
    }

    if (isAdmin) {
      await ban(user.id)
      return { data: { status: 'banned', nickName: target.nickName } }
    }

    // hlasovanie clenov
    const alreadyVoted = await db
      .from('kick_votes')
      .where('channel_id', channel.id)
      .where('target_user_id', target.id)
      .where('voter_user_id', user.id)
      .first()
    if (alreadyVoted) {
      return fail(response, 409, `You have already voted to kick ${target.nickName}.`)
    }

    await db.table('kick_votes').insert({
      channel_id: channel.id,
      target_user_id: target.id,
      voter_user_id: user.id,
      created_at: sqlNow(),
    })

    const result = await db
      .from('kick_votes')
      .where('channel_id', channel.id)
      .where('target_user_id', target.id)
      .count('* as total')
    const votes = Number(result[0].total)

    if (votes >= 3) {
      await ban(null)
      return { data: { status: 'banned', nickName: target.nickName, votes } }
    }
    return { data: { status: 'voted', nickName: target.nickName, votes } }
  }
}