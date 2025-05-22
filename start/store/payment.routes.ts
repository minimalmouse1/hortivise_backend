import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
const Controller = () => import('#controllers/payments_controller')

router
  .group(() => {
    router.post('/charge', [Controller, 'charge'])
    router.get('/verify', [Controller, 'verify'])
    router.post('/payment/refund', [Controller, 'refund'])
    router.post('/payment/partial-refund', [Controller, 'partialRefund'])
  })
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )
  .prefix('api/v1/payment')
