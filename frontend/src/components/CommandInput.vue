<template>
  <div class="command-input">
    <!-- zoznam prikazov ked sprava zacina na / -->
    <q-card v-if="suggestions.length" class="command-suggestions text-dark">
      <q-list dense>
        <q-item
          v-for="command in suggestions"
          :key="command.name"
          clickable
          @click="pickCommand(command)"
        >
          <q-item-section>
            <q-item-label>
              <b>{{ command.name }}</b> <span class="text-grey-7">{{ command.args }}</span>
            </q-item-label>
            <q-item-label caption>{{ command.description }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <q-input
      ref="inputRef"
      v-model="text"
      outlined
      dense
      bg-color="white"
      placeholder="Write a message or /command"
      @keyup.enter="send"
    >
      <template #append>
        <q-btn flat dense round icon="send" color="primary" @click="send" />
      </template>
    </q-input>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useChatStore } from '@/stores/chat'

const chat = useChatStore()
const text = ref('')
const inputRef = ref(null)

// zoznam moznych prikazov
const COMMANDS = [
  { name: '/join', args: 'channelName [private/public]', description: 'Join or create a channel' },
  { name: '/invite', args: 'nickName', description: 'Invite a user to this channel' },
  { name: '/revoke', args: 'nickName', description: 'Remove a user from a private channel (admin)' },
  { name: '/kick', args: 'nickName', description: 'Vote to kick a user (admin bans immediately without voting)' },
  { name: '/list', args: '', description: 'Show members of a channel' },
  { name: '/cancel', args: '', description: 'Leave a channel (admin deletes channel)' },
  { name: '/quit', args: '', description: 'Delete a channel (only channel admin)' },
]

// zobrazi len mozne prikazy na zaklade napisaneho textu
const suggestions = computed(() => {
  if (!text.value.startsWith('/') || text.value.includes(' ')) return []
  return COMMANDS.filter((command) => command.name.startsWith(text.value.toLowerCase()))
})

// vyber prikazu kliknutim
function pickCommand(command) {
  text.value = command.args ? `${command.name} ` : command.name
  inputRef.value.focus()
}

function send() {
  chat.handleInput(text.value)
  text.value = ''
}
</script>