/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

      // kanaly
    router
      .group(() => {
        router.get('channels', [controllers.Channels, 'index'])
        router.post('channels', [controllers.Channels, 'store'])
        router.post('channels/join', [controllers.Channels, 'join'])
        router.post('channels/:id/leave', [controllers.Channels, 'leave'])
        router.delete('channels/:id', [controllers.Channels, 'destroy'])
        router.delete('channels/:id/members/:userId', [controllers.Channels, 'removeMember'])
        router.post('channels/:id/invitations', [controllers.Channels, 'invite'])
        router.post('channels/:id/kick', [controllers.Channels, 'kick'])
        router.post('invitations/:id/accept', [controllers.Channels, 'acceptInvitation'])
        router.post('invitations/:id/decline', [controllers.Channels, 'declineInvitation'])
        // spravy
        router.get('channels/:id/messages', [controllers.Messages, 'index'])
        router.post('channels/:id/messages', [controllers.Messages, 'store'])
      })
      .use(middleware.auth())
      
  })
  .prefix('/api/v1')
