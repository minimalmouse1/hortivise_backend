import { HttpContext } from '@adonisjs/core/http'

import User from '#models/user'
import HttpCodes from '#enums/http_codes'
import HttpResponse from '#enums/response_messages'
import BaseController from '#controllers/bases_controller'

export default class UsersController extends BaseController {
  async allUser({ response }: HttpContext) {
    try {
      const users = await User.all()
      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: users,
      })
    } catch (error) {
      return response.internalServerError({
        code: HttpCodes.INTERNAL_SERVER_ERROR,
        message: error.toString(),
      })
    }
  }

  async userById({ request, response }: HttpContext) {
    try {
      const userId = request.param('id')
      const user = await User.find(userId)

      if (!user) {
        return response.notFound({
          code: HttpCodes.NOT_FOUND,
          message: HttpResponse.NOT_FOUND,
        })
      }
      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: user,
      })
    } catch (error) {
      return response.internalServerError({
        code: HttpCodes.INTERNAL_SERVER_ERROR,
        message: error.toString(),
      })
    }
  }

  /**
   * @update
   * @requestBody <User>
   */

  async update({ request, response }: HttpContext) {
    try {
      const userId = request.param('id')
      const { email, password } = request.only(['email', 'password'])

      const user = await User.findBy('id', request.param('id'))
      if (!user) {
        return response.notFound({
          code: HttpCodes.NOT_FOUND,
          message: HttpResponse.NOT_FOUND,
        })
      }

      if (email !== user.email) {
        const emailExists = await User.query()
          .from('users')
          .where('email', email)
          .whereNot('id', userId)
          .first()

        if (emailExists) {
          return response.badRequest({
            code: HttpCodes.BAD_REQUEST,
            message: 'Email already exists',
          })
        }
      }

      // Update user attributes
      user.email = email
      user.password = password

      // Save the updated user
      await user.save()

      await user.save()

      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: user,
      })
    } catch (error) {
      return response.internalServerError({
        code: HttpCodes.INTERNAL_SERVER_ERROR,
        message: error.toString(),
      })
    }
  }

  async delete({ request, response }: HttpContext) {
    try {
      const user = await User.findBy('id', request.param('id'))
      if (!user) {
        return response.notFound({
          code: HttpCodes.NOT_FOUND,
          message: HttpResponse.NOT_FOUND,
        })
      }
      await user.delete()

      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: user,
      })
    } catch (error) {
      return response.internalServerError({
        code: HttpCodes.INTERNAL_SERVER_ERROR,
        message: error.toString(),
      })
    }
  }
}
