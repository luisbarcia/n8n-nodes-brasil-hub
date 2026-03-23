import type { IResourceDefinition } from '../../types';
import { cambioDescription } from './cambio.description';
import { cambioCurrencies, cambioRate } from './cambio.execute';

/**
 * Resource definition for the Câmbio (exchange rates) resource.
 *
 * Provides two operations:
 * - `currencies` — lists all available currencies from the Central Bank.
 * - `rate` — queries exchange rate quotations for a specific currency and date.
 */
export const cambioResource: IResourceDefinition = {
	resource: 'cambio',
	description: cambioDescription,
	operations: { currencies: cambioCurrencies, rate: cambioRate },
};
