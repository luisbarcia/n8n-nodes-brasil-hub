import type { IResourceDefinition } from '../../types';
import { ibgeDescription } from './ibge.description';
import { ibgeStates, ibgeCities } from './ibge.execute';

export const ibgeResource: IResourceDefinition = {
	resource: 'ibge',
	description: ibgeDescription,
	operations: { states: ibgeStates, cities: ibgeCities },
};
