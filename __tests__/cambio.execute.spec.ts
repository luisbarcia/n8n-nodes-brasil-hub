import { cambioCurrencies, cambioRate } from '../nodes/BrasilHub/resources/cambio/cambio.execute';

const currenciesResponse = [
	{ simbolo: 'USD', nome: 'Dolar dos Estados Unidos', tipo_moeda: 'A' },
	{ simbolo: 'EUR', nome: 'Euro', tipo_moeda: 'B' },
];

const cotacaoResponse = {
	moeda: 'USD',
	data: '2024-01-15',
	cotacoes: [
		{
			cotacao_compra: 4.8765,
			cotacao_venda: 4.8775,
			paridade_compra: 1,
			paridade_venda: 1,
			data_hora_cotacao: '2024-01-15 10:00:00.000',
			tipo_boletim: 'ABERTURA',
		},
		{
			cotacao_compra: 4.89,
			cotacao_venda: 4.891,
			paridade_compra: 1,
			paridade_venda: 1,
			data_hora_cotacao: '2024-01-15 13:00:00.000',
			tipo_boletim: 'INTERMEDIARIO',
		},
	],
};

function createMockContext(
	overrides: Record<string, unknown> = {},
	httpResponse: unknown = currenciesResponse,
) {
	const params: Record<string, unknown> = {
		currencyCode: 'USD',
		date: '2024-01-15',
		includeRaw: false,
		...overrides,
	};
	return {
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
		helpers: {
			httpRequest: jest.fn().mockResolvedValue(httpResponse),
		},
	} as unknown as Parameters<typeof cambioCurrencies>[0];
}

describe('cambioCurrencies', () => {
	it('should return multiple items (one per currency)', async () => {
		const ctx = createMockContext({}, currenciesResponse);
		const results = await cambioCurrencies(ctx, 0);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('symbol', 'USD');
		expect(results[0].json).toHaveProperty('name', 'Dolar dos Estados Unidos');
		expect(results[1].json).toHaveProperty('symbol', 'EUR');
	});

	it('should include _meta on each item', async () => {
		const ctx = createMockContext({}, currenciesResponse);
		const results = await cambioCurrencies(ctx, 0);
		for (const r of results) {
			expect(r.json._meta).toHaveProperty('provider', 'brasilapi');
			expect(r.json._meta).toHaveProperty('query', 'moedas');
			expect(r.json._meta).toHaveProperty('strategy', 'direct');
			expect(r.pairedItem).toEqual({ item: 0 });
		}
	});

	it('should include _raw when includeRaw is true', async () => {
		const ctx = createMockContext({ includeRaw: true }, currenciesResponse);
		const results = await cambioCurrencies(ctx, 0);
		expect(results[0].json._raw).toEqual(currenciesResponse[0]);
		expect(results[1].json._raw).toEqual(currenciesResponse[1]);
	});

	it('should not include _raw when includeRaw is false', async () => {
		const ctx = createMockContext({ includeRaw: false }, currenciesResponse);
		const results = await cambioCurrencies(ctx, 0);
		expect(results[0].json).not.toHaveProperty('_raw');
	});

	it('should handle empty response', async () => {
		const ctx = createMockContext({}, []);
		const results = await cambioCurrencies(ctx, 0);
		expect(results).toEqual([]);
	});

	it('should call correct URL for currencies', async () => {
		const ctx = createMockContext({}, currenciesResponse);
		await cambioCurrencies(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).toContain('/cambio/v1/moedas');
	});

	it('should throw on HTTP failure via queryWithFallback', async () => {
		const ctx = createMockContext({}, currenciesResponse);
		(ctx.helpers.httpRequest as jest.Mock).mockRejectedValue(new Error('Network error'));
		await expect(cambioCurrencies(ctx, 0)).rejects.toThrow('No provider could fulfill the request');
	});

	it('should handle non-array response gracefully', async () => {
		const ctx = createMockContext({}, { unexpected: 'response' });
		const results = await cambioCurrencies(ctx, 0);
		expect(results).toEqual([]);
	});

	it('should handle null response gracefully', async () => {
		const ctx = createMockContext({}, null);
		const results = await cambioCurrencies(ctx, 0);
		expect(results).toEqual([]);
	});

	it('should pass correct headers', async () => {
		const ctx = createMockContext({}, currenciesResponse);
		await cambioCurrencies(ctx, 0);
		const requestConfig = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0];
		expect(requestConfig.headers).toHaveProperty('User-Agent', 'n8n-brasil-hub-node/1.0');
		expect(requestConfig.headers).toHaveProperty('Accept', 'application/json');
	});
});

