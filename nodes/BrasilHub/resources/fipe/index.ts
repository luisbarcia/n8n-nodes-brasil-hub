import type { IResourceDefinition } from '../../types';
import { fipeDescription } from './fipe.description';
import { fipeBrands, fipeModels, fipePrice, fipeReferenceTables, fipeYears } from './fipe.execute';

/** Resource definition for the fipe resource module. */
export const fipeResource: IResourceDefinition = {
	resource: 'fipe',
	description: fipeDescription,
	operations: { brands: fipeBrands, models: fipeModels, price: fipePrice, referenceTables: fipeReferenceTables, years: fipeYears },
};
