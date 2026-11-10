import vine from '@vinejs/vine'

export const sendMessageValidator = vine.create({
  text: vine.string().trim().minLength(1).maxLength(2000),
})

// infinite scroll - nenacita strasie spravy ako spravu s tymto id
export const messageHistoryValidator = vine.create({
  before: vine.number().positive().optional(),
})