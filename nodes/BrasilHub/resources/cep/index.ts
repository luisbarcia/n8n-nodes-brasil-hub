import type { IResourceDefinition } from '../../types';
import { cepDescription } from './cep.description';
import { cepQuery, cepValidate } from './cep.execute';

/** Resource definition for the cep resource module. */
export const cepResource: IResourceDefinition = {
	resource: 'cep',
	description: cepDescription,
	operations: { query: cepQuery, validate: cepValidate },
};
