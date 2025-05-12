/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import AutoSwagger from 'adonis-autoswagger'
import swagger from '#config/swagger'
import HttpCodes from '#enums/http_codes'

router.get('/', async ({ response }) => {
  response.ok({
    code: HttpCodes.OK,
    message: "Horivise REST API's is Started.",
  })
})

/*
|--------------------------------------------------------------------------
| Swagger Routes
|--------------------------------------------------------------------------
*/

router.get('/swagger', async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger)
})

router
  .group(() => {
    router.get('/', async () => {
      return AutoSwagger.default.ui('/swagger', swagger)
    })
    router.get('/scalar', async () => {
      return AutoSwagger.default.scalar('/swagger')
    })
    router.get('/rapidoc', async () => {
      return AutoSwagger.default.rapidoc('/swagger')
    })
  })
  .prefix('api/v1/docs')

/*
|--------------------------------------------------------------------------
| Rest Api Routes
|--------------------------------------------------------------------------
*/

import '#start/auth/auth.routes'
import '#start/store/user.routes'
import '#start/store/product.routes'
