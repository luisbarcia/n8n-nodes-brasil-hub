import type { IResourceDefinition } from '../../types';
import { cnpjDescription } from './cnpj.description';
import { cnpjQuery, cnpjValidate } from './cnpj.execute';

export const cnpjResource: IResourceDefinition = {
	resource: 'cnpj',
	description: cnpjDescription,
	operations: { query: cnpjQuery, validate: cnpjValidate },
};
