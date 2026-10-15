<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> ConnecChat </q-toolbar-title>

        <q-btn flat dense round icon="account_circle" aria-label="Používateľ" />

        <q-icon
          :class="['q-mr-xs', `status-dot--${currentStatus.value}`]"
          name="circle"
          size="10px"
          aria-hidden="true"
        />
        
        <q-btn-dropdown flat dense no-caps label="Stav" dropdown-icon="expand_more">
          <q-list>
            <q-item
              v-for="status in statuses"
              :key="status.value"
              clickable
              v-close-popup
              :active="chat.currentUser.status === status.value"
              @click="setStatus(status.value)"
            >
              <q-item-section avatar>
                <q-icon
                  name="circle"
                  :class="`status-dot--${status.value}`"
                  size="10px"
                  aria-hidden="true"
                />
              </q-item-section>
              <q-item-section>{{ status.label }}</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>

        <q-btn flat dense round icon="logout" aria-label="Logout" to="/login" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="channel-drawer">
      <q-list>
        <q-item-label header> Channels </q-item-label>

        <q-item
          v-for="channel in chat.sortedChannels"
          :key="channel.id"
          clickable
          v-ripple
          :active="channel.id === chat.activeChannelId"
          active-class="bg-green-our text-secondary "
          :class="{ 'bg-dark-green-our': channel.invited }" 
          @click="chat.selectChannel(channel.id)"
        >
          <q-item-section avatar>
            <q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" />
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ channel.name }}</q-item-label>
          </q-item-section>

          <q-item-section v-if="channel.invited" side>
            <q-badge color="dark" label="invite" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-drawer v-model="chat.listOpen" side="right" bordered>
      <q-toolbar>
        <q-toolbar-title>List</q-toolbar-title>
        <q-btn flat dense round icon="close" aria-label="Close list" @click="chat.listOpen = false" />
      </q-toolbar>
      <q-list>
        <q-item-label header>Členovia kanála {{ chat.activeChannel?.name }}</q-item-label>
        <q-item v-for="member in chat.activeChannel?.members ?? []" :key="member">
          <q-item-section avatar>
            <q-icon name="person" />
          </q-item-section>
          <q-item-section>{{ member }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-footer class="bg-grey-2 q-pa-sm">
      <CommandInput />
    </q-footer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useChatStore } from '@/stores/chat'
import CommandInput from '@/components/CommandInput.vue'

const chat = useChatStore()
const leftDrawerOpen = ref(false)
const statuses = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'dnd', label: 'DND' },
]
const currentStatus = computed(
  () => statuses.find((status) => status.value === chat.currentUser.status) ?? statuses[0],
)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function setStatus(status) {
  chat.currentUser.status = status
}
</script>