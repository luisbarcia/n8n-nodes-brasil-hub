import type { IResourceDefinition } from '../../types';
import { dddDescription } from './ddd.description';
import { dddQuery } from './ddd.execute';

/** Resource definition for the ddd resource module. */
export const dddResource: IResourceDefinition = {
	resource: 'ddd',
	description: dddDescription,
	operations: { query: dddQuery },
};
