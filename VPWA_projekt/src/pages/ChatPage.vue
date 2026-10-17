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
      <div v-else class="chat-message">
        <!-- profilovka + status -->
        <UserAvatar :nick-name="msg.sender" size="36px" />
        <div class="chat-message__body">
          <b>{{ msg.sender }}</b> <small class="text-grey-8">{{ msg.time }}</small>
          <div>{{ msg.text }}</div>
        </div>
      </div>
    </div>

    <div v-if="chat.typingIndicator" class="text-grey-7 text-italic q-mt-md">
      {{ chat.typingIndicator }}
    </div>
  </q-page>
</template>

<script setup>
import { useChatStore } from '@/stores/chat'
import UserAvatar from '@/components/UserAvatar.vue'

const chat = useChatStore()
</script>

<style scoped>
.chat-message {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.chat-message__body {
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
