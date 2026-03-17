import { BrasilHub } from '../nodes/BrasilHub/BrasilHub.node';
import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

function createExecuteContext(overrides: {
	resource?: string;
	operation?: string;
	cnpj?: string;
	cep?: string;
	cpf?: string;
	bankCode?: string;
	ddd?: string;
	vehicleType?: string;
	brandCode?: string;
	modelCode?: string;
	yearCode?: string;
	referenceTable?: number;
	year?: number;
	uf?: string;
	simplify?: boolean;
	includeRaw?: boolean;
	items?: INodeExecutionData[];
	continueOnFail?: boolean;
	httpResponse?: unknown;
	httpError?: Error;
}) {
	const params: Record<string, unknown> = {
		resource: overrides.resource ?? 'cnpj',
		operation: overrides.operation ?? 'validate',
		cnpj: overrides.cnpj ?? '11222333000181',
		cep: overrides.cep ?? '01001000',
		cpf: overrides.cpf ?? '52998224725',
		bankCode: overrides.bankCode ?? '1',
		ddd: overrides.ddd ?? '11',
		vehicleType: overrides.vehicleType ?? 'carros',
		brandCode: overrides.brandCode ?? '59',
		modelCode: overrides.modelCode ?? '4828',
		yearCode: overrides.yearCode ?? '2024-1',
		referenceTable: overrides.referenceTable ?? 0,
		year: overrides.year ?? 2026,
		uf: overrides.uf ?? 'SP',
		simplify: overrides.simplify ?? true,
		includeRaw: overrides.includeRaw ?? false,
	};

	const items = overrides.items ?? [{ json: {} }];

	const httpRequest = overrides.httpError
		? jest.fn().mockRejectedValue(overrides.httpError)
		: jest.fn().mockResolvedValue(overrides.httpResponse ?? {
				cnpj: '11222333000181',
				razao_social: 'TESTE',
				nome_fantasia: '',
				descricao_situacao_cadastral: 'ATIVA',
				data_inicio_atividade: '2020-01-01',
				descricao_porte: 'ME',
				natureza_juridica: 'LTDA',
				capital_social: 10000,
				cnae_fiscal: 6201501,
				cnae_fiscal_descricao: 'Dev',
				logradouro: 'RUA',
				numero: '1',
				complemento: '',
				bairro: 'CENTRO',
				cep: '01001000',
				municipio: 'SP',
				uf: 'SP',
				ddd_telefone_1: '',
				ddd_telefone_2: '',
				email: '',
				qsa: [],
			});

	const context = {
		getInputData: jest.fn(() => items),
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) =>
			params[name] ?? fallback,
		),
		getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
		continueOnFail: jest.fn(() => overrides.continueOnFail ?? false),
		helpers: { httpRequest },
	} as unknown as IExecuteFunctions;

	return context;
}

