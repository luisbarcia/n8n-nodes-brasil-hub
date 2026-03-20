import { normalizePixParticipants } from '../nodes/BrasilHub/resources/pix/pix.normalize';

const participantsFixture = [
	{
		ispb: '00000000',
		cnpj: '00000000000191',
		nome: 'BANCO DO BRASIL S.A.',
		nome_reduzido: 'BCO DO BRASIL S.A.',
		modalidade_participacao: 'PDCT',
		tipo_participacao: 'DRCT',
		inicio_operacao: '2020-11-03T09:30:00.000Z',
	},
	{
		ispb: '00360305',
		cnpj: '60746948000112',
		nome: 'CAIXA ECONOMICA FEDERAL',
		nome_reduzido: 'CAIXA ECONOMICA FEDERAL',
		modalidade_participacao: 'PDCT',
		tipo_participacao: 'DRCT',
		inicio_operacao: '2020-11-03T09:30:00.000Z',
	},
];

describe('normalizePixParticipants', () => {
	it('should normalize BrasilAPI PIX participants array', () => {
		const result = normalizePixParticipants(participantsFixture);
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			ispb: '00000000',
			cnpj: '00000000000191',
			name: 'BANCO DO BRASIL S.A.',
			shortName: 'BCO DO BRASIL S.A.',
			participationType: 'PDCT',
			type: 'DRCT',
			startDate: '2020-11-03T09:30:00.000Z',
		});
	});

	it('should handle empty array', () => {
		expect(normalizePixParticipants([])).toEqual([]);
	});

	it('should handle non-array input', () => {
		expect(normalizePixParticipants(null)).toEqual([]);
		expect(normalizePixParticipants(undefined)).toEqual([]);
		expect(normalizePixParticipants('string')).toEqual([]);
		expect(normalizePixParticipants(42)).toEqual([]);
	});

	it('should handle entries with missing fields', () => {
		const result = normalizePixParticipants([{ ispb: '12345678' }]);
		expect(result[0]).toEqual({
			ispb: '12345678',
			cnpj: '',
			name: '',
			shortName: '',
			participationType: '',
			type: '',
			startDate: '',
		});
	});

	it('should filter out null/undefined entries', () => {
		const result = normalizePixParticipants([null, participantsFixture[0], undefined]);
		expect(result).toHaveLength(1);
		expect(result[0].ispb).toBe('00000000');
	});

	it('should coerce non-string fields to empty string', () => {
		const result = normalizePixParticipants([{ ispb: 12345678, nome: true }]);
		expect(result[0].ispb).toBe('12345678');
		expect(result[0].name).toBe('true');
	});
});
