import type { HttpContext } from '@adonisjs/core/http'

import User from '#models/user'
import HttpCodes from '#enums/http_codes'
import HttpResponse from '#enums/response_messages'
import BaseController from '#controllers/bases_controller'

export default class AuthController extends BaseController {
  /**
   * @register
   * @requestBody {"email":"maintainer@hortivise.com", "password":"123456" }
   */

  async register({ request, response }: HttpContext) {
    try {
      const { email, password } = request.only(['email', 'password'])
      const existingUser = await User.findBy('email', email)
      if (existingUser) {
        return response.conflict({
          code: HttpCodes.CONFLICT,
          message: HttpResponse.CONFLICT,
        })
      }

      const user = new User()
      user.email = email
      user.password = password
      await user.save()

      delete user.$attributes.password

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
   * @login
   * @requestBody {"email": "admin@hortivise.com","password":"123456"}
   */

  async login({ request, response }: HttpContext) {
    try {
      const { email, password } = request.only(['email', 'password'])
      const user = await User.verifyCredentials(email, password)

      const token = await User.accessTokens.create(user, ['*'], {
        expiresIn: '2 days',
        name: 'api_access_token',
      })
      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: token,
      })
    } catch (error) {
      return response.internalServerError({
        code: HttpCodes.INTERNAL_SERVER_ERROR,
        message: error.toString(),
      })
    }
  }

  async logout({ auth, response }: HttpContext) {
    const currentUser = auth.use('api').user!
    await User.accessTokens.delete(currentUser, currentUser.currentAccessToken.identifier)

    return response.ok({
      code: HttpCodes.OK,
      message: HttpResponse.OK,
    })
  }

  async authenticated({ auth, response }: HttpContext) {
    const authenticatedUser = auth.use('api').user!
    if (!authenticatedUser) {
      return response.unauthorized({
        code: HttpCodes.UNAUTHORIZED,
        message: HttpResponse.UNAUTHORIZED,
      })
    }
    delete authenticatedUser.$attributes.password
    return response.ok({
      code: HttpCodes.OK,
      message: HttpResponse.OK,
      result: authenticatedUser,
    })
  }
}
