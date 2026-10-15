<template>
  <q-page padding class="chat-page">
    <div class="text-h6 q-mb-md">
      {{ chat.activeChannel?.name }}
    </div>

    <div
      v-for="msg in chat.activeMessages"
      :key="msg.id"
      class="q-mb-sm"
      :class="{
        'chat-message--mentioned':
          msg.recipient?.toLowerCase() === chat.currentUser.nickName.toLowerCase(),
      }"
    >
      <div v-if="msg.sender === 'system'" class="text-grey-7 text-italic">
        {{ msg.text }}
      </div>
      <template v-else>
        <b>{{ msg.sender }}</b> <small>{{ msg.time }}</small>
        <div>{{ msg.text }}</div>
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { useChatStore } from '@/stores/chat'

const chat = useChatStore()
</script>
