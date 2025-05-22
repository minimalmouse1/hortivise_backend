import { Stripe } from 'stripe'

type Customer = Stripe.Customer
type Options = Stripe.RequestOptions
type Response<T> = Stripe.Response<T>

export interface SearchParams {
  value: string
  field?: 'name' | 'email' | 'phone'
}

export interface UpdateParams {
  id: string
  options?: Options
  params?: Stripe.CustomerUpdateParams
}

export interface CreateParams {
  options?: Options
  params?: Stripe.CustomerCreateParams
}

export interface DeleteParams {
  id: string
  options?: Options
  params?: Stripe.CustomerDeleteParams
}

export type CustomerResponse = Response<Customer>
export type AllResponse = Stripe.ApiListPromise<Customer>
export type DeleteResponse = Response<Stripe.DeletedCustomer>
export type SearchResponse = Stripe.ApiSearchResultPromise<Customer>
export type SingleResponse = Response<Customer | Stripe.DeletedCustomer>
