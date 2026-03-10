import { cnpjQuery, cnpjValidate } from '../nodes/BrasilHub/resources/cnpj/cnpj.execute';

jest.useFakeTimers();

function createMockContext(overrides: Record<string, unknown> = {}) {
	const params: Record<string, unknown> = {
		cnpj: '11222333000181',
		includeRaw: false,
		...overrides,
	};
	return {
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
		helpers: {
			httpRequest: jest.fn().mockResolvedValue({
				cnpj: '11222333000181',
				razao_social: 'EMPRESA TESTE',
				nome_fantasia: '',
				descricao_situacao_cadastral: 'ATIVA',
				data_inicio_atividade: '2020-01-01',
				descricao_porte: 'ME',
				natureza_juridica: 'LTDA',
				capital_social: 10000,
				cnae_fiscal: 6201501,
				cnae_fiscal_descricao: 'Desenvolvimento de software',
				logradouro: 'RUA TESTE',
				numero: '100',
				complemento: '',
				bairro: 'CENTRO',
				cep: '01001000',
				municipio: 'SAO PAULO',
				uf: 'SP',
				ddd_telefone_1: '1199999999',
				ddd_telefone_2: '',
				email: '',
				qsa: [],
			}),
		},
	} as unknown as Parameters<typeof cnpjQuery>[0];
}

async function runWithTimers<T>(promise: Promise<T>): Promise<T> {
	const result = promise;
	for (let i = 0; i < 5; i++) {
		jest.advanceTimersByTime(1100);
		await Promise.resolve();
	}
	return result;
}

afterAll(() => jest.useRealTimers());

describe('cnpjQuery', () => {
	it('should return normalized data with _meta', async () => {
		const ctx = createMockContext();
		const result = await runWithTimers(cnpjQuery(ctx, 0));
		expect(result.json).toHaveProperty('cnpj', '11222333000181');
		expect(result.json).toHaveProperty('_meta');
		expect(result.json._meta).toHaveProperty('provider', 'brasilapi');
		expect(result.pairedItem).toEqual({ item: 0 });
	});

	it('should throw on invalid CNPJ length', async () => {
		const ctx = createMockContext({ cnpj: '123' });
		await expect(cnpjQuery(ctx, 0)).rejects.toThrow('CNPJ must have 14 digits');
	});
});

describe('cnpjValidate', () => {
	it('should return validation result', async () => {
		const ctx = createMockContext({ cnpj: '11222333000181' });
		const result = await cnpjValidate(ctx, 0);
		expect(result.json).toEqual({
			valid: true,
			formatted: '11.222.333/0001-81',
			input: '11222333000181',
		});
		expect(result.pairedItem).toEqual({ item: 0 });
	});
});
