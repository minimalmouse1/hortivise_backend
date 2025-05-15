import stripe from '@vbusatta/adonis-stripe/services/main'

import type {
  AllResponse,
  CreateParams,
  DeleteParams,
  UpdateParams,
  SearchParams,
  DeleteResponse,
  SearchResponse,
  SingleResponse,
  CustomerResponse,
} from '#interface/customer_interface'

export class CustomerService {
  private customers = stripe.api.customers

  /**
   * Search
   * @param field - Query field for search customers - name | email | phone
   * @param value - Value field for search customers
   * @returns Promise<SearchResponse>
   */

  public async Search({ field = 'email', value }: SearchParams): Promise<SearchResponse> {
    return await this.customers.search({
      query: `${field}:"${value}"`,
    })
  }

  /**
   * All
   * @param limit - limit for paginated response - accapt number
   * @returns Promise<AllResponse>
   */

  public async All(limit?: number): Promise<AllResponse> {
    if (!limit) {
      return await this.customers.list()
    }
    return await this.customers.list({ limit })
  }

  /**
   * Single
   * @param id - Customer ID - accapt string
   * @returns Promise<SingleResponse>
   */

  public async Single(id: string): Promise<SingleResponse> {
    return await this.customers.retrieve(id)
  }

  /**
   * Create
   * @param options - Stripe.RequestOptions | undefined
   * @param params - Stripe.CustomerCreateParams | undefined
   * @returns Promise<CustomerResponse>
   */

  public async Create({ options, params }: CreateParams): Promise<CustomerResponse> {
    return await this.customers.create(params, options)
  }

  /**
   * Update
   * @param id - Customer ID - accapt string
   * @param options - Stripe.RequestOptions | undefined
   * @param params - Stripe.CustomerUpdateParams | undefined
   * @returns Promise<CustomerResponse>
   */

  public async Update({ id, options, params }: UpdateParams): Promise<CustomerResponse> {
    return await this.customers.update(id, params, options)
  }

  /**
   * Delete
   * @param id - Customer ID - accapt string
   * @param options - Stripe.RequestOptions | undefined
   * @param params - Stripe.CustomerDeleteParams | undefined
   * @returns Promise<DeleteResponse>
   */

  public async Delete({ id, options, params }: DeleteParams): Promise<DeleteResponse> {
    return await this.customers.del(id, options, params)
  }
}
