import vine from '@vinejs/vine'

const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

export const signupValidator = vine.create({
  firstName: vine.string().trim().maxLength(30),
  lastName: vine.string().trim().maxLength(30),
  nickName: vine
    .string()
    .trim()
    .maxLength(15)
    .unique({ table: 'users', column: 'nick_name' }),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

// identifier => email alebo nickname
export const loginValidator = vine.create({
  identifier: vine.string().trim(),
  password: vine.string(),
})