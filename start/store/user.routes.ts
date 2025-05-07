import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
const UsersController = () => import('#controllers/users_controller')

router
  .group(() => {
    router.put('/:id', [UsersController, 'update'])
    router.get('/', [UsersController, 'allUser'])
    router.get('/:id', [UsersController, 'userById'])
    router.delete('/:id', [UsersController, 'delete'])
  })
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )
  .prefix('api/v1/users')
