<template>
  <q-page padding>
    <div class="text-h6 q-mb-md">
      {{ chat.activeChannel?.name }}
    </div>

    <div v-for="msg in chat.activeMessages" :key="msg.id" class="q-mb-sm">
      <b>{{ msg.sender }}</b> <small>{{ msg.time }}</small>
      <div>{{ msg.text }}</div>
    </div>
  </q-page>
</template>

<script setup>
import { useChatStore } from '@/stores/chat'

const chat = useChatStore()
</script>