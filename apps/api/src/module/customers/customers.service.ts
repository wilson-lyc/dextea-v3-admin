import { customerRepository } from './customers.repository.js';
import type { GetCustomerListRequest } from '@dextea-admin/contracts';

export const customerService = {
  async getCustomerList(params: GetCustomerListRequest) {
    return customerRepository.getCustomerList(params.page, params.pageSize, {
      id: params.id,
      status: params.status,
      name: params.name,
      email: params.email,
      phone: params.phone,
    });
  },
};
