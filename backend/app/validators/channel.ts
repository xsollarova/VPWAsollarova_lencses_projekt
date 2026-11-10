import vine from '@vinejs/vine'

// nazov kanala: 1-50 znakov, bez medzier 
const channelName = () =>
  vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(50)
    .regex(/^[a-zA-Z0-9_-]+$/)

// validator create
export const createChannelValidator = vine.create({
  name: channelName(),
  type: vine.enum(['public', 'private']),
})
// validator join
export const joinChannelValidator = vine.create({
  name: channelName(),
  type: vine.enum(['public', 'private']).optional(),
})
// validator invite
export const inviteValidator = vine.create({
  nickName: vine.string().trim(),
})