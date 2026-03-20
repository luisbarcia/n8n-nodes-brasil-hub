import type { IResourceDefinition } from '../../types';
import { cpfDescription } from './cpf.description';
import { cpfValidate } from './cpf.execute';

export const cpfResource: IResourceDefinition = {
	resource: 'cpf',
	description: cpfDescription,
	operations: { validate: cpfValidate },
};
