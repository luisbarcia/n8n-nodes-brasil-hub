import type { IResourceDefinition } from '../../types';
import { pixDescription } from './pix.description';
import { pixList, pixQuery } from './pix.execute';

export const pixResource: IResourceDefinition = {
	resource: 'pix',
	description: pixDescription,
	operations: { list: pixList, query: pixQuery },
};
