import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
const AuthController = () => import('#controllers/auth_controller')

router
  .group(() => {
    router.get('/', [AuthController, 'authenticated']).use(
      middleware.auth({
        guards: ['api'],
      })
    )
    router.post('/login', [AuthController, 'login'])
    router.post('/register', [AuthController, 'register']).use(
      middleware.auth({
        guards: ['api'],
      })
    )
  })
  .prefix('api/v1/auth')
