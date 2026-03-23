import type { IResourceDefinition } from '../../types';
import { pixDescription } from './pix.description';
import { pixList, pixQuery } from './pix.execute';

/** Resource definition for the pix resource module. */
export const pixResource: IResourceDefinition = {
	resource: 'pix',
	description: pixDescription,
	operations: { list: pixList, query: pixQuery },
};
