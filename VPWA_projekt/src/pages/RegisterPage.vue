<template>
  <q-page class="flex flex-center">
    <q-card style="width: 360px" class="q-pa-md">
      <div class="text-h6 q-mb-md">Register</div>
      <q-form @submit.prevent="register">
      <q-input v-model="firstName" label="First name" outlined class="q-mb-sm" :rules="[
            val => !!val.trim() || 'First name is required',
            val => val.trim().length <= 30
              || 'Maximum 30 characters'
          ]"/>
      <q-input v-model="lastName" label="Last name" outlined class="q-mb-sm" :rules="[
            val => !!val.trim() || 'Last name is required',
            val => val.trim().length <= 30
              || 'Maximum 30 characters'
          ]"/>
      <q-input v-model="nickName" label="Nickname" outlined class="q-mb-sm" :rules="[
            val => !!val.trim() || 'Nickname is required',
            val => val.trim().length >= 3
              || 'Nickname must have at least 3 characters',
            val => val.trim().length <= 15
              || 'Maximum 15 characters'
          ]"/>
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
              || 'Password can have at most 128 characters',
            val => /\d/.test(val) || 'Password must contain at least one digit'
          ]"/>

      <q-btn color="primary" label="Register" class="full-width" no-caps/>
      <q-btn to="/login" label="Back to login" flat class="full-width q-mt-sm" no-caps />
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const firstName = ref('')
const lastName = ref('')
const nickName = ref('')
const email = ref('')
const password = ref('')

function register() {
  // presmerovanie chatu
  router.push('/chat')
}
</script>