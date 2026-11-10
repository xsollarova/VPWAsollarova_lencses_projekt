import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Notify } from 'quasar'
import { api } from '@/boot/axios'

// popisy stavov
export const STATUS_LABELS = {
  online: 'Online',
  dnd: 'Do not disturb',
  offline: 'Offline',
}

export const useChatStore = defineStore('chat', () => {
  
  // prihlaseny pouzivatel => naplnime po logine/registri
  const emptyUser = () => ({
    id: null,
    firstName: '',
    lastName: '',
    nickName: '',
    email: '',
    avatarUrl: '',
    status: 'online', // online | dnd | offline
    notifyOnlyDirectMessages: false,
  })
  const currentUser = ref(emptyUser())
  const isLoggedIn = computed(() => currentUser.value.id !== null)

  // prevedieme usera z backendu => na frontend
  function setUserFromApi(user) {
    currentUser.value = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      nickName: user.nickName,
      email: user.email,
      avatarUrl: user.avatarUrl ?? '',
      status: user.status ?? 'online',
      notifyOnlyDirectMessages: Boolean(user.notifyOnlyMentions),
    }
  }

  // error v odpovedi od backendu
  function apiError(error, fallback) {
    const errors = error.response?.data?.errors
    if (Array.isArray(errors) && errors.length) return errors.map((e) => e.message).join(' ')
    if (!error.response) return 'Server is not reachable. Is the backend running?'
    return fallback
  }

  async function login(identifier, password) {
    try {
      const { data } = await api.post('/auth/login', { identifier, password })
      localStorage.setItem('token', data.data.token)
      setUserFromApi(data.data.user)
      return null
    } catch (error) {
      return apiError(error, 'Invalid email, nickname or password')
    }
  }

  async function register(form) {
    try {
      const { data } = await api.post('/auth/signup', form)
      localStorage.setItem('token', data.data.token)
      setUserFromApi(data.data.user)
      return null
    } catch (error) {
      return apiError(error, 'Registration failed')
    }
  }

  // po refreshi stranky nacitame usera podla ulozeneho tokenu
  async function fetchProfile() {
    try {
      const { data } = await api.get('/account/profile')
      setUserFromApi(data.data)
      return true
    } catch {
      localStorage.removeItem('token')
      currentUser.value = emptyUser()
      return false
    }
  }

  async function logout() {
    try {
      await api.post('/account/logout')
    } catch {
      // backend logout zlyhal
    }
    localStorage.removeItem('token')
    currentUser.value = emptyUser()
    channels.value = []
    messages.value = []
    users.value = {}
    activeChannelId.value = null
  }

  // pouzivatelia
  const users = ref({})

  function getUserId(nickName) {
    if (nickName.toLowerCase() === currentUser.value.nickName.toLowerCase()) {
      return currentUser.value.id
    }
    return users.value[nickName.toLowerCase()]?.id
  }

  function getUserStatus(nickName) {
    if (nickName.toLowerCase() === currentUser.value.nickName.toLowerCase()) {
      return currentUser.value.status
    }
    return users.value[nickName.toLowerCase()]?.status ?? 'offline'
  }

  function getUserAvatar(nickName) {
    if (nickName.toLowerCase() === currentUser.value.nickName.toLowerCase()) {
      return currentUser.value.avatarUrl
    }
    return users.value[nickName.toLowerCase()]?.avatarUrl ?? ''
  }

  // kanaly z backendu
  const channels = ref([])

  // spravy nacitane z backendu (pre vsetky otvorene kanaly)
  const messages = ref([])
  // ci ma kanal este starsie spravy na backende pre infinite scroll
  const hasMoreMessages = ref({})

  const activeChannelId = ref(null)
  const listOpen = ref(false)
  const typingUser = ref(null)
  const pendingIncomingMessages = ref([])

  // priorita pozvanok
  const sortedChannels = computed(() => {
    const invited = channels.value.filter((c) => c.invited)
    const others = channels.value.filter((c) => !c.invited  )
    return [...invited, ...others]
  })

  const activeChannel = computed(() =>
    channels.value.find((c) => c.id === activeChannelId.value),
  )

  const activeMessages = computed(() =>
    messages.value.filter((m) => m.channelId === activeChannelId.value),
  )

  const typingIndicator = computed(() =>
    typingUser.value?.channelId === activeChannelId.value
      ? `${typingUser.value.nickName} is typing...`
      : '',
  )

  const activeTypingUser = computed(() =>
    typingUser.value?.channelId === activeChannelId.value ? typingUser.value : null,
  )

  // prevedie kanal z backendu na frontend
  function mapChannel(channel) {
    for (const member of channel.members) {
      users.value[member.nickName.toLowerCase()] = member
    }
    return {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      adminId: channel.adminId,
      invited: channel.invited,
      invitationId: channel.invitationId,
      members: channel.members.map((member) => member.nickName),
    }
  }

  function showError(error, fallback) {
    Notify.create({ type: 'negative', message: apiError(error, fallback) })
  }

  // nacita kanaly prihlaseneho pouzivatela
  async function loadChannels() {
    try {
      const { data } = await api.get('/channels')
      channels.value = data.data.map(mapChannel)
    } catch (error) {
      showError(error, 'Could not load channels')
      return
    }

    const stillExists = channels.value.some(
      (c) => c.id === activeChannelId.value && !c.invited,
    )
    if (!stillExists) {
      activeChannelId.value = channels.value.find((c) => !c.invited)?.id ?? null
    }
  }

  async function selectChannel(id) {
    const channel = channels.value.find((c) => c.id === id)
    if (!channel) return

    // klik na pozvanku = prijatie pozvanky
    if (channel.invited) {
      try {
        await api.post(`/invitations/${channel.invitationId}/accept`)
      } catch (error) {
        showError(error, 'Could not accept the invitation')
        return
      }
      activeChannelId.value = id
      await loadChannels()
      return
    }
    activeChannelId.value = id
  }

  // vrati null pri uspechu, inak text chyby
  async function createChannel(name, type) {
    try {
      const { data } = await api.post('/channels', { name: name.trim(), type })
      activeChannelId.value = data.data.id
      await loadChannels()
      return null
    } catch (error) {
      return apiError(error, 'Could not create the channel')
    }
  }

  // vrati null pri uspechu, inak text chyby
  async function joinPublicChannel(name) {
    try {
      const { data } = await api.post('/channels/join', { name: name.trim() })
      activeChannelId.value = data.data.id
      await loadChannels()
      return null
    } catch (error) {
      return apiError(error, 'Could not join the channel')
    }
  }

  // opustenie kanala alebo odmietnutie pozvanky
  async function leaveChannel(id) {
    const channel = channels.value.find((c) => c.id === id)
    if (!channel) return

    try {
      if (channel.invited) {
        await api.post(`/invitations/${channel.invitationId}/decline`)
      } else {
        await api.post(`/channels/${id}/leave`)
      }
    } catch (error) {
      showError(error, 'Could not leave the channel')
      return
    }
    await loadChannels()
  }

  async function deleteChannel(id) {
    try {
      await api.delete(`/channels/${id}`)
    } catch (error) {
      showError(error, 'Could not delete the channel')
      return
    }
    messages.value = messages.value.filter((message) => message.channelId !== id)
    await loadChannels()
  }

  async function removeChannelMember(id, member) {
    const userId = getUserId(member)
    if (!userId) return

    try {
      await api.delete(`/channels/${id}/members/${userId}`)
    } catch (error) {
      showError(error, 'Could not remove the member')
      return
    }
    await loadChannels()
  }


  function openList() {
    listOpen.value = true
  }

  function notifyIncomingMessage(message, channelName) {
    if (
      currentUser.value.status === 'dnd' ||
      (currentUser.value.notifyOnlyDirectMessages && !message.recipient)
    ) {
      return
    }

    Notify.create({
      icon: 'chat',
      color: 'info',
      textColor: message.recipient ? 'white' : 'dark',
      classes: message.recipient ? 'chat-notification--mentioned' : '',
      message: `${message.sender}: ${message.text}`,
      caption: `#${channelName}`,
      timeout: 4000,
    })
  }

  function setStatus(status) {
    currentUser.value.status = status
    if (status !== 'online') return

    const messagesToDeliver = pendingIncomingMessages.value
    pendingIncomingMessages.value = []
    for (const message of messagesToDeliver) {
      const channel = channels.value.find((candidate) => candidate.id === message.channelId)
      if (!channel) continue

      messages.value.push(message)
      notifyIncomingMessage(message, channel.name)
    }
  }

  // lokalne ID pre systemove spravy (ine ako tie v nasej databaze)
  let nextLocalId = 1

  function formatTime(isoDate) {
    return new Date(isoDate).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })
  }

  function now() {
    return formatTime(new Date())
  }

  // komu je sprava adresovana (@nickname)
  function findRecipient(text, channelId = activeChannelId.value) {
    const mention = text.match(/@([a-zA-Z0-9_]+)/)
    if (!mention) return undefined
    const channel = channels.value.find((c) => c.id === channelId)
    return channel?.members.find(
      (member) => member.toLowerCase() === mention[1].toLowerCase(),
    )
  }

  // prevedie spravu z backendu na frontend
  function mapMessage(message) {
    const recipient = findRecipient(message.text, message.channelId)
    return {
      id: message.id,
      channelId: message.channelId,
      sender: message.sender,
      text: message.text,
      time: formatTime(message.createdAt),
      ...(recipient ? { recipient } : {}),
    }
  }

  // nacita poslednych 20 sprav kanala
  async function loadMessages(channelId) {
    try {
      const { data } = await api.get(`/channels/${channelId}/messages`)
      messages.value = [
        ...messages.value.filter((m) => m.channelId !== channelId),
        ...data.data.map(mapMessage),
      ]
      hasMoreMessages.value[channelId] = data.hasMore
    } catch (error) {
      showError(error, 'Could not load messages')
    }
  }

  // nacita 20 starsich sprav (infinite scroll), vrati ci su este dalsie
  async function loadOlderMessages(channelId) {
    if (!hasMoreMessages.value[channelId]) return false

    const oldest = messages.value.find(
      (m) => m.channelId === channelId && typeof m.id === 'number',
    )
    try {
      const { data } = await api.get(`/channels/${channelId}/messages`, {
        params: oldest ? { before: oldest.id } : {},
      })
      messages.value = [...data.data.map(mapMessage), ...messages.value]
      hasMoreMessages.value[channelId] = data.hasMore
      return data.hasMore
    } catch (error) {
      showError(error, 'Could not load older messages')
      return false
    }
  }

  async function sendMessage(text) {
    const channel = activeChannel.value
    if (!channel) return

    try {
      const { data } = await api.post(`/channels/${channel.id}/messages`, { text })
      messages.value.push(mapMessage(data.data))
    } catch (error) {
      systemMessage(apiError(error, 'Message could not be sent'))
    }
  }

  function systemMessage(text) {
    // bez otvoreneho kanala zobrazime spravu ako notifikaciu
    if (!activeChannel.value) {
      Notify.create({ message: text })
      return
    }
    messages.value.push({
      id: `local-${nextLocalId++}`,
      channelId: activeChannelId.value,
      sender: 'system',
      text,
      time: now(),
    })
  }

  // zavola backend pre prikaz; vrati data alebo null (chybu vypise do chatu)
  async function runCommand(request, fallback) {
    try {
      const { data } = await request()
      return data.data
    } catch (error) {
      systemMessage(apiError(error, fallback))
      return null
    }
  }

  // /join nazov [private]
  async function joinCommand(name, type) {
    const channel = await runCommand(
      () => api.post('/channels/join', { name, type }),
      'Could not join the channel',
    )
    if (!channel) return
    activeChannelId.value = channel.id
    await loadChannels()
  }

  // /invite nickName
  async function inviteCommand(nickName) {
    const channel = activeChannel.value
    const result = await runCommand(
      () => api.post(`/channels/${channel.id}/invitations`, { nickName }),
      'Could not invite the user',
    )
    if (result) systemMessage(`${result.invited} was invited to #${channel.name}.`)
  }

  // /revoke nickName (iba spravca sukromneho kanala)
  async function revokeCommand(nickName) {
    const channel = activeChannel.value
    if (channel.type !== 'private') {
      systemMessage('/revoke works only in private channels. Use /kick in public channels.')
      return
    }
    const userId = getUserId(nickName)
    if (!userId || !channel.members.some((m) => m.toLowerCase() === nickName.toLowerCase())) {
      systemMessage(`${nickName} is not a member of this channel.`)
      return
    }
    const result = await runCommand(
      () => api.delete(`/channels/${channel.id}/members/${userId}`),
      'Could not remove the user',
    )
    if (!result) return
    await loadChannels()
    systemMessage(`${nickName} was removed from #${channel.name}.`)
  }

  // /kick nickName
  async function kickCommand(nickName) {
    const channel = activeChannel.value
    const result = await runCommand(
      () => api.post(`/channels/${channel.id}/kick`, { nickName }),
      'Could not kick the user',
    )
    if (!result) return
    if (result.status === 'voted') {
      systemMessage(`Kick vote added for ${result.nickName} (${result.votes}/3).`)
      return
    }
    await loadChannels()
    systemMessage(`${result.nickName} was permanently banned from #${channel.name}.`)
  }

  // /quit (spravca zrusi kanal)
  async function quitCommand() {
    const channel = activeChannel.value
    if (channel.adminId !== currentUser.value.id) {
      systemMessage('Only the channel admin can close the channel.')
      return
    }
    await deleteChannel(channel.id)
    Notify.create({ message: `Channel #${channel.name} was closed.` })
  }

  // /cancel (opustenie kanala, ak je spravca, kanal zanika)
  async function cancelCommand() {
    const channel = activeChannel.value
    await leaveChannel(channel.id)
    Notify.create({
      message:
        channel.adminId === currentUser.value.id
          ? `You left #${channel.name}. As the admin, the channel was closed.`
          : `You left #${channel.name}.`,
    })
  }

  function handleInput(raw) {
    const text = raw.trim()
    if (!text) return

    // obycajna sprava
    if (!text.startsWith('/')) {
      sendMessage(text)
      return
    }

    // rozdelenie prikazu na nazov a argumenty: "/kick peter" => ['/kick', 'peter']
    const [command, ...args] = text.split(/\s+/)
    const name = command.toLowerCase()

    if (name === '/join') {
      const [channelName, type = 'public'] = args
      if (!channelName || args.length > 2 || !['public', 'private'].includes(type.toLowerCase())) {
        systemMessage('Usage: /join channelName [private]')
        return
      }
      joinCommand(channelName, type.toLowerCase())
      return
    }

    // ostatne prikazy potrebuju otvoreny kanal
    if (!activeChannel.value) {
      systemMessage('Open a channel first.')
      return
    }

    // prikazy s jednym argumentom nickName
    const nickCommands = {
      '/invite': inviteCommand,
      '/revoke': revokeCommand,
      '/kick': kickCommand,
    }
    if (nickCommands[name]) {
      if (args.length !== 1) {
        systemMessage(`Usage: ${name} nickName`)
        return
      }
      nickCommands[name](args[0].replace(/^@/, ''))
      return
    }

    // prikazy bez argumentov
    const simpleCommands = {
      '/list': openList,
      '/quit': quitCommand,
      '/cancel': cancelCommand,
    }
    if (simpleCommands[name]) {
      simpleCommands[name]()
      return
    }

    systemMessage(`Unknown command: ${command}`)
  }

  return {
    currentUser,
    users,
    getUserStatus,
    getUserId,
    getUserAvatar,
    setStatus,
    channels,
    messages,
    activeChannelId,
    listOpen,
    typingUser,
    activeTypingUser,
    sortedChannels,
    activeChannel,
    activeMessages,
    typingIndicator,
    loadChannels,
    selectChannel,
    loadMessages,
    loadOlderMessages,
    createChannel,
    joinPublicChannel,
    leaveChannel,
    deleteChannel,
    removeChannelMember,
    openList,
    isLoggedIn,
    login,
    register,
    fetchProfile,
    logout,
    handleInput,
    sendMessage,
    systemMessage,
  }
})