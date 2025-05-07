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

router.get('/api/v1/docs/swagger', async () => {
  return AutoSwagger.default.ui('/swagger', swagger)
})
router.get('/api/v1/docs/scalar', async () => {
  return AutoSwagger.default.scalar('/swagger')
})
router.get('/api/v1/docs/rapidoc', async () => {
  return AutoSwagger.default.rapidoc('/swagger')
})

/*
|--------------------------------------------------------------------------
| Rest Api Routes
|--------------------------------------------------------------------------
*/

import '#start/auth/auth.routes'
import '#start/store/user.routes'
