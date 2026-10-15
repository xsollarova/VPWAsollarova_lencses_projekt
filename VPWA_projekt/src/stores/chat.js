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
    { id: 1, name: 'general', type: 'public', adminId: 1, invited: false, members: ['david', 'anna', 'peter'] },
    { id: 2, name: 'vpwa-team', type: 'private', adminId: 1, invited: false, members: ['david', 'anna'] },
    { id: 3, name: 'memes', type: 'public', adminId: 2, invited: false, members: ['david', 'peter'] },
    { id: 4, name: 'study-group', type: 'private', adminId: 2, invited: true, members: ['anna', 'peter'] },
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
    const others = channels.value.filter((c) => !c.invited)
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
    channel.invited = false
    activeChannelId.value = id
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
    openList,
    authenticate,
    handleInput,
    sendMessage,
    systemMessage,
  }
})
