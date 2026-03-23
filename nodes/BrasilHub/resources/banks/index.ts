import type { IResourceDefinition } from '../../types';
import { banksDescription } from './banks.description';
import { banksQuery, banksList } from './banks.execute';

/** Resource definition for the banks resource module. */
export const banksResource: IResourceDefinition = {
	resource: 'banks',
	description: banksDescription,
	operations: { query: banksQuery, list: banksList },
};
