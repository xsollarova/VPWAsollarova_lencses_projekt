<template>
  <q-input
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
</template>

<script setup>
import { ref } from 'vue'
import { useChatStore } from '@/stores/chat'

const chat = useChatStore()
const text = ref('')

function send() {
  chat.handleInput(text.value)
  text.value = ''
}
</script>