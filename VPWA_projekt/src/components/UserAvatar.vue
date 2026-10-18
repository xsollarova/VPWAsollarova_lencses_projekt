<template>
  <!-- profilovka pouzivatela + status vo forme bodky pri profilovke -->
  <div class="user-avatar" :style="{ width: size, height: size }">
    <q-avatar :size="size" :style="{ backgroundColor: color }" text-color="grey-9">
      <img v-if="avatarUrl" :src="avatarUrl" alt="Profile picture" />
      <template v-else>{{ initial }}</template>
    </q-avatar>
    <span
      v-if="showStatus"
      class="user-avatar__status"
      :class="`status-badge--${status}`"
      :title="statusLabel"
      :aria-label="statusLabel"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useChatStore, STATUS_LABELS } from '@/stores/chat'

const props = defineProps({
  nickName: { type: String, required: true },
  size: { type: String, default: '36px' },
  showStatus: { type: Boolean, default: true },
})

const chat = useChatStore()

// farby pozadia avatarov
const AVATAR_COLORS = ['#d6d6f0', '#f0dcd2', '#e6e0d6', '#d2ead8', '#d4e4ec', '#ecd6e4']

const initial = computed(() => props.nickName.charAt(0).toUpperCase())
const avatarUrl = computed(() => chat.getUserAvatar(props.nickName))

// farba sa vyberie podla prveho pismena nickname-u
const color = computed(
  () => AVATAR_COLORS[props.nickName.charCodeAt(0) % AVATAR_COLORS.length],
)

const status = computed(() => chat.getUserStatus(props.nickName))
const statusLabel = computed(() => STATUS_LABELS[status.value])
</script>

<style scoped>
.user-avatar {
  position: relative;
  display: inline-block;
  flex-shrink: 0;
}

.user-avatar__status {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 32%;
  height: 32%;
  min-width: 9px;
  min-height: 9px;
  border: 2px solid #fff;
  border-radius: 50%;
}
</style>
