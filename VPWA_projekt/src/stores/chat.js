import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useChatStore = defineStore('chat', () => {
  // hard code pouzivatela
  const currentUser = ref({
    id: 1,
    firstName: 'David',
    lastName: 'Test',
    nickName: 'david',
    email: 'david@test.sk',
    password: 'David1234',
    status: 'online', // online | dnd | offline
  })

  // kanály - public a private
  const channels = ref([
    { id: 1, name: 'general', type: 'public', adminId: 1, invited: false, members: ['david', 'anna', 'peter'], bannedMembers: [], kickVotes: [] },
    { id: 2, name: 'vpwa-team', type: 'private', adminId: 1, invited: false, members: ['david', 'anna'], bannedMembers: [], kickVotes: [] },
    { id: 3, name: 'memes', type: 'public', adminId: 2, invited: false, members: ['david', 'peter'], bannedMembers: [], kickVotes: [] },
    { id: 4, name: 'study-group', type: 'private', adminId: 2, invited: true, members: ['anna', 'peter'], bannedMembers: [], kickVotes: [] },
  ])

  // hard code správy všetkých kanálov v jednom poli
  const messages = ref([
    { id: 1, channelId: 1, sender: 'anna', text: 'Ahoj všetkým!', time: '10:01' },
    { id: 2, channelId: 1, sender: 'peter', text: 'Čau, @david si tu?', time: '10:02', recipient: 'david'},
    { id: 3, channelId: 1, sender: 'david', text: 'Som, čo sa deje?', time: '10:03' },
    { id: 4, channelId: 2, sender: 'anna', text: 'Kedy robíme prototyp?', time: '11:15' },
    { id: 5, channelId: 3, sender: 'peter', text: 'Pozri toto ', time: '12:40' },
  ])

  const activeChannelId = ref(1)
  const listOpen = ref(false)

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

  function authenticate(email, password) {
    return (
      email.trim().toLowerCase() === currentUser.value.email.toLowerCase() &&
      password === currentUser.value.password
    )
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

  function sendMessage(text) {
    if (!activeChannel.value) return
    const recipient = findRecipient(text)
    messages.value.push({
      id: nextMessageId++,
      channelId: activeChannelId.value,
      sender: currentUser.value.nickName,
      text,
      time: now(),
      ...(recipient ? { recipient } : {}),
    })
  }

  // systémová správa - napr. invite
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
    channels,
    messages,
    activeChannelId,
    listOpen,
    sortedChannels,
    activeChannel,
    activeMessages,
    selectChannel,
    createChannel,
    joinPublicChannel,
    leaveChannel,
    removeChannelMember,
    kickChannelMember,
    openList,
    authenticate,
    handleInput,
    sendMessage,
    systemMessage,
  }
})