import { cnpjQuery, cnpjValidate } from '../nodes/BrasilHub/resources/cnpj/cnpj.execute';

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

describe('cnpjQuery', () => {
	it('should return normalized data with _meta', async () => {
		const ctx = createMockContext();
		const result = await cnpjQuery(ctx, 0);
		expect(result.json).toHaveProperty('cnpj', '11222333000181');
		expect(result.json).toHaveProperty('_meta');
		expect(result.json._meta).toHaveProperty('provider', 'brasilapi');
		expect(result.json._meta).toHaveProperty('strategy', 'direct');
		expect(result.pairedItem).toEqual({ item: 0 });
	});

	it('should throw on invalid CNPJ length', async () => {
		const ctx = createMockContext({ cnpj: '123' });
		await expect(cnpjQuery(ctx, 0)).rejects.toThrow('CNPJ must have 14 digits');
	});
});

describe('cnpjQuery with fallback', () => {
	it('should set strategy to fallback when first provider fails', async () => {
		let callCount = 0;
		const ctx = {
			...createMockContext(),
			helpers: {
				httpRequest: jest.fn().mockImplementation(async () => {
					callCount++;
					if (callCount === 1) throw new Error('Timeout');
					return {
						cnpj: '11222333000181', razao_social: 'TESTE', nome_fantasia: '',
						descricao_situacao_cadastral: 'ATIVA', data_inicio_atividade: '',
						descricao_porte: '', natureza_juridica: '', capital_social: 0,
						cnae_fiscal: 0, cnae_fiscal_descricao: '', logradouro: '', numero: '',
						complemento: '', bairro: '', cep: '', municipio: '', uf: '',
						ddd_telefone_1: '', ddd_telefone_2: '', email: '', qsa: [],
					};
				}),
			},
		} as unknown as Parameters<typeof cnpjQuery>[0];
		const result = await cnpjQuery(ctx, 0);
		expect(result.json._meta).toHaveProperty('strategy', 'fallback');
		expect(result.json._meta).toHaveProperty('errors');
	});
});

describe('cnpjQuery with includeRaw', () => {
	it('should include raw response when includeRaw is true', async () => {
		const ctx = createMockContext({ includeRaw: true });
		const result = await cnpjQuery(ctx, 0);
		expect(result.json).toHaveProperty('_raw');
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
