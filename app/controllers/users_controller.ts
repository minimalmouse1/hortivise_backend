import { HttpContext } from '@adonisjs/core/http'

import User from '#models/user'
import HttpCodes from '#enums/http_codes'
import HttpResponse from '#enums/response_messages'
import BaseController from '#controllers/bases_controller'

export default class UsersController extends BaseController {
  /**
   * @all
   * @summary Get all users
   * @description Retrieves a list of all users in the system.
   * @responseBody 200 - {"code": 200, "message": "Request successful", "result": "<User[]>"}
   * @responseBody 500 - {"code": 500, "message": "Internal server error"} - Internal server error
   */

  async all({ response }: HttpContext) {
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

  /**
   * @single
   * @summary Get a single user
   * @description Retrieves a user by ID.
   * @operationId getUserById
   * @paramPath id - The ID of the user to retrieve - @type(number) @required
   * @responseBody 200 - {"code": 200, "message": "Request successful", "result": "<User>"}
   * @responseBody 404 - {"code": 404, "message": "Resource not found"} - User not found
   * @responseBody 500 - {"code": 500, "message": "Internal server error"} - Internal server error
   */

  async single({ request, response }: HttpContext) {
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
   * @summary Update a user's details
   * @description Updates a user's email and password.
   * @paramPath id - The ID of the user to update - @type(number) @required
   * @requestBody <User>.exclude(id, created_at, updated_at).append("password":"string")
   * @responseBody 200 - {"code": 200, "message": "Request successful", "result": "<User>"}
   * @responseBody 400 - {"code": 400, "message": "Email already exists"} - Email duplication error
   * @responseBody 404 - {"code": 404, "message": "Resource not found"} - User not found
   * @responseBody 500 - {"code": 500, "message": "Internal server error"} - Internal server error
   */

  async update({ request, response }: HttpContext) {
    try {
      const userId = request.param('id')
      const { email, password } = request.only(['email', 'password'])

      const user = await User.findBy('id', userId)
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

      user.email = email
      user.password = password
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

  /**
   * @delete
   * @summary Delete a user
   * @description Deletes a user by their ID.
   * @paramPath id - The ID of the user to delete - @type(number) @required
   * @responseBody 200 - {"code": 200, "message": "Resource deleted successfully", "result": "<User>"}
   * @responseBody 404 - {"code": 404, "message": "Resource not found"} - User not found
   * @responseBody 500 - {"code": 500, "message": "Internal server error"} - Internal server error
   */

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
