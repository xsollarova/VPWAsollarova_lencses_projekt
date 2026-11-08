import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invitations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('channel_id').unsigned().notNullable()
        .references('id').inTable('channels').onDelete('CASCADE')
      table.integer('invited_user_id').unsigned().notNullable()
        .references('id').inTable('users').onDelete('CASCADE')
      table.integer('invited_by_id').unsigned().notNullable()
        .references('id').inTable('users').onDelete('CASCADE')
      table.enum('status', ['pending', 'accepted', 'declined']).notNullable().defaultTo('pending')
      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}