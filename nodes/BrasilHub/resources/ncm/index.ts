import type { IResourceDefinition } from '../../types';
import { ncmDescription } from './ncm.description';
import { ncmQuery, ncmSearch } from './ncm.execute';

/** Resource definition for the ncm resource module. */
export const ncmResource: IResourceDefinition = {
	resource: 'ncm',
	description: ncmDescription,
	operations: { query: ncmQuery, search: ncmSearch },
};
