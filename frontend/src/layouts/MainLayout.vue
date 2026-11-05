<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> ConnecChat </q-toolbar-title>

        <!-- profilovka + status -->
        <q-btn flat dense round aria-label="Open profile" class="q-mr-xs" @click="openProfileDialog">
          <UserAvatar :nick-name="chat.currentUser.nickName" size="30px" />
        </q-btn>

        <q-btn-dropdown
          flat
          dense
          no-caps
          :label="currentStatus.label"
          dropdown-icon="expand_more"
        >
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
              <q-separator />
              <q-item>
                <q-item-section>xDND</q-item-section>
                <q-item-section side>
                  <q-toggle
                    v-model="chat.currentUser.notifyOnlyDirectMessages"
                    aria-label="xDND"
                    @click.stop
                  />
                </q-item-section>
              </q-item>
          </q-list>
        </q-btn-dropdown>

        <q-btn flat dense round icon="logout" aria-label="Logout" to="/login" />
      </q-toolbar>
    </q-header>

    <q-dialog v-model="profileDialogOpen">
      <q-card style="width: 420px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">Profile</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <div class="row items-center q-gutter-md">
            <UserAvatar :nick-name="chat.currentUser.nickName" size="64px" :show-status="false" />
            <q-file
              v-model="profileAvatarFile"
              outlined
              dense
              accept="image/*"
              label="Profile picture"
            />
          </div>
          <q-input
            v-model="profileFirstName"
            outlined
            label="First name"
          />
          <q-input v-model="profileLastName" outlined label="Last name" />
          <q-input v-model="profileNickName" outlined label="Nickname" />
          <q-input
            v-model="profileEmail"
            outlined
            type="email"
            label="Email"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
          <q-btn color="primary" label="Save changes" @click="profileDialogOpen = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
                    v-close-popup
                    clickable
                    @click.stop="openDeleteChannelDialog(channel)"
                  >
                    <q-item-section>Delete channel</q-item-section>
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

    <q-dialog v-model="deleteChannelDialogOpen">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Delete channel</div>
          <div class="q-mt-sm">
            Are you sure you want to delete
            <strong>#{{ channelToDelete?.name }}</strong>? This will permanently remove its
            messages.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="negative" label="Delete" @click="confirmDeleteChannel" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-drawer v-model="chat.listOpen" side="right" bordered>
      <q-toolbar>
        <q-toolbar-title>List of users</q-toolbar-title>
        <q-btn flat dense round icon="close" aria-label="Close list" @click="chat.listOpen = false" />
      </q-toolbar>
      <q-list>
        <q-item-label header>Members of {{ chat.activeChannel?.name }}</q-item-label>
        <q-item v-for="member in sortedMembers" :key="member">
          <q-item-section avatar>
            <UserAvatar :nick-name="member" size="36px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ member }}</q-item-label>
            <q-item-label caption>{{ STATUS_LABELS[chat.getUserStatus(member)] }}</q-item-label>
          </q-item-section>
          <q-item-section v-if="isAdmin(member)" side>
            <q-badge color="grey-7" label="admin" />
          </q-item-section>
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
import { useChatStore, STATUS_LABELS } from '@/stores/chat'
import CommandInput from '@/components/CommandInput.vue'
import UserAvatar from '@/components/UserAvatar.vue'

const chat = useChatStore()
const leftDrawerOpen = ref(false)
const profileDialogOpen = ref(false)
const profileFirstName = ref('')
const profileLastName = ref('')
const profileNickName = ref('')
const profileEmail = ref('')
const profileAvatarFile = ref(null)
const createChannelDialogOpen = ref(false)
const deleteChannelDialogOpen = ref(false)
const channelToDelete = ref(null)
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

// pri zozname memberov zobrazi v poradi: online => DND => offline
const STATUS_ORDER = { online: 0, dnd: 1, offline: 2 }
const sortedMembers = computed(() =>
  [...(chat.activeChannel?.members ?? [])].sort(
    (a, b) =>
      STATUS_ORDER[chat.getUserStatus(a)] - STATUS_ORDER[chat.getUserStatus(b)] ||
      a.localeCompare(b),
  ),
)

function isAdmin(member) {
  return chat.activeChannel?.adminId === chat.getUserId(member)
}

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function setStatus(status) {
  chat.setStatus(status)
}

function openProfileDialog() {
  profileFirstName.value = chat.currentUser.firstName
  profileLastName.value = chat.currentUser.lastName
  profileNickName.value = chat.currentUser.nickName
  profileEmail.value = chat.currentUser.email
  profileAvatarFile.value = null
  profileDialogOpen.value = true
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

function openDeleteChannelDialog(channel) {
  channelToDelete.value = channel
  deleteChannelDialogOpen.value = true
}

function confirmDeleteChannel() {
  if (!channelToDelete.value) return
  chat.deleteChannel(channelToDelete.value.id)
  deleteChannelDialogOpen.value = false
  channelToDelete.value = null
}

function joinChannel() {
  const result = chat.joinPublicChannel(joinChannelName.value)

  if (result === 'joined' || result === 'already-member') {
    createChannelDialogOpen.value = false
    return
  }

  joinChannelMessage.value =
    {
      private: 'You cannot join a private channel this way.',
      banned: 'You are permanently banned from this channel.',
      'not-found': 'No public channel with this name was found.',
    }[result]
}
</script>