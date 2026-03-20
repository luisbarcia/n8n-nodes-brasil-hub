import type { IResourceDefinition } from '../../types';
import { feriadosDescription } from './feriados.description';
import { feriadosQuery } from './feriados.execute';

export const feriadosResource: IResourceDefinition = {
	resource: 'feriados',
	description: feriadosDescription,
	operations: { query: feriadosQuery },
};
