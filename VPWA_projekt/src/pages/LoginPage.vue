<template>
  <q-page class="flex flex-center">
    <q-card style="width: 360px" class="q-pa-md">
      <div class="text-h6 q-mb-md">Login</div>

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

      <q-btn color="primary" label="Log in" class="full-width" no-caps @click="login" />
      <q-btn to="/register" label="Create account" flat class="full-width q-mt-sm" no-caps />
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')

function login() {
  // presmerovanie na chat
  router.push('/chat')
}
</script>