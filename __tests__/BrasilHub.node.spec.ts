import { BrasilHub } from '../nodes/BrasilHub/BrasilHub.node';

describe('BrasilHub node', () => {
	it('should have correct description metadata', () => {
		const node = new BrasilHub();
		expect(node.description.name).toBe('brasilHub');
		expect(node.description.displayName).toBe('Brasil Hub');
		expect(node.description.usableAsTool).toBe(true);
		expect(node.description.version).toBe(1);
	});

	it('should have resource property with all resource options', () => {
		const node = new BrasilHub();
		const resourceProp = node.description.properties.find((p) => p.name === 'resource');
		expect(resourceProp).toBeDefined();
		expect(resourceProp!.noDataExpression).toBe(true);
		const values = (resourceProp!.options as Array<{ value: string }>).map((o) => o.value);
		expect(values).toContain('banks');
		expect(values).toContain('cep');
		expect(values).toContain('cnpj');
		expect(values).toContain('cpf');
		expect(values).toContain('ddd');
		expect(values).toContain('feriados');
		expect(values).toContain('fipe');
		expect(values).toContain('ibge');
		expect(values).toContain('ncm');
		expect(values).toContain('pix');
		expect(values).toContain('fake');
		expect(values).toContain('cambio');
		expect(values).toContain('taxas');
	});

	it('should have no duplicate resource keys in allResources', () => {
		const node = new BrasilHub();
		const resourceProp = node.description.properties.find((p) => p.name === 'resource');
		const uiValues = (resourceProp!.options as Array<{ value: string }>).map((o) => o.value);
		const uniqueValues = new Set(uiValues);
		expect(uniqueValues.size).toBe(uiValues.length);
	});

	it('should have matching resource keys between UI options and operation descriptions', () => {
		const node = new BrasilHub();
		const resourceProp = node.description.properties.find((p) => p.name === 'resource');
		const uiValues = new Set((resourceProp!.options as Array<{ value: string }>).map((o) => o.value));
		const opProps = node.description.properties.filter((p) => p.name === 'operation');
		const opResources = new Set(
			opProps.map((p) => (p.displayOptions?.show?.resource as string[])?.[0]).filter(Boolean),
		);
		// Every UI resource must have an operation description
		for (const uiVal of uiValues) {
			expect(opResources.has(uiVal)).toBe(true);
		}
		// Every operation description must have a UI resource
		for (const opRes of opResources) {
			expect(uiValues.has(opRes)).toBe(true);
		}
	});

	it('should have operation properties for all resources', () => {
		const node = new BrasilHub();
		const ops = node.description.properties.filter((p) => p.name === 'operation');
		expect(ops.length).toBe(13);
		for (const op of ops) {
			expect(op.noDataExpression).toBe(true);
			const values = op.options as Array<{ value: string; action: string }>;
			for (const v of values) {
				expect(v.action).toBeDefined();
			}
		}
	});

	it('should have timeout property with correct defaults', () => {
		const node = new BrasilHub();
		const timeoutProp = node.description.properties.find((p) => p.name === 'timeout');
		expect(timeoutProp).toBeDefined();
		expect(timeoutProp!.type).toBe('number');
		expect(timeoutProp!.default).toBe(10000);
		expect(timeoutProp!.displayOptions).toBeUndefined();
	});

	it('should have a router handler for every resource/operation pair in the UI', async () => {
		const node = new BrasilHub();
		const resourceProp = node.description.properties.find((p) => p.name === 'resource');
		const resources = (resourceProp!.options as Array<{ value: string }>).map((o) => o.value);

		for (const resource of resources) {
			const opProp = node.description.properties.find(
				(p) => p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes(resource),
			);
			expect(opProp).toBeDefined();
			const operations = (opProp!.options as Array<{ value: string }>).map((o) => o.value);

			for (const operation of operations) {
				const params: Record<string, unknown> = {
					resource,
					operation,
					cnpj: '11222333000181',
					cep: '01001000',
					cpf: '52998224725',
					bankCode: '1',
					currencyCode: 'USD',
					date: '2024-01-15',
					ddd: '11',
					vehicleType: 'carros',
					brandCode: '59',
					modelCode: '4828',
					yearCode: '2024-1',
					referenceTable: 0,
					rateCode: 'Selic',
					year: 2026,
					uf: 'SP',
					ncmCode: '8504.40.10',
					searchTerm: 'computador',
					ispb: '00000000',
					filterYear: 0,
					quantity: 1,
					formatted: true,
					gender: 'any',
					includeRaw: false,
				};
				// Resource-specific mock responses
				let mockResponse: unknown = {};
				if (resource === 'pix') {
					mockResponse = [{ ispb: '00000000', nome: 'BANCO', nome_reduzido: 'BCO', cnpj: '', modalidade_participacao: '', tipo_participacao: '', inicio_operacao: '' }];
				} else if (resource === 'cambio' && operation === 'rate') {
					mockResponse = { cotacoes: [{ cotacao_compra: 5.0, cotacao_venda: 5.01, paridade_compra: 1, paridade_venda: 1, data_hora_cotacao: '2024-01-15 13:00:00', tipo_boletim: 'FECHAMENTO PTAX' }], moeda: 'USD', data: '2024-01-15' };
				} else if (resource === 'cambio' && operation === 'currencies') {
					mockResponse = [{ simbolo: 'USD', nome: 'Dolar', tipo_moeda: 'A' }];
				} else if (resource === 'taxas' && operation === 'list') {
					mockResponse = [{ nome: 'Selic', valor: 14.75 }];
				} else if (resource === 'taxas' && operation === 'query') {
					mockResponse = { nome: 'Selic', valor: 14.75 };
				}
				const ctx = {
					getInputData: jest.fn(() => [{ json: {} }]),
					getNodeParameter: jest.fn((name: string, _i: number, fb?: unknown) => params[name] ?? fb),
					getNode: jest.fn(() => ({ name: 'Brasil Hub' })),
					continueOnFail: jest.fn(() => false),
					helpers: { httpRequest: jest.fn().mockResolvedValue(mockResponse) },
				};
				// Should not throw "Unknown resource/operation"
				await expect(
					node.execute.call(ctx as never),
				).resolves.not.toThrow();
			}
		}
	});
});
