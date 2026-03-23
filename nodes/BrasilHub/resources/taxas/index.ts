import type { IResourceDefinition } from '../../types';
import { taxasDescription } from './taxas.description';
import { taxasList, taxasQuery } from './taxas.execute';

/** Resource definition for Taxas (Brazilian interest rates). */
export const taxasResource: IResourceDefinition = {
	resource: 'taxas',
	description: taxasDescription,
	operations: { list: taxasList, query: taxasQuery },
};
