<template>
  
  <q-page class="chat-page column" :style-fn="pageHeight">
    <div class="text-h6 q-px-md q-pt-md q-pb-sm">
      {{ chat.activeChannel?.name }}
    </div>

    <div ref="scrollBox" class="chat-scroll scroll col q-px-md">
      
      <q-infinite-scroll
        :key="chat.activeChannelId"
        reverse
        :offset="100"
        :disable="!ready"
        @load="loadOlderMessages"
      >
        <template #loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="primary" size="40px" />
          </div>
        </template>

        <div
          v-for="msg in visibleMessages"
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
      </q-infinite-scroll>
    </div>

    <div class="chat-typing text-grey-7 q-px-md">
      <q-btn
        v-if="chat.activeTypingUser"
        flat
        dense
        no-caps
        class="chat-typing__button"
        :label="`${chat.activeTypingUser.nickName} is typing...`"
        @click="typingPreviewOpen = true"
      />
    </div>

    <q-dialog v-model="typingPreviewOpen">
      <q-card style="width: 360px; max-width: 90vw">
        <q-card-section class="row items-center q-gutter-sm">
          <UserAvatar :nick-name="chat.activeTypingUser?.nickName ?? ''" size="36px" />
          <div class="text-subtitle1">
            {{ chat.activeTypingUser?.nickName }} is typing
          </div>
        </q-card-section>
        <q-card-section class="typing-preview">
          {{ chat.activeTypingUser?.draftText || '...' }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import UserAvatar from '@/components/UserAvatar.vue'

const chat = useChatStore()
const scrollBox = ref(null)
const typingPreviewOpen = ref(false)

// infinite scroll je vypnuty => kym sa nenacitaju spravy kanala
const ready = ref(false)

const visibleMessages = computed(() => chat.activeMessages)

watch(
  () => chat.activeTypingUser,
  (typingUser) => {
    if (!typingUser) typingPreviewOpen.value = false
  },
)

function pageHeight(offset, height) {
  return { height: `${height - offset}px` }
}

async function scrollToBottom() {
  await nextTick()
  await new Promise(requestAnimationFrame)
  if (scrollBox.value) scrollBox.value.scrollTop = scrollBox.value.scrollHeight
}

// pri prepnuti kanala nacita jeho poslednych 20 sprav z backendu
watch(
  () => chat.activeChannelId,
  async (channelId) => {
    ready.value = false
    if (!channelId) return
    await chat.loadMessages(channelId)
    await scrollToBottom()
    ready.value = true
  },
  { immediate: true },
)

// pri novej sprave sa scrollne dole
watch(() => chat.activeMessages.at(-1)?.id, scrollToBottom)

// scroll hore => nacita starsie spravy z backendu
async function loadOlderMessages(index, done) {
  const hasMore = await chat.loadOlderMessages(chat.activeChannelId)
  done(!hasMore)
}
</script>