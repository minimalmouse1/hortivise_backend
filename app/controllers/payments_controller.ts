import type Stripe from 'stripe'
import HttpCodes from '#enums/http_codes'
import HttpResponse from '#enums/response_messages'
import type { HttpContext } from '@adonisjs/core/http'
import stripe from '@vbusatta/adonis-stripe/services/main'
import { CustomerService } from '#services/customer_service'
import {
  charge,
  chargeResponse,
  partialRefund,
  refund,
  refundResponse,
  release,
  releaseResponse,
  verifyResponse,
} from '#validators/payment'
import logger from '@adonisjs/core/services/logger'

export default class PaymentsController {
  private service = new CustomerService()
  private stripe = stripe.api

  /**
   * @charge
   * @summary Charge customer
   * @description Charge the customer based on the provided price ID using one-time payment mode.
   * @requestBody <charge>
   * @responseBody 200 - {"code": 200, "message": "Request successful", "result": "<chargeResponse>"}
   * @responseBody 400 - {"code": 400, "message": "Recurring price cannot be charged with mode: payment. Use a one-time price."} - Validation error
   * @responseBody 500 - {"code": 500, "message": "Internal server error"} - Stripe error
   */

  async charge({ request, response }: HttpContext) {
    const data = request.all()
    const payload = await charge.validate(data)

    try {
      const price = await this.stripe.prices.retrieve(payload.priceId)
      if (price.recurring) {
        return response.badRequest({
          code: HttpCodes.BAD_REQUEST,
          message: 'Recurring price cannot be charged with mode: payment. Use a one-time price.',
        })
      }

      const existingCustomers = await this.service.Search({
        field: 'email',
        value: payload.customerEmail,
      })

      let customerId: string
      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id
      } else {
        const newCustomer = await this.service.Create({
          params: { email: payload.customerEmail },
        })
        customerId = newCustomer.id
      }

      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        success_url: payload?.success_url
          ? `${payload.success_url}?session_id={CHECKOUT_SESSION_ID}`
          : 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: payload?.cancel_url || 'http://localhost:3000/cancel',
        line_items: [
          {
            price: payload.priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',

        metadata: {
          customer_email: payload.customerEmail,
          price_id: payload.priceId,
        },
      })

      const validated = await chargeResponse.validate({ id: session.id, session_url: session.url })

      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: validated,
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
   * @paramQuery session_id - The session_id of the payment - @type(string)
   * @responseBody 200 - { "code": 200, "message": "Request successful", result: "<verifyResponse>" }
   * @responseBody 400 - { "code": 400, "message": "Missing session_id" }
   * @responseBody 400 - { "code": 400, "message": "Payment incomplete or failed", result: "<verifyResponse>" }
   * @responseBody 500 - {"code": 500, "message": "Internal server error"} - Stripe error
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
      const session = await this.stripe.checkout.sessions.retrieve(sessionId)

      if (session.payment_status === 'paid') {
        const validated = await verifyResponse.validate({
          id: session.id,
          currency: session.currency,
          created: session.created,
          email: session.customer_details?.email,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          payment_status: session.payment_status,
          payment_intent: session.payment_intent,
        })
        return response.ok({
          code: HttpCodes.OK,
          message: HttpResponse.OK,
          result: validated,
        })
      } else {
        return response.badRequest({
          code: HttpCodes.BAD_REQUEST,
          message: 'Payment incomplete or failed',
          result: {
            id: session.id,
            currency: session.currency,
            created: session.created,
            email: session.customer_details?.email,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            payment_status: session.payment_status,
          },
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

  /**
   * @refund
   * @summary Full refund
   * @description Refund a full payment by paymentIntent ID
   * @requestBody <refund>
   * @responseBody 200 - { "code": 200, "message": "Request successful", result: "<refundResponse>" }
   * @responseBody 500 - {"code": 500, "message": "Internal server error"} - Stripe error
   */

  async refund({ request, response }: HttpContext) {
    const data = request.all()
    const payload = await refund.validate(data)

    try {
      const stripeRefunds = await this.stripe.refunds.create({
        payment_intent: payload.payment_intent,
      })

      const validated = await refundResponse.validate({
        id: stripeRefunds.id,
        status: stripeRefunds.status,
        amount: stripeRefunds.amount / 100,
        created: stripeRefunds.created,
        currency: stripeRefunds.currency,
        charge: stripeRefunds.charge,
        payment_intent: stripeRefunds.payment_intent,
        balance_transaction: stripeRefunds.balance_transaction,
      })

      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: validated,
      })
    } catch (err) {
      logger.error(`refund error ==> ${JSON.stringify(err, null, 2)}`)
      const stripeError = err.raw || err
      const message =
        stripeError?.code === 'charge_already_refunded'
          ? 'This charge has already been refunded.'
          : HttpResponse.INTERNAL_SERVER_ERROR

      return response.status(stripeError.statusCode || 500).send({
        code: stripeError.statusCode || HttpCodes.INTERNAL_SERVER_ERROR,
        message,
        error: stripeError.message,
      })
    }
  }

  /**
   * @partialRefund
   * @summary Partial refund
   * @description Refund 10% of a payment by paymentIntent ID
   * @requestBody <partialRefund>
   * @responseBody 200 - { "code": 200, "message": "Request successful", result: "<refundResponse>" }
   * @responseBody 400 - { "code": 400, "message": "No payment received to refund" }
   */

  async partialRefund({ request, response }: HttpContext) {
    const data = request.all()
    const payload = await partialRefund.validate(data)

    try {
      const intent = await this.stripe.paymentIntents.retrieve(payload.payment_intent)

      if (!intent.amount_received) {
        return response.badRequest({
          code: HttpCodes.BAD_REQUEST,
          message: 'No payment received to refund',
        })
      }

      const refundPercent =
        typeof payload?.percentage === 'number' &&
        payload?.percentage > 0 &&
        payload?.percentage <= 100
          ? payload.percentage
          : 90

      const refundAmount = Math.floor(intent.amount_received * (refundPercent / 100))

      const stripeRefunds = await this.stripe.refunds.create({
        payment_intent: payload.payment_intent,
        amount: refundAmount,
      })

      const validated = await refundResponse.validate({
        id: stripeRefunds.id,
        status: stripeRefunds.status,
        amount: stripeRefunds.amount / 100,
        created: stripeRefunds.created,
        currency: stripeRefunds.currency,
        charge: stripeRefunds.charge,
        payment_intent: stripeRefunds.payment_intent,
        balance_transaction: stripeRefunds.balance_transaction,
      })

      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: validated,
      })
    } catch (err) {
      logger.error(`partialRefund error ==> ${JSON.stringify(err, null, 2)}`)
      const stripeError = err.raw || err
      return response.status(stripeError.statusCode || 500).send({
        code: stripeError.statusCode || HttpCodes.INTERNAL_SERVER_ERROR,
        message: stripeError.message || HttpResponse.INTERNAL_SERVER_ERROR,
      })
    }
  }

