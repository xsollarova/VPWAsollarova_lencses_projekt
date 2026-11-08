<template>
  <q-page class="flex flex-center">
    <q-card style="width: 360px" class="q-pa-md">
      <div class="text-h6 q-mb-md">Login</div>

      <q-form @submit.prevent="login">
      <q-banner v-if="loginError" dense class="bg-red text-white q-mb-sm">
        {{ loginError }}
      </q-banner>
      <q-input
        v-model="identifier"
        label="Email or nickname"
        type="text"
        autocomplete="username"
        outlined
        class="q-mb-sm"
        :rules="[(value) => !!value?.trim() || 'Email or nickname is required']"
      />
      <q-input
        v-model="password"
        label="Password"
        :type="passwordVisible ? 'text' : 'password'"
        autocomplete="current-password"
        outlined
        class="q-mb-md"
        :rules="[
          (value) => !!value || 'Password is required',
          (value) => value.length >= 8 || 'Password must have at least 8 characters',
          (value) => value.length <= 32 || 'Password can have at most 32 characters',
        ]"
      >
        <template #append>
          <q-btn
            flat
            dense
            round
            :icon="passwordVisible ? 'visibility_off' : 'visibility'"
            :aria-label="passwordVisible ? 'Hide password' : 'Show password'"
            @click="passwordVisible = !passwordVisible"
          />
        </template>
      </q-input>

      <q-btn type="submit" color="primary" label="Log in" class="full-width" no-caps :loading="loading" />
      <q-btn to="/register" label="Create account" flat class="full-width q-mt-sm" no-caps />
    </q-form>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'

const router = useRouter()
const chat = useChatStore()
const identifier = ref('')
const password = ref('')
const passwordVisible = ref(false)
const loginError = ref('')
const loading = ref(false)

async function login() {
  loginError.value = ''
  loading.value = true
  const error = await chat.login(identifier.value.trim(), password.value)
  loading.value = false
  if (error) {
    loginError.value = error
    return
  }
  router.push('/chat')
}
</script>