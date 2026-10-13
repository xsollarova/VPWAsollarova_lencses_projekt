<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Chat app </q-toolbar-title>

        <q-btn flat dense round icon="logout" aria-label="Logout" to="/login" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Channels </q-item-label>

        <q-item
          v-for="channel in chat.sortedChannels"
          :key="channel.id"
          clickable
          v-ripple
          :active="channel.id === chat.activeChannelId"
          active-class="bg-blue-1 text-primary"
          :class="{ 'bg-yellow-2': channel.invited }" 
          @click="chat.selectChannel(channel.id)"
        >
          <q-item-section avatar>
            <q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" />
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ channel.name }}</q-item-label>
          </q-item-section>

          <q-item-section v-if="channel.invited" side>
            <q-badge color="orange" label="invite" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useChatStore } from '@/stores/chat'

const chat = useChatStore()
const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>