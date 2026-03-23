import type { IResourceDefinition } from '../../types';
import { cnpjDescription } from './cnpj.description';
import { cnpjQuery, cnpjValidate } from './cnpj.execute';

/** Resource definition for the cnpj resource module. */
export const cnpjResource: IResourceDefinition = {
	resource: 'cnpj',
	description: cnpjDescription,
	operations: { query: cnpjQuery, validate: cnpjValidate },
};
