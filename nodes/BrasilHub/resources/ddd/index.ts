import type { IResourceDefinition } from '../../types';
import { dddDescription } from './ddd.description';
import { dddQuery } from './ddd.execute';

export const dddResource: IResourceDefinition = {
	resource: 'ddd',
	description: dddDescription,
	operations: { query: dddQuery },
};
