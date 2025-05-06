import { BaseModel } from '@adonisjs/lucid/orm'

export default class BaseController {
  declare MODEL: typeof BaseModel

  async toJSON(payload: any) {
    if (typeof payload === 'string') {
      return JSON.parse(payload)
    }
    return JSON.parse(JSON.stringify(payload))
  }
}