describe('cambioRate', () => {
	it('should return multiple items (one per cotacao)', async () => {
		const ctx = createMockContext({ currencyCode: 'USD', date: '2024-01-15' }, cotacaoResponse);
		const results = await cambioRate(ctx, 0);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('currency', 'USD');
		expect(results[0].json).toHaveProperty('buyRate', 4.8765);
		expect(results[0].json).toHaveProperty('bulletinType', 'ABERTURA');
		expect(results[1].json).toHaveProperty('bulletinType', 'INTERMEDIARIO');
	});

	it('should include _meta on each item', async () => {
		const ctx = createMockContext({ currencyCode: 'USD', date: '2024-01-15' }, cotacaoResponse);
		const results = await cambioRate(ctx, 0);
		for (const r of results) {
			expect(r.json._meta).toHaveProperty('provider', 'brasilapi');
			expect(r.json._meta).toHaveProperty('query', 'USD/2024-01-15');
			expect(r.json._meta).toHaveProperty('strategy', 'direct');
			expect(r.pairedItem).toEqual({ item: 0 });
		}
	});

	it('should include _raw when includeRaw is true', async () => {
		const ctx = createMockContext({ currencyCode: 'USD', date: '2024-01-15', includeRaw: true }, cotacaoResponse);
		const results = await cambioRate(ctx, 0);
		expect(results[0].json).toHaveProperty('_raw');
	});

	it('should not include _raw when includeRaw is false', async () => {
		const ctx = createMockContext({ currencyCode: 'USD', date: '2024-01-15', includeRaw: false }, cotacaoResponse);
		const results = await cambioRate(ctx, 0);
		expect(results[0].json).not.toHaveProperty('_raw');
	});

	it('should call correct URL with encoded currency and date', async () => {
		const ctx = createMockContext({ currencyCode: 'USD', date: '2024-01-15' }, cotacaoResponse);
		await cambioRate(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).toContain('/cambio/v1/cotacao/USD/2024-01-15');
	});

	it('should throw on invalid currency code — too short', async () => {
		const ctx = createMockContext({ currencyCode: 'US', date: '2024-01-15' });
		await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid currency code');
		expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
	});

	it('should throw on invalid currency code — too long', async () => {
		const ctx = createMockContext({ currencyCode: 'USDT', date: '2024-01-15' });
		await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid currency code');
		expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
	});

	it('should accept lowercase currency code and uppercase internally', async () => {
		const ctx = createMockContext({ currencyCode: 'usd', date: '2024-01-15' }, cotacaoResponse);
		const results = await cambioRate(ctx, 0);
		expect(results).toHaveLength(2);
	});

	it('should throw on invalid currency code — numbers', async () => {
		const ctx = createMockContext({ currencyCode: '123', date: '2024-01-15' });
		await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid currency code');
	});

	it('should throw on empty currency code', async () => {
		const ctx = createMockContext({ currencyCode: '', date: '2024-01-15' });
		await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid currency code');
	});

	it('should throw on whitespace-only currency code', async () => {
		const ctx = createMockContext({ currencyCode: '   ', date: '2024-01-15' });
		await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid currency code');
	});

	it('should throw on invalid date format — DD/MM/YYYY', async () => {
		const ctx = createMockContext({ currencyCode: 'USD', date: '15/01/2024' });
		await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid date');
	});

	it('should throw on invalid date format — no dashes', async () => {
		const ctx = createMockContext({ currencyCode: 'USD', date: '20240115' });
		await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid date');
	});

	it('should throw on empty date', async () => {
		const ctx = createMockContext({ currencyCode: 'USD', date: '' });
		await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid date');
	});

	it('should throw on whitespace-only date', async () => {
		const ctx = createMockContext({ currencyCode: 'USD', date: '   ' });
		await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid date');
	});

	it('should accept valid ISO date', async () => {
		const ctx = createMockContext({ currencyCode: 'EUR', date: '2026-03-23' }, cotacaoResponse);
		const results = await cambioRate(ctx, 0);
		expect(results).toHaveLength(2);
	});

	it('should throw on HTTP failure via queryWithFallback', async () => {
		const ctx = createMockContext({ currencyCode: 'USD', date: '2024-01-15' }, cotacaoResponse);
		(ctx.helpers.httpRequest as jest.Mock).mockRejectedValue(new Error('Timeout'));
		await expect(cambioRate(ctx, 0)).rejects.toThrow('No provider could fulfill the request');
	});

	it('should handle response with empty cotacoes array', async () => {
		const ctx = createMockContext(
			{ currencyCode: 'USD', date: '2024-01-15' },
			{ moeda: 'USD', data: '2024-01-15', cotacoes: [] },
		);
		const results = await cambioRate(ctx, 0);
		expect(results).toEqual([]);
	});

	it('should handle response without cotacoes property', async () => {
		const ctx = createMockContext(
			{ currencyCode: 'USD', date: '2024-01-15' },
			{ moeda: 'USD', data: '2024-01-15' },
		);
		const results = await cambioRate(ctx, 0);
		expect(results).toEqual([]);
	});

	it('should handle null response', async () => {
		const ctx = createMockContext(
			{ currencyCode: 'USD', date: '2024-01-15' },
			null,
		);
		const results = await cambioRate(ctx, 0);
		expect(results).toEqual([]);
	});

	it('should trim currency code and date', async () => {
		const ctx = createMockContext({ currencyCode: '  USD  ', date: '  2024-01-15  ' }, cotacaoResponse);
		const results = await cambioRate(ctx, 0);
		expect(results).toHaveLength(2);
	});

	it('should uppercase currency code', async () => {
		const ctx = createMockContext({ currencyCode: 'eur', date: '2024-01-15' }, cotacaoResponse);
		await cambioRate(ctx, 0);
		const callUrl = (ctx.helpers.httpRequest as jest.Mock).mock.calls[0][0].url;
		expect(callUrl).toContain('/cotacao/EUR/');
	});

	it('should handle currency code with special characters', async () => {
		const ctx = createMockContext({ currencyCode: 'U$D', date: '2024-01-15' });
		await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid currency code');
	});

	it('should handle date with extra text', async () => {
		const ctx = createMockContext({ currencyCode: 'USD', date: '2024-01-15T00:00:00' });
		await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid date');
		expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
	});

	it('should not call httpRequest for invalid date', async () => {
		const ctx = createMockContext({ currencyCode: 'USD', date: 'not-a-date' });
		await expect(cambioRate(ctx, 0)).rejects.toThrow('Invalid date');
		expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
	});

	it('should include _meta.queried_at as ISO string', async () => {
		const ctx = createMockContext({ currencyCode: 'USD', date: '2024-01-15' }, cotacaoResponse);
		const results = await cambioRate(ctx, 0);
		expect(results[0].json._meta).toHaveProperty('queried_at');
		expect(typeof (results[0].json._meta as Record<string, unknown>).queried_at).toBe('string');
	});
});
