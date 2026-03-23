import type { IResourceDefinition } from '../../types';
import { cpfDescription } from './cpf.description';
import { cpfValidate } from './cpf.execute';

/** Resource definition for the cpf resource module. */
export const cpfResource: IResourceDefinition = {
	resource: 'cpf',
	description: cpfDescription,
	operations: { validate: cpfValidate },
};
