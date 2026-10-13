<template>
  <q-page class="flex flex-center">
    <q-card style="width: 360px" class="q-pa-md">
      <div class="text-h6 q-mb-md">Register</div>

      <q-input v-model="firstName" label="First name" outlined class="q-mb-sm" />
      <q-input v-model="lastName" label="Last name" outlined class="q-mb-sm" />
      <q-input v-model="nickName" label="Nickname" outlined class="q-mb-sm" />
      <q-input v-model="email" label="Email" type="email" outlined class="q-mb-sm" />
      <q-input v-model="password" label="Password" type="password" outlined class="q-mb-md" />

      <q-btn color="primary" label="Register" class="full-width" no-caps @click="register" />
      <q-btn to="/login" label="Back to login" flat class="full-width q-mt-sm" no-caps />
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