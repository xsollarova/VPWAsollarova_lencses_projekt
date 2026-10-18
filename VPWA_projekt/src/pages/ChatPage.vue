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

    <div class="chat-typing text-grey-7 text-italic q-px-md">
      {{ chat.typingIndicator }}
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import UserAvatar from '@/components/UserAvatar.vue'

const chat = useChatStore()
const scrollBox = ref(null)

// pocet sprav, ktore sa nacitaju z historie
const PAGE_SIZE = 20

// index prvej zobrazenej správy
const firstVisibleIndex = ref(0)

// infinite scroll je vypnuty => kym sa nescrollne hore
const ready = ref(false)

// spravy sa zobrazuju od hodnoty firstVisibleIndex-u
const visibleMessages = computed(() => chat.activeMessages.slice(firstVisibleIndex.value))

function pageHeight(offset, height) {
  return { height: `${height - offset}px` }
}

async function scrollToBottom() {
  await nextTick()
  await new Promise(requestAnimationFrame)
  if (scrollBox.value) scrollBox.value.scrollTop = scrollBox.value.scrollHeight
}

// pri kliknuti na kanal ukaze len posledných PAGE_SIZE sprav
watch(
  () => chat.activeChannelId,
  async () => {
    ready.value = false
    firstVisibleIndex.value = Math.max(0, chat.activeMessages.length - PAGE_SIZE)
    await scrollToBottom()
    ready.value = true
  },
  { immediate: true },
)

// pri novej sprave sa scrollne dole
watch(() => chat.activeMessages.length, scrollToBottom)

function loadOlderMessages(index, done) {
  if (firstVisibleIndex.value === 0) {
    done(true)
    return
  }
  // simulácia oneskorenia
  setTimeout(() => {
    firstVisibleIndex.value = Math.max(0, firstVisibleIndex.value - PAGE_SIZE)
    done(firstVisibleIndex.value === 0)
  }, 700)
}
</script>