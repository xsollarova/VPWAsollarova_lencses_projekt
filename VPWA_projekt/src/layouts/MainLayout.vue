<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> ConnecChat </q-toolbar-title>

        <q-btn flat dense round icon="account_circle" aria-label="User" />

        <q-icon
          :class="['q-mr-xs', `status-dot--${currentStatus.value}`]"
          name="circle"
          size="10px"
          aria-hidden="true"
        />
        
        <q-btn-dropdown flat dense no-caps label="Status" dropdown-icon="expand_more">
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
        <div class="row items-center justify-between q-px-md q-pt-md q-pb-sm">
          <div class="text-subtitle2">Channels</div>
          <q-btn
            flat
            dense
            round
            icon="add"
            aria-label="Create channel"
            @click="openCreateChannelDialog"
          />
        </div>

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
          <q-item-section side>
            <q-btn
              flat
              dense
              round
              icon="more_vert"
              aria-label="Channel options"
              @click.stop
            >
              <q-menu>
                <q-list dense>
                  <q-item
                    v-close-popup
                    clickable
                    @click.stop="chat.leaveChannel(channel.id)"
                  >
                    <q-item-section>
                      {{ channel.invited ? 'Decline invitation' : 'Leave channel' }}
                    </q-item-section>
                  </q-item>
                  <q-item
                    v-if="channel.adminId === chat.currentUser.id"
                    clickable
                    @click.stop
                  >
                    <q-item-section>Remove member</q-item-section>
                    <q-item-section side>
                      <q-icon name="chevron_right" />
                    </q-item-section>
                    <q-menu anchor="top end" self="top start">
                      <q-list dense>
                        <q-item
                          v-for="member in channel.members.filter(
                            (name) => name !== chat.currentUser.nickName,
                          )"
                          :key="member"
                          v-close-popup
                          clickable
                          @click.stop="chat.removeChannelMember(channel.id, member)"
                        >
                          <q-item-section>{{ member }}</q-item-section>
                        </q-item>
                        <q-item
                          v-if="
                            channel.members.every(
                              (name) => name === chat.currentUser.nickName,
                            )
                          "
                          disable
                        >
                          <q-item-section>No other members</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-dialog v-model="createChannelDialogOpen">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Create channel</div>
        </q-card-section>

        <q-form @submit.prevent="createChannel">
          <q-card-section class="q-gutter-md">
            <q-input
              v-model="newChannelName"
              autofocus
              outlined
              label="Channel name"
              :rules="[(value) => !!value.trim() || 'Enter a channel name']"
            />
            <q-option-group
              v-model="newChannelType"
              :options="channelTypeOptions"
              type="radio"
              inline
            />
            <q-card-actions align="right">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn color="primary" label="Create" type="submit" />
            </q-card-actions>
          </q-card-section>
        </q-form>

        <q-separator />

        <q-form @submit.prevent="joinChannel">
          <q-card-section>
            <div class="text-subtitle1">Join a channel</div>
            <div class="text-caption text-grey-7">You can only join public channels.</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-input
              v-model="joinChannelName"
              outlined
              label="Channel name"
              :rules="[(value) => !!value.trim() || 'Enter a channel name']"
            />
            <q-banner
              v-if="joinChannelMessage"
              dense
              rounded
              class="q-mt-sm bg-red-1"
            >
              {{ joinChannelMessage }}
            </q-banner>
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn flat label="Cancel" v-close-popup />
            <q-btn color="primary" label="Join" type="submit" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-drawer v-model="chat.listOpen" side="right" bordered>
      <q-toolbar>
        <q-toolbar-title>List of users</q-toolbar-title>
        <q-btn flat dense round icon="close" aria-label="Close list" @click="chat.listOpen = false" />
      </q-toolbar>
      <q-list>
        <q-item-label header>Members of {{ chat.activeChannel?.name }}</q-item-label>
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
const createChannelDialogOpen = ref(false)
const newChannelName = ref('')
const newChannelType = ref('public')
const joinChannelName = ref('')
const joinChannelMessage = ref('')
const channelTypeOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
]
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

function openCreateChannelDialog() {
  newChannelName.value = ''
  newChannelType.value = 'public'
  joinChannelName.value = ''
  joinChannelMessage.value = ''
  createChannelDialogOpen.value = true
}

function createChannel() {
  chat.createChannel(newChannelName.value, newChannelType.value)
  createChannelDialogOpen.value = false
}

function joinChannel() {
  const result = chat.joinPublicChannel(joinChannelName.value)

  if (result === 'joined' || result === 'already-member') {
    createChannelDialogOpen.value = false
    return
  }

  joinChannelMessage.value =
    result === 'private'
      ? 'You cannot join a private channel this way.'
      : 'No public channel with this name was found.'
}
</script>