  /**
   * @release
   * @summary Release payment to consultant
   * @description Transfers the consultant's share from the original payment to their connected account.
   * @requestBody <release>
   * @responseBody 200 - { code: 200, message: "Request successful", result: "<releaseResponse>" }
   * @responseBody 400 - { code: 400, message: "Bad request" }
   * @responseBody 500 - { code: 500, message: "Internal server error" }
   */

  public async release({ request, response }: HttpContext) {
    const data = request.all()
    const payload = await release.validate(data)

    try {
      const intent = (await this.stripe.paymentIntents.retrieve(
        payload.payment_intent
      )) as Stripe.PaymentIntent

      const chargeId = intent.latest_charge as string

      if (!chargeId) {
        return response.badRequest({
          code: HttpCodes.BAD_REQUEST,
          message: 'No charge associated with this payment intent.',
        })
      }

      const getCharge = await this.stripe.charges.retrieve(chargeId)

      if (!getCharge.paid || getCharge.refunded || getCharge.status !== 'succeeded') {
        return response.badRequest({
          code: HttpCodes.BAD_REQUEST,
          message: 'Charge not completed, refunded, or failed.',
        })
      }

      const amountReceived = getCharge.amount
      const platformFeePercent = payload?.platform_fee_percent ?? 10
      const platformFeeAmount = Math.floor(amountReceived * (platformFeePercent / 100))
      const transferAmount = amountReceived - platformFeeAmount

      const balance = await this.stripe.balance.retrieve()
      const availableUsd = balance.available.find((b) => b.currency === 'usd')?.amount ?? 0

      if (availableUsd < transferAmount) {
        logger.warn(`Platform balance too low. Fund using test card 4000000000000077.`)
        return response.badRequest({
          code: HttpCodes.BAD_REQUEST,
          message:
            'Platform balance too low. Please simulate a charge to the platform using test card 4000000000000077.',
        })
      }

      const transfer = await this.stripe.transfers.create({
        amount: transferAmount,
        currency: getCharge.currency,
        destination: payload.consultant_account_id,
        transfer_group: getCharge.transfer_group || `group_${payload.payment_intent}`,
      })

      const validated = await releaseResponse.validate({
        id: transfer.id,
        amount: transfer.amount / 100,
        currency: transfer.currency,
        created: transfer.created,
        destination: transfer.destination,
        status: 'status' in transfer ? transfer.status : 'unknown',
      })

      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: validated,
      })
    } catch (err) {
      logger.error(`release error ==> ${JSON.stringify(err, null, 2)}`)
      const stripeError = err.raw || err
      return response.status(stripeError.statusCode || 500).send({
        code: stripeError.statusCode || HttpCodes.INTERNAL_SERVER_ERROR,
        message: stripeError.message || HttpResponse.INTERNAL_SERVER_ERROR,
      })
    }
  }
}
