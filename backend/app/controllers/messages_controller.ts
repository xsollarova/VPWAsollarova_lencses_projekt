import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Channel from '#models/channel'
import Message from '#models/message'
import { messageHistoryValidator, sendMessageValidator } from '#validators/message'
import ws from '#services/ws'

// kolko sprav sa posle naraz
const PAGE_SIZE = 20

function fail(response: HttpContext['response'], status: number, message: string) {
  return response.status(status).send({ errors: [{ message }] })
}

// tvar spravy, ktory posielame frontendu
function serializeMessage(message: Message) {
  return {
    id: message.id,
    channelId: message.channelId,
    senderId: message.senderId,
    sender: message.sender.nickName,
    text: message.text,
    createdAt: message.createdAt.toISO(),
  }
}

export default class MessagesController {
  // ziskanie poslednych 20 sprav
  async index({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.find(params.id)
    if (!channel || !(await channel.hasMember(user.id))) {
      return fail(response, 403, 'You are not a member of this channel.')
    }

    const { before } = await request.validateUsing(messageHistoryValidator, {
      data: request.qs(),
    })

    const query = Message.query()
      .where('channel_id', channel.id)
      .preload('sender')
      .orderBy('id', 'desc')
      .limit(PAGE_SIZE + 1)
    if (before) query.where('id', '<', before)

    const rows = await query
    const hasMore = rows.length > PAGE_SIZE
    const page = rows.slice(0, PAGE_SIZE).reverse()

    return { data: page.map(serializeMessage), hasMore }
  }

  // odoslanie spravy do kanalu
  async store({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await Channel.find(params.id)
    if (!channel || !(await channel.hasMember(user.id))) {
      return fail(response, 403, 'You are not a member of this channel.')
    }

    const { text } = await request.validateUsing(sendMessageValidator)

    const message = await Message.create({
      channelId: channel.id,
      senderId: user.id,
      text,
    })

    // nova sprava = kanal je aktivny (kvoli zaniku po 30 dnoch)
    channel.lastActivityAt = DateTime.local()
    await channel.save()

    await message.load('sender')
    const data = serializeMessage(message)

    // real-time poslanie: spravy posleme vsetkym clenom kanala
    ws.toUsers(await ws.memberIds(channel.id), 'message:new', data)

    return response.created({ data })
  }
}