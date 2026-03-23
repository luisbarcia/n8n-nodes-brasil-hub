import type { IResourceDefinition } from '../../types';
import { ibgeDescription } from './ibge.description';
import { ibgeStates, ibgeCities } from './ibge.execute';

/** Resource definition for the ibge resource module. */
export const ibgeResource: IResourceDefinition = {
	resource: 'ibge',
	description: ibgeDescription,
	operations: { states: ibgeStates, cities: ibgeCities },
};
