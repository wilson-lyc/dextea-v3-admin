import { nanoid } from 'nanoid';
import { BizError } from '@/common/exceptions/index.js';
import { EmployeeErrorCodes } from './employees.errorcode.js';
import { employeeRepository } from './employees.repository.js';
import { validateEmail, validateMaxLength } from '@/utils/validation.js';
import { hashPassword } from '@/plugins/password/index.js';
import { EMPLOYEE_STATUS, EMPLOYEE_STATUS_VALUES } from '@dextea-admin/contracts';
import type { GetEmployeeListRequest, CreateEmployeeRequest, UpdateEmployeeRequest } from '@dextea-admin/contracts';

export const employeeService = {
  async getEmployeeListWithPage(params: GetEmployeeListRequest) {
    return employeeRepository.getEmployeeListWithPage(params.page, params.pageSize, params.keyword);
  },

  async createEmployee(input: CreateEmployeeRequest) {
    const { email, displayName } = input;

    validateEmail(email);
    validateMaxLength(displayName, 255, '显示名称');

    const existing = await employeeRepository.getEmployeeByEmail(email);
    if (existing) {
      throw new BizError(EmployeeErrorCodes.EMAIL_EXISTS);
    }

    const initialPassword = nanoid(12);
    const hashedPassword = await hashPassword(initialPassword);

    const id = await employeeRepository.createEmployee({
      email,
      password: hashedPassword,
      displayName,
      status: EMPLOYEE_STATUS.DISABLED.value,
    });

    return {
      user: { id, email, displayName, status: EMPLOYEE_STATUS.DISABLED.value },
      initialPassword,
    };
  },

  async updateEmployee(id: number, input: UpdateEmployeeRequest) {
    const { email, displayName } = input;

    validateEmail(email);
    validateMaxLength(displayName, 255, '显示名称');

    const employee = await employeeRepository.getEmployeeById(id);
    if (!employee) {
      throw new BizError(EmployeeErrorCodes.EMPLOYEE_NOT_FOUND);
    }

    const existingEmail = await employeeRepository.getEmployeeByEmail(email);
    if (existingEmail && existingEmail.id !== id) {
      throw new BizError(EmployeeErrorCodes.EMAIL_EXISTS_OTHER);
    }

    await employeeRepository.updateEmployeeById(id, email, displayName);

    return { id, email, displayName };
  },

  async updateEmployeeStatus(id: number, status: number) {
    if (!(EMPLOYEE_STATUS_VALUES as readonly number[]).includes(status)) {
      throw new BizError(EmployeeErrorCodes.INVALID_STATUS);
    }

    const employee = await employeeRepository.getEmployeeById(id);
    if (!employee) {
      throw new BizError(EmployeeErrorCodes.EMPLOYEE_NOT_FOUND);
    }

    await employeeRepository.updateEmployeeStatusById(id, status);

    return { email: employee.email, status };
  },

  async resetEmployeePassword(id: number) {
    const employee = await employeeRepository.getEmployeeById(id);
    if (!employee) {
      throw new BizError(EmployeeErrorCodes.EMPLOYEE_NOT_FOUND);
    }

    const initialPassword = nanoid(12);
    const hashedPassword = await hashPassword(initialPassword);

    await employeeRepository.updateEmployeePasswordById(id, hashedPassword);

    return {
      user: {
        id: employee.id,
        email: employee.email,
        displayName: employee.displayName,
        status: employee.status,
      },
      initialPassword,
    };
  },
};
