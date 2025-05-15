// start/controllers/PaymentsController.ts
import HttpCodes from '#enums/http_codes'
import HttpResponse from '#enums/response_messages'
import type { HttpContext } from '@adonisjs/core/http'
import stripe from '@vbusatta/adonis-stripe/services/main'
import { CustomerService } from '#services/customer_service'
import { charge } from '#validators/payment'
import logger from '@adonisjs/core/services/logger'

export default class PaymentsController {
  private service = new CustomerService()

  /**
   * @charge
   * @summary Charge customer
   * @description Charge the customer based on the provided price ID using one-time payment mode.
   * @requestBody <charge>
   * @responseBody 200 - {"code": 200, "message": "Request successful", "result": "<productResponse>"}
   * @responseBody 400 - {"code": 400, "message": "Recurring price cannot be charged with mode: payment. Use a one-time price."} - Validation error
   * @responseBody 500 - {"code": 500, "message": "Internal server error"} - Stripe error
   */
  async charge({ request, response }: HttpContext) {
    const data = request.all()
    const { priceId, customerEmail } = await charge.validate(data)

    try {
      const price = await stripe.api.prices.retrieve(priceId)
      if (price.recurring) {
        return response.badRequest({
          code: HttpCodes.BAD_REQUEST,
          message: 'Recurring price cannot be charged with mode: payment. Use a one-time price.',
        })
      }

      const existingCustomers = await this.service.Search({
        field: 'email',
        value: customerEmail,
      })

      let customerId: string
      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id
      } else {
        const newCustomer = await this.service.Create({
          params: { email: customerEmail },
        })
        customerId = newCustomer.id
      }

      const session = await stripe.api.checkout.sessions.create({
        customer: customerId,
        success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:3000/cancel',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        metadata: {
          customerEmail,
          priceId,
        },
      })

      logger.info(`checkoutSession ==> ${JSON.stringify(session, null, 2)}`)

      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: session.url,
      })
    } catch (err) {
      logger.error(`response ==> ${JSON.stringify(err, null, 2)}`)
      return response.internalServerError({
        code: HttpCodes.INTERNAL_SERVER_ERROR,
        message: HttpResponse.INTERNAL_SERVER_ERROR,
      })
    }
  }

  /**
   * @verify
   * @summary Verify checkout session after success
   * @description Retrieve session details and confirm payment status
   * @paramPath session_id - The session_id of the payment - @type(string)
   * @responseBody 200 - { code, message, result: sessionObject }
   * @responseBody 400/500 - { code, message }
   */

  async verify({ request, response }: HttpContext) {
    const sessionId = request.qs().session_id

    if (!sessionId) {
      return response.badRequest({
        code: HttpCodes.BAD_REQUEST,
        message: 'Missing session_id',
      })
    }

    try {
      const session = await stripe.api.checkout.sessions.retrieve(sessionId)

      if (session.payment_status === 'paid') {
        return response.ok({
          code: HttpCodes.OK,
          message: 'Payment confirmed',
          result: session,
        })
      } else {
        return response.badRequest({
          code: HttpCodes.BAD_REQUEST,
          message: 'Payment incomplete or failed',
          result: session,
        })
      }
    } catch (err) {
      logger.error(`verify error ==> ${JSON.stringify(err, null, 2)}`)
      return response.internalServerError({
        code: HttpCodes.INTERNAL_SERVER_ERROR,
        message: HttpResponse.INTERNAL_SERVER_ERROR,
      })
    }
  }
}
