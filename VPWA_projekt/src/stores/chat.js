import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Notify } from 'quasar'

// popisy stavov
export const STATUS_LABELS = {
  online: 'Online',
  dnd: 'Do not disturb',
  offline: 'Offline',
}

export const useChatStore = defineStore('chat', () => {
  // hard code pouzivatela
  const currentUser = ref({
    id: 1,
    firstName: 'David',
    lastName: 'Test',
    nickName: 'david',
    email: 'david@test.sk',
    password: 'David1234',
    avatarUrl: '',
    status: 'online', // online | dnd | offline | xdnd
    notifyOnlyDirectMessages: false,
  })

  // hard code ostatni pouzivatelia + ich statusy
  const users = ref({
    anna: { id: 2, nickName: 'anna', firstName: 'Anna', lastName: 'Nová', status: 'online' },
    peter: { id: 3, nickName: 'peter', firstName: 'Peter', lastName: 'Malý', status: 'dnd' },
    marek: { id: 4, nickName: 'marek', firstName: 'Marek', lastName: 'Kováč', status: 'offline' },
  })

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

  // kanály - public a private
  const channels = ref([
    { id: 1, name: 'general', type: 'public', adminId: 1, invited: false, members: ['david', 'anna', 'peter', 'marek'], bannedMembers: [], kickVotes: [] },
    { id: 2, name: 'vpwa-team', type: 'private', adminId: 1, invited: false, members: ['david', 'anna'], bannedMembers: [], kickVotes: [] },
    { id: 3, name: 'memes', type: 'public', adminId: 2, invited: false, members: ['david', 'peter'], bannedMembers: [], kickVotes: [] },
    { id: 4, name: 'study-group', type: 'private', adminId: 2, invited: true, members: ['anna', 'peter'], bannedMembers: [], kickVotes: [] },
  ])

  // vygenerovanie histórie správ pre infinite scroll
  function generateHistory(count) {
    const senders = ['anna', 'peter', 'marek', 'david']
    const history = []
    for (let i = 1; i <= count; i++) {
      const minutes = 8 * 60 + i
      const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
      history.push({
        id: 1000 + i,
        channelId: 1,
        sender: senders[i % senders.length],
        text: `Správa č. ${i}`,
        time,
      })
    }
    return history
  }

  // hard code správy všetkých kanálov v jednom poli
  const messages = ref([
    ...generateHistory(60),
    { id: 1, channelId: 1, sender: 'anna', text: 'Ahoj všetkým!', time: '10:01' },
    { id: 2, channelId: 1, sender: 'peter', text: 'Čau, @david si tu?', time: '10:02', recipient: 'david'},
    { id: 3, channelId: 1, sender: 'david', text: 'Som, čo sa deje?', time: '10:03' },
    { id: 4, channelId: 2, sender: 'anna', text: 'Kedy robíme prototyp?', time: '11:15' },
    { id: 5, channelId: 3, sender: 'peter', text: 'Pozri toto ', time: '12:40' },
  ])

  const activeChannelId = ref(1)
  const listOpen = ref(false)
  const typingUser = ref(null)
  const pendingIncomingMessages = ref([])
  let typingInterval
  let typingTimeout

  // priorita pozvanok
  const sortedChannels = computed(() => {
    const invited = channels.value.filter((c) => c.invited)
    const others = channels.value.filter(
      (c) => !c.invited && c.members.includes(currentUser.value.nickName),
    )
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

  function selectChannel(id) {
    const channel = channels.value.find((c) => c.id === id)
    if (!channel) return
    if (
      channel.bannedMembers.some(
        (member) => member.toLowerCase() === currentUser.value.nickName.toLowerCase(),
      )
    ) {
      return
    }
    if (channel.invited && !channel.members.includes(currentUser.value.nickName)) {
      channel.members.push(currentUser.value.nickName)
    }
    channel.invited = false
    activeChannelId.value = id
  }

  function createChannel(name, type) {
    const channelName = name.trim()
    if (!channelName) return

    const id = Math.max(0, ...channels.value.map((channel) => channel.id)) + 1
    channels.value.push({
      id,
      name: channelName,
      type,
      adminId: currentUser.value.id,
      invited: false,
      members: [currentUser.value.nickName],
      bannedMembers: [],
      kickVotes: [],
    })
    activeChannelId.value = id
  }

  function joinPublicChannel(name) {
    const channelName = name.trim().toLowerCase()
    if (!channelName) return 'not-found'

    const channel = channels.value.find(
      (candidate) => candidate.name.toLowerCase() === channelName,
    )
    if (!channel) return 'not-found'
    if (channel.type !== 'public') return 'private'

    const nickName = currentUser.value.nickName
    if (
      channel.bannedMembers.some(
        (member) => member.toLowerCase() === nickName.toLowerCase(),
      )
    ) {
      return 'banned'
    }
    if (channel.members.includes(nickName)) {
      activeChannelId.value = channel.id
      return 'already-member'
    }

    channel.members.push(nickName)
    channel.invited = false
    activeChannelId.value = channel.id
    return 'joined'
  }

  function leaveChannel(id) {
    const channel = channels.value.find((c) => c.id === id)
    if (!channel) return

    channel.members = channel.members.filter(
      (member) => member !== currentUser.value.nickName,
    )
    channel.kickVotes = channel.kickVotes.filter(
      (vote) => vote.target.toLowerCase() !== currentUser.value.nickName.toLowerCase(),
    )
    channel.invited = false

    if (activeChannelId.value === id) {
      activeChannelId.value = sortedChannels.value[0]?.id ?? null
    }
  }

  function deleteChannel(id) {
    const channel = channels.value.find((candidate) => candidate.id === id)
    if (!channel) return 'channel-not-found'
    if (channel.adminId !== currentUser.value.id) return 'not-admin'

    channels.value = channels.value.filter((candidate) => candidate.id !== id)
    messages.value = messages.value.filter((message) => message.channelId !== id)
    pendingIncomingMessages.value = pendingIncomingMessages.value.filter(
      (message) => message.channelId !== id,
    )

    if (typingUser.value?.channelId === id) {
      clearInterval(typingInterval)
      clearTimeout(typingTimeout)
      typingInterval = null
      typingTimeout = null
      typingUser.value = null
    }

    if (activeChannelId.value === id) {
      activeChannelId.value = sortedChannels.value[0]?.id ?? null
    }

    return 'deleted'
  }

  function removeChannelMember(id, member) {
    const channel = channels.value.find((c) => c.id === id)
    if (!channel) return 'channel-not-found'
    if (channel.adminId !== currentUser.value.id) return 'not-admin'
    if (member.toLowerCase() === currentUser.value.nickName.toLowerCase()) {
      return 'cannot-remove-self'
    }

    const memberToRemove = channel.members.find(
      (channelMember) => channelMember.toLowerCase() === member.toLowerCase(),
    )
    if (!memberToRemove) return 'member-not-found'

    channel.members = channel.members.filter((channelMember) => channelMember !== memberToRemove)
    channel.kickVotes = channel.kickVotes.filter(
      (vote) => vote.target.toLowerCase() !== memberToRemove.toLowerCase(),
    )
    return 'removed'
  }

  function kickChannelMember(id, member) {
    const channel = channels.value.find((candidate) => candidate.id === id)
    if (!channel) return { status: 'channel-not-found' }

    const target = channel.members.find(
      (channelMember) => channelMember.toLowerCase() === member.toLowerCase(),
    )
    if (!target) return { status: 'member-not-found' }
    if (target.toLowerCase() === currentUser.value.nickName.toLowerCase()) {
      return { status: 'cannot-kick-self' }
    }

    if (channel.adminId === currentUser.value.id) {
      channel.members = channel.members.filter((channelMember) => channelMember !== target)
      channel.bannedMembers.push(target)
      channel.kickVotes = channel.kickVotes.filter(
        (vote) => vote.target.toLowerCase() !== target.toLowerCase(),
      )
      return { status: 'permanently-banned' }
    }

    if (channel.type !== 'public') return { status: 'not-admin' }
    if (!channel.members.some(
      (channelMember) =>
        channelMember.toLowerCase() === currentUser.value.nickName.toLowerCase(),
    )) {
      return { status: 'not-member' }
    }

    let vote = channel.kickVotes.find(
      (entry) => entry.target.toLowerCase() === target.toLowerCase(),
    )
    if (!vote) {
      vote = { target, voters: [] }
      channel.kickVotes.push(vote)
    }

    const nickName = currentUser.value.nickName
    if (vote.voters.some((voter) => voter.toLowerCase() === nickName.toLowerCase())) {
      return { status: 'already-voted', votes: vote.voters.length }
    }

    vote.voters.push(nickName)
    if (vote.voters.length < 3) {
      return { status: 'vote-added', votes: vote.voters.length }
    }

    channel.members = channel.members.filter((channelMember) => channelMember !== target)
    channel.bannedMembers.push(target)
    channel.kickVotes = channel.kickVotes.filter(
      (entry) => entry.target.toLowerCase() !== target.toLowerCase(),
    )
    return { status: 'permanently-banned', votes: vote.voters.length }
  }

  function openList() {
    listOpen.value = true
  }

  function authenticate(identifier, password) {
    if (typeof identifier !== 'string' || typeof password !== 'string') return false
    if (password.length < 8 || password.length > 128) return false

    const normalizedIdentifier = identifier.trim().normalize('NFKC').toLowerCase()
    if (!normalizedIdentifier || !password) return false

    const email = currentUser.value.email.trim().normalize('NFKC').toLowerCase()
    const nickName = currentUser.value.nickName.trim().normalize('NFKC').toLowerCase()
    const matchesEmail = normalizedIdentifier === email
    const matchesNickname =
      normalizedIdentifier === nickName

    return (matchesEmail || matchesNickname) && password === currentUser.value.password
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

  let nextMessageId = 100

  function now() {
    return new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })
  }

  function findRecipient(text) {
    const mention = text.match(/@([a-zA-Z0-9_]+)/)
    if (!mention) return undefined
    return activeChannel.value?.members.find(
      (member) => member.toLowerCase() === mention[1].toLowerCase(),
    )
  }

  function simulateIncomingMessage(channel, sender, isDirectMessage) {
    clearInterval(typingInterval)
    clearTimeout(typingTimeout)
    const recipient = isDirectMessage ? currentUser.value.nickName : undefined
    const text = recipient
      ? `@${recipient} Thanks for reaching out!`
      : 'Thanks for your message!'
    let visibleCharacterCount = 0
    typingUser.value = { channelId: channel.id, nickName: sender, draftText: '' }

    typingInterval = setInterval(() => {
      visibleCharacterCount += 1
      if (typingUser.value?.channelId === channel.id) {
        typingUser.value.draftText = text.slice(0, visibleCharacterCount)
      }
      if (visibleCharacterCount >= text.length) {
        clearInterval(typingInterval)
        typingInterval = null
        typingTimeout = setTimeout(finishTyping, 500)
      }
    }, 100)

    function finishTyping() {
      typingUser.value = null
      typingTimeout = null
      if (!channel.members.includes(sender)) return

      const message = {
        id: nextMessageId++,
        channelId: channel.id,
        sender,
        text,
        time: now(),
        ...(recipient ? { recipient } : {}),
      }

      if (currentUser.value.status === 'offline') {
        pendingIncomingMessages.value.push(message)
      } else {
        messages.value.push(message)
        notifyIncomingMessage(message, channel.name)
      }
    }
  }

  function sendMessage(text) {
    const channel = activeChannel.value
    if (!channel) return
    const recipient = findRecipient(text)
    messages.value.push({
      id: nextMessageId++,
      channelId: channel.id,
      sender: currentUser.value.nickName,
      text,
      time: now(),
      ...(recipient ? { recipient } : {}),
    })

    const otherMembers = channel.members.filter(
      (member) => member.toLowerCase() !== currentUser.value.nickName.toLowerCase(),
    )
    if (!otherMembers.length) return

    const sender =
      recipient && recipient.toLowerCase() !== currentUser.value.nickName.toLowerCase()
        ? recipient
        : otherMembers[0]
    simulateIncomingMessage(channel, sender, Boolean(recipient))
  }

  function systemMessage(text) {
    if (!activeChannel.value) return
    messages.value.push({
      id: nextMessageId++,
      channelId: activeChannelId.value,
      sender: 'system',
      text,
      time: now(),
    })
  }

  function handleInput(raw) {
    const text = raw.trim()
    if (!text) return
    if (text === '/list') {
      openList()
      return
    }
    const kickCommand = text.match(/^\/kick(?:\s+(.*))?$/i)
    if (kickCommand) {
      const member = kickCommand[1]?.trim()
      if (!member || /\s/.test(member)) {
        systemMessage('Usage: /kick nickname')
        return
      }

      const result = kickChannelMember(activeChannelId.value, member)
      const feedback =
        result.status === 'vote-added'
          ? `Kick vote added for ${member} (${result.votes}/3).`
          : result.status === 'already-voted'
            ? `You have already voted to kick ${member} (${result.votes}/3).`
            : {
                'permanently-banned': `${member} was permanently banned from this channel.`,
                'channel-not-found': 'There is no active channel.',
                'not-admin': 'Only the channel admin can kick members in private channels.',
                'not-member': 'Only channel members can vote to kick someone.',
                'cannot-kick-self': 'You cannot kick yourself.',
                'member-not-found': `Member "${member}" was not found in this channel.`,
              }[result.status]
      systemMessage(feedback)
      return
    }
    sendMessage(text)
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
    selectChannel,
    createChannel,
    joinPublicChannel,
    leaveChannel,
    deleteChannel,
    removeChannelMember,
    kickChannelMember,
    openList,
    authenticate,
    handleInput,
    sendMessage,
    systemMessage,
  }
})