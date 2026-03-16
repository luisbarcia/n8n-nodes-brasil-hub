import { normalizeFeriados } from '../nodes/BrasilHub/resources/feriados/feriados.normalize';

// Real fixture from BrasilAPI /api/feriados/v1/2026
const brasilApiFixture = [
	{ date: '2026-01-01', name: 'Confraternização mundial', type: 'national' },
	{ date: '2026-02-17', name: 'Carnaval', type: 'national' },
	{ date: '2026-04-03', name: 'Sexta-feira Santa', type: 'national' },
];

// Real fixture from Nager.Date /api/v3/PublicHolidays/2026/BR
const nagerFixture = [
	{
		date: '2026-01-01',
		localName: 'Confraternização Universal',
		name: 'New Year\'s Day',
		countryCode: 'BR',
		fixed: false,
		global: true,
		counties: null,
		launchYear: null,
		types: ['Public'],
	},
	{
		date: '2026-02-16',
		localName: 'Carnaval',
		name: 'Carnival',
		countryCode: 'BR',
		fixed: false,
		global: true,
		counties: null,
		launchYear: null,
		types: ['Bank', 'Optional'],
	},
];

describe('normalizeFeriados', () => {
	describe('BrasilAPI provider', () => {
		it('should normalize BrasilAPI response', () => {
			const result = normalizeFeriados(brasilApiFixture, 'brasilapi');
			expect(result).toHaveLength(3);
			expect(result[0]).toEqual({
				date: '2026-01-01',
				name: 'Confraternização mundial',
				type: 'national',
			});
		});

		it('should handle empty array', () => {
			expect(normalizeFeriados([], 'brasilapi')).toEqual([]);
		});

		it('should handle null/undefined input', () => {
			expect(normalizeFeriados(null, 'brasilapi')).toEqual([]);
			expect(normalizeFeriados(undefined, 'brasilapi')).toEqual([]);
		});

		it('should handle non-array input', () => {
			expect(normalizeFeriados('string', 'brasilapi')).toEqual([]);
			expect(normalizeFeriados({}, 'brasilapi')).toEqual([]);
		});

		it('should handle entries with missing fields', () => {
			const result = normalizeFeriados([{ date: '2026-01-01' }], 'brasilapi');
			expect(result[0]).toEqual({ date: '2026-01-01', name: '', type: '' });
		});

		it('should filter out null/undefined items in array', () => {
			const result = normalizeFeriados([null, brasilApiFixture[0], undefined], 'brasilapi');
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('Confraternização mundial');
		});
	});

	describe('Nager.Date provider', () => {
		it('should normalize Nager.Date response using localName for name', () => {
			const result = normalizeFeriados(nagerFixture, 'nagerdate');
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				date: '2026-01-01',
				name: 'Confraternização Universal',
				type: 'Public',
			});
		});

		it('should join multiple types with comma', () => {
			const result = normalizeFeriados(nagerFixture, 'nagerdate');
			expect(result[1].type).toBe('Bank, Optional');
		});

		it('should handle empty types array', () => {
			const result = normalizeFeriados(
				[{ ...nagerFixture[0], types: [] }],
				'nagerdate',
			);
			expect(result[0].type).toBe('');
		});

		it('should handle null/undefined input', () => {
			expect(normalizeFeriados(null, 'nagerdate')).toEqual([]);
		});

		it('should filter out null/undefined items', () => {
			const result = normalizeFeriados([null, nagerFixture[0]], 'nagerdate');
			expect(result).toHaveLength(1);
		});

		it('should fall back to name when localName is missing', () => {
			const result = normalizeFeriados(
				[{ date: '2026-01-01', name: 'New Year', types: ['Public'] }],
				'nagerdate',
			);
			expect(result[0].name).toBe('New Year');
		});
	});

	describe('Unknown provider', () => {
		it('should throw for unknown provider', () => {
			expect(() => normalizeFeriados([], 'unknown')).toThrow('Unknown feriados provider: unknown');
		});
	});
});
