<template>
  <q-page class="flex flex-center">
    <q-card style="width: 360px" class="q-pa-md">
      <div class="text-h6 q-mb-md">Login</div>

      <q-form @submit.prevent="login">
      <q-banner v-if="loginError" dense class="bg-red text-white q-mb-sm">
        {{ loginError }}
      </q-banner>
      <q-input v-model="email" label="Email" type="email" outlined class="q-mb-sm" :rules="[
            val => !!val || 'Email is required',
            val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
              || 'Enter a valid email'
          ]"/>
      <q-input v-model="password" label="Password" type="password" outlined class="q-mb-md" :rules="[
            val => !!val || 'Password is required',
            val => val.length >= 8
              || 'Password must have at least 8 characters',
            val => val.length <= 128
              || 'Password can have at most 128 characters'
          ]"/>

      <q-btn type="submit" color="primary" label="Log in" class="full-width" no-caps />
      <q-btn to="/register" label="Create account" flat class="full-width q-mt-sm" no-caps />
      <div class="text-caption text-grey-7 q-mt-md">
        Test account: david@test.sk / David1234
      </div>
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
const email = ref('')
const password = ref('')
const loginError = ref('')

function login() {
  if (!chat.authenticate(email.value, password.value)) {
    loginError.value = 'Invalid email or password'
    return
  }
  router.push('/chat')
}
</script>