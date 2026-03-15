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
