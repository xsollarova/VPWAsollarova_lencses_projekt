import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('channel_id').unsigned().notNullable()
        .references('id').inTable('channels').onDelete('CASCADE')
      table.integer('sender_id').unsigned().notNullable()
        .references('id').inTable('users').onDelete('CASCADE')
      table.text('text').notNullable()
      table.timestamp('created_at').notNullable()

      table.index(['channel_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}