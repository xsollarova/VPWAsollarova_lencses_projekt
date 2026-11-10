import app from '@adonisjs/core/services/app'
import { Secret } from '@adonisjs/core/helpers'
import ws from '#services/ws'
import User from '#models/user'

app.ready(() => {
  ws.boot()
  const io = ws.io!

  // pripojenie prihlaseneho pouzivatela
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      const accessToken = await User.accessTokens.verify(new Secret(token))
      if (!accessToken) return next(new Error('Unauthorized'))
      socket.data.userId = Number(accessToken.tokenableId)
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    // kazdy pouzivatel zvlast
    socket.join(`user:${socket.data.userId}`)
  })
})