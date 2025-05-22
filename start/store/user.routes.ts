import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
const Controller = () => import('#controllers/users_controller')

router
  .group(() => {
    router.get('/', [Controller, 'all'])
    router.get('/:id', [Controller, 'single'])
    router.put('/:id', [Controller, 'update'])
    router.delete('/:id', [Controller, 'delete'])
  })
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )
  .prefix('api/v1/users')