describe('BrasilHub.execute()', () => {
	const node = new BrasilHub();

	it('should dispatch cnpj/validate and return result', async () => {
		const ctx = createExecuteContext({ resource: 'cnpj', operation: 'validate' });
		const [[result]] = await node.execute.call(ctx);
		expect(result.json).toEqual({
			valid: true,
			formatted: '11.222.333/0001-81',
			input: '11222333000181',
		});
	});

	it('should dispatch cep/validate and return result', async () => {
		const ctx = createExecuteContext({ resource: 'cep', operation: 'validate' });
		const [[result]] = await node.execute.call(ctx);
		expect(result.json).toEqual({
			valid: true,
			formatted: '01001-000',
			input: '01001000',
		});
	});

	it('should dispatch banks/query and return normalized bank', async () => {
		const ctx = createExecuteContext({
			resource: 'banks',
			operation: 'query',
			httpResponse: { ispb: '00000000', name: 'BCO DO BRASIL S.A.', code: 1, fullName: 'Banco do Brasil S.A.' },
		});
		const [[result]] = await node.execute.call(ctx);
		expect(result.json).toHaveProperty('code', 1);
		expect(result.json).toHaveProperty('name', 'BCO DO BRASIL S.A.');
		expect(result.json).toHaveProperty('_meta');
	});

	it('should dispatch banks/list and return multiple items', async () => {
		const ctx = createExecuteContext({
			resource: 'banks',
			operation: 'list',
			httpResponse: [
				{ ispb: '00000000', name: 'BCO DO BRASIL S.A.', code: 1, fullName: 'Banco do Brasil S.A.' },
				{ ispb: '00000208', name: 'BRB', code: 70, fullName: 'BRB - BANCO DE BRASILIA S.A.' },
			],
		});
		const [results] = await node.execute.call(ctx);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('code', 1);
		expect(results[1].json).toHaveProperty('code', 70);
	});

	it('should dispatch feriados/query and return multiple items', async () => {
		const ctx = createExecuteContext({
			resource: 'feriados',
			operation: 'query',
			httpResponse: [
				{ date: '2026-01-01', name: 'Confraternização mundial', type: 'national' },
				{ date: '2026-04-21', name: 'Tiradentes', type: 'national' },
			],
		});
		const [results] = await node.execute.call(ctx);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('date', '2026-01-01');
		expect(results[0].json).toHaveProperty('name', 'Confraternização mundial');
		expect(results[0].json).toHaveProperty('_meta');
	});

	it('should dispatch ibge/states and return multiple items', async () => {
		const ctx = createExecuteContext({
			resource: 'ibge',
			operation: 'states',
			httpResponse: [
				{ id: 35, sigla: 'SP', nome: 'São Paulo', regiao: { id: 3, sigla: 'SE', nome: 'Sudeste' } },
				{ id: 33, sigla: 'RJ', nome: 'Rio de Janeiro', regiao: { id: 3, sigla: 'SE', nome: 'Sudeste' } },
			],
		});
		const [results] = await node.execute.call(ctx);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('abbreviation', 'SP');
		expect(results[0].json).toHaveProperty('name', 'São Paulo');
		expect(results[0].json).toHaveProperty('region', 'Sudeste');
		expect(results[0].json).toHaveProperty('_meta');
	});

	it('should dispatch ibge/cities and return multiple items', async () => {
		const ctx = createExecuteContext({
			resource: 'ibge',
			operation: 'cities',
			httpResponse: [
				{ nome: 'ADAMANTINA', codigo_ibge: '3500105' },
				{ nome: 'ADOLFO', codigo_ibge: '3500204' },
			],
		});
		const [results] = await node.execute.call(ctx);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('code', 3500105);
		expect(results[0].json).toHaveProperty('name', 'ADAMANTINA');
		expect(results[0].json).toHaveProperty('_meta');
	});

	it('should dispatch ddd/query and return state with cities', async () => {
		const ctx = createExecuteContext({
			resource: 'ddd',
			operation: 'query',
			httpResponse: { state: 'SP', cities: ['SÃO PAULO', 'GUARULHOS'] },
		});
		const [[result]] = await node.execute.call(ctx);
		expect(result.json).toHaveProperty('state', 'SP');
		expect(result.json).toHaveProperty('cities');
		expect(result.json).toHaveProperty('_meta');
	});

	it('should dispatch fipe/brands and return multiple items', async () => {
		const ctx = createExecuteContext({
			resource: 'fipe',
			operation: 'brands',
			httpResponse: [
				{ codigo: '1', nome: 'Acura' },
				{ codigo: '59', nome: 'Honda' },
			],
		});
		const [results] = await node.execute.call(ctx);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('code', '1');
		expect(results[1].json).toHaveProperty('name', 'Honda');
	});

	it('should dispatch fipe/models and return models only', async () => {
		const ctx = createExecuteContext({
			resource: 'fipe',
			operation: 'models',
			httpResponse: {
				modelos: [{ codigo: 1, nome: 'Integra GS 1.8' }],
				anos: [{ codigo: '2024-1', nome: '2024 Gasolina' }],
			},
		});
		const [results] = await node.execute.call(ctx);
		expect(results).toHaveLength(1);
		expect(results[0].json).toHaveProperty('code', 1);
		expect(results[0].json).toHaveProperty('name', 'Integra GS 1.8');
	});

	it('should dispatch fipe/years and return year options', async () => {
		const ctx = createExecuteContext({
			resource: 'fipe',
			operation: 'years',
			httpResponse: [
				{ codigo: '2024-1', nome: '2024 Gasolina' },
				{ codigo: '2023-1', nome: '2023 Gasolina' },
			],
		});
		const [results] = await node.execute.call(ctx);
		expect(results).toHaveLength(2);
		expect(results[0].json).toHaveProperty('code', '2024-1');
	});

	it('should dispatch fipe/price and return single item', async () => {
		const ctx = createExecuteContext({
			resource: 'fipe',
			operation: 'price',
			httpResponse: {
				TipoVeiculo: 1,
				Valor: 'R$ 148.363,00',
				Marca: 'Honda',
				Modelo: 'Civic',
				AnoModelo: 2024,
				Combustivel: 'Gasolina',
				CodigoFipe: '014275-3',
				MesReferencia: 'março de 2026',
				SiglaCombustivel: 'G',
			},
		});
		const [[result]] = await node.execute.call(ctx);
		expect(result.json).toHaveProperty('price', 'R$ 148.363,00');
		expect(result.json).toHaveProperty('brand', 'Honda');
		expect(result.json).toHaveProperty('_meta');
	});

	it('should dispatch cpf/validate and return result', async () => {
		const ctx = createExecuteContext({ resource: 'cpf', operation: 'validate' });
		const [[result]] = await node.execute.call(ctx);
		expect(result.json).toEqual({
			valid: true,
			formatted: '529.982.247-25',
			input: '52998224725',
		});
	});

	it('should dispatch cnpj/query and return normalized data', async () => {
		const ctx = createExecuteContext({ resource: 'cnpj', operation: 'query' });
		const [[result]] = await node.execute.call(ctx);
		expect(result.json).toHaveProperty('razao_social', 'TESTE');
		expect(result.json).toHaveProperty('_meta');
	});

	it('should throw NodeOperationError for unknown resource/operation', async () => {
		const ctx = createExecuteContext({ resource: 'pix', operation: 'query' });
		await expect(node.execute.call(ctx)).rejects.toThrow(
			'Unknown resource/operation: pix/query',
		);
	});

	it('should use continueOnFail and return error in json', async () => {
		const ctx = createExecuteContext({
			resource: 'cnpj',
			operation: 'query',
			cnpj: '123',
			continueOnFail: true,
		});
		const [[result]] = await node.execute.call(ctx);
		expect(result.json).toHaveProperty('error', 'CNPJ must have 14 digits');
		expect(result.error).toBeInstanceOf(NodeOperationError);
		expect(result.pairedItem).toEqual({ item: 0 });
	});

	it('should wrap generic Error in NodeOperationError for continueOnFail', async () => {
		const ctx = createExecuteContext({
			resource: 'cnpj',
			operation: 'query',
			continueOnFail: true,
			httpError: new Error('Network timeout'),
		});
		const [[result]] = await node.execute.call(ctx);
		expect(result.json.error).toContain('No provider could fulfill the request');
		expect(result.error).toBeInstanceOf(NodeOperationError);
	});

	it('should propagate error context with itemIndex when present', async () => {
		const errorWithContext = new Error('API error') as Error & { context: Record<string, unknown> };
		errorWithContext.context = {};
		const ctx = createExecuteContext({
			resource: 'cnpj',
			operation: 'query',
			continueOnFail: false,
		});
		(ctx.getNodeParameter as jest.Mock).mockImplementation((name: string) => {
			if (name === 'resource') return 'cnpj';
			if (name === 'operation') return 'query';
			if (name === 'cnpj') return '11222333000181';
			if (name === 'includeRaw') return false;
			return undefined;
		});
		(ctx.helpers.httpRequest as jest.Mock).mockRejectedValue(errorWithContext);

		await expect(node.execute.call(ctx)).rejects.toHaveProperty(
			'context.itemIndex',
			0,
		);
	});

	it('should pass custom timeout to httpRequest', async () => {
		const ctx = createExecuteContext({
			resource: 'cnpj',
			operation: 'query',
		});
		// Override params to include custom timeout
		(ctx.getNodeParameter as jest.Mock).mockImplementation((name: string, _index: number, fallback?: unknown) => {
			const params: Record<string, unknown> = {
				resource: 'cnpj', operation: 'query', cnpj: '11222333000181',
				simplify: true, includeRaw: false, timeout: 5000,
			};
			return params[name] ?? fallback;
		});

		await node.execute.call(ctx);
		expect(ctx.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({ timeout: 5000 }),
		);
	});

	it('should use default timeout (10000) when not explicitly set', async () => {
		const ctx = createExecuteContext({ resource: 'cep', operation: 'query' });
		await node.execute.call(ctx);
		expect(ctx.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({ timeout: 10000 }),
		);
	});

	it('should process multiple items', async () => {
		const ctx = createExecuteContext({
			resource: 'cnpj',
			operation: 'validate',
			items: [{ json: {} }, { json: {} }],
		});
		const [results] = await node.execute.call(ctx);
		expect(results).toHaveLength(2);
		expect(results[0].pairedItem).toEqual({ item: 0 });
		expect(results[1].pairedItem).toEqual({ item: 1 });
	});
});
