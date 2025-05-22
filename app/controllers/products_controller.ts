import type { HttpContext } from '@adonisjs/core/http'
import stripe from '@vbusatta/adonis-stripe/services/main'

import BaseController from '#controllers/bases_controller'
import { create, update, productResponse } from '#validators/product'
import HttpCodes from '#enums/http_codes'
import HttpResponse from '#enums/response_messages'
import logger from '@adonisjs/core/services/logger'

export default class ProductsController extends BaseController {
  /**
   * @all
   * @summary Get all products
   * @description Retrieves a list of all Stripe products.
   * @responseBody 200 - {"code": 200, "message": "Request successful", "result": "<productResponse[]>"}
   * @responseBody 500 - {"code": 500, "message": "Internal server error"} - Internal server error
   */

  async all({ response }: HttpContext) {
    try {
      const products = await stripe.api.products.list()
      const formatted = await Promise.all(
        products.data.map(async (prod) => {
          const prices = await stripe.api.prices.list({ product: prod.id, active: true })
          const price = prices.data[0]

          return productResponse.validate({
            name: prod.name,
            active: prod.active,
            product_id: prod.id,
            price_id: price?.id || '',
            description: prod.description ?? null,
          })
        })
      )

      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: formatted,
      })
    } catch (err) {
      logger.error('Stripe fetch all products error', err)
      return response.internalServerError({
        code: HttpCodes.INTERNAL_SERVER_ERROR,
        message: HttpResponse.INTERNAL_SERVER_ERROR,
      })
    }
  }

  /**
   * @single
   * @summary Get a single product
   * @description Retrieves a Stripe product by ID.
   * @operationId getProductById
   * @paramPath id - The ID of the product to retrieve - @type(string) @required
   * @responseBody 200 - {"code": 200, "message": "Request successful", "result": "<productResponse>"}
   * @responseBody 400 - {"code": 400, "message": "Bad request", "content": "Valid product ID should start with prod_"} - Invalid product ID
   * @responseBody 404 - {"code": 404, "message": "Resource not found"} - Product not found
   * @responseBody 500 - {"code": 500, "message": "Internal server error"} - Internal server error
   */

  async single({ request, response }: HttpContext) {
    const id = request.param('id')
    if (!id.startsWith('prod_')) {
      return response.badRequest({
        code: HttpCodes.BAD_REQUEST,
        message: HttpResponse.BAD_REQUEST,
        content: 'Valid product ID should start with prod_',
      })
    }

    try {
      const product = await stripe.api.products.retrieve(id)
      const prices = await stripe.api.prices.list({ product: product.id, active: true })
      const price = prices.data[0]

      const validated = await productResponse.validate({
        name: product.name,
        active: product.active,
        price_id: price?.id || '',
        product_id: product.id,
        description: product.description ?? null,
      })

      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: validated,
      })
    } catch (err) {
      if (err.type === 'StripeInvalidRequestError' && err.code === 'resource_missing') {
        return response.notFound({
          code: HttpCodes.NOT_FOUND,
          message: HttpResponse.NOT_FOUND,
        })
      }

      return response.internalServerError({
        code: HttpCodes.INTERNAL_SERVER_ERROR,
        message: HttpResponse.INTERNAL_SERVER_ERROR,
      })
    }
  }

  /**
   * @create
   * @summary Create a new product
   * @description Creates a new Stripe product and price.
   * @requestBody <create>
   * @responseBody 201 - {"code": 201, "message": "Resource created successfully", "result": "<productResponse>"}
   * @responseBody 400 - {"code": 400, "message": "Bad request"} - Validation error
   * @responseBody 500 - {"code": 500, "message": "Internal server error"} - Stripe error
   */

  async create({ request, response }: HttpContext) {
    const data = request.all()
    const payload = await create.validate(data)

    const stripeProduct = await stripe.api.products.create({
      name: payload.name,
      description: payload.description,
      active: payload.active ?? true,
    })

    const stripePrice = await stripe.api.prices.create({
      currency: 'usd',
      product: stripeProduct.id,
      unit_amount: Number(payload.price) * 100,
    })

    const validated = await productResponse.validate({
      name: stripeProduct.name,
      active: stripeProduct.active,
      price_id: stripePrice.id,
      product_id: stripeProduct.id,
      description: stripeProduct.description ?? null,
    })

    return response.created({
      code: HttpCodes.CREATED,
      message: HttpResponse.CREATED,
      result: validated,
    })
  }

  /**
   * @update
   * @summary Update a product's details
   * @description Updates product fields such as name, description, active status, and price.
   * @paramPath id - The Stripe Product ID to update - @type(string) @required
   * @requestBody <update>
   * @responseBody 200 - {"code": 200, "message": "Request successful", "result": "<productResponse>"} - Updated product details
   * @responseBody 400 - {"code": 400, "message": "Bad request"} - Invalid input or ID format
   * @responseBody 404 - {"code": 404, "message": "Resource not found"} - Product not found
   * @responseBody 500 - {"code": 500, "message": "Internal server error"} - Stripe or server error
   */
  async update({ request, response }: HttpContext) {
    const id = request.param('id')

    if (!id || !id.startsWith('prod_')) {
      return response.badRequest({
        code: HttpCodes.BAD_REQUEST,
        message: HttpResponse.BAD_REQUEST,
        content: 'Valid product ID must start with "prod_"',
      })
    }

    const data = request.all()
    const payload = await update.validate(data)

    try {
      const updatedProduct = await stripe.api.products.update(id, {
        name: payload.name,
        description: payload.description,
        active: payload.active ?? true,
      })

      let priceId: string | null = null

      if (payload.price) {
        const existingPrices = await stripe.api.prices.list({ product: id, active: true })

        await Promise.all(
          existingPrices.data.map((p) =>
            stripe.api.prices.update(p.id, { active: false }).catch(() => null)
          )
        )

        const newPrice = await stripe.api.prices.create({
          currency: 'usd',
          product: id,
          unit_amount: Number(payload.price) * 100,
        })

        priceId = newPrice.id
      } else {
        const prices = await stripe.api.prices.list({ product: id, active: true })
        priceId = prices.data[0]?.id || null
      }

      const validated = await productResponse.validate({
        name: updatedProduct.name,
        active: updatedProduct.active,
        product_id: updatedProduct.id,
        price_id: priceId || '',
        description: updatedProduct.description ?? null,
      })

      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: validated,
      })
    } catch (err) {
      logger.error('Stripe update product error', err)

      if (err.type === 'StripeInvalidRequestError' && err.code === 'resource_missing') {
        return response.notFound({
          code: HttpCodes.NOT_FOUND,
          message: HttpResponse.NOT_FOUND,
        })
      }

      return response.internalServerError({
        code: HttpCodes.INTERNAL_SERVER_ERROR,
        message: HttpResponse.INTERNAL_SERVER_ERROR,
      })
    }
  }

  /**
   * @delete
   * @summary Delete (archive) a product
   * @description Archives a Stripe product by ID.
   * @paramPath id - The ID of the product to delete - @type(string) @required
   * @responseBody 200 - {"code": 200, "message": "Resource deleted successfully", "result": {"product_id": "string", "status": "archived"}}
   * @responseBody 400 - {"code": 400, "message": "Bad request"} - Invalid product ID
   * @responseBody 404 - {"code": 404, "message": "Resource not found"} - Product not found
   * @responseBody 500 - {"code": 500, "message": "Internal server error"} - Stripe error
   */

  async delete({ request, response }: HttpContext) {
    const id = request.param('id')
    if (!id.startsWith('prod_')) {
      return response.badRequest({
        code: HttpCodes.BAD_REQUEST,
        message: HttpResponse.BAD_REQUEST,
        content: 'Valid product ID must start with "prod_"',
      })
    }

    try {
      const deletedProduct = await stripe.api.products.update(id, { active: false })

      return response.ok({
        code: HttpCodes.OK,
        message: HttpResponse.OK,
        result: {
          product_id: deletedProduct.id,
          status: deletedProduct.active ? 'active' : 'archived',
        },
      })
    } catch (err) {
      logger.error('Stripe delete product error', err)

      if (err.type === 'StripeInvalidRequestError' && err.code === 'resource_missing') {
        return response.notFound({
          code: HttpCodes.NOT_FOUND,
          message: HttpResponse.NOT_FOUND,
        })
      }

      return response.internalServerError({
        code: HttpCodes.INTERNAL_SERVER_ERROR,
        message: HttpResponse.INTERNAL_SERVER_ERROR,
      })
    }
  }
}
