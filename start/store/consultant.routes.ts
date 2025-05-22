import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
const Controller = () => import('#controllers/consultants_controller')

router
  .group(() => {
    router.get('/', [Controller, 'list'])
    router.post('/', [Controller, 'create'])
    router.get('/onboarding', [Controller, 'getOnboardingLink'])
    router.get('/:account-id', [Controller, 'show'])
    router.delete('/:account-id', [Controller, 'delete'])
  })
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )
  .prefix('api/v1/consultants')
