import { normalizeDdd } from '../nodes/BrasilHub/resources/ddd/ddd.normalize';

const brasilApiFixture = {
	state: 'SP',
	cities: ['SÃO PAULO', 'GUARULHOS', 'OSASCO'],
};

describe('normalizeDdd', () => {
	it('should normalize BrasilAPI response', () => {
		const result = normalizeDdd(brasilApiFixture, 'brasilapi');
		expect(result).toEqual({
			state: 'SP',
			cities: ['SÃO PAULO', 'GUARULHOS', 'OSASCO'],
		});
	});

	it('should handle empty cities array', () => {
		const result = normalizeDdd({ state: 'AC', cities: [] }, 'brasilapi');
		expect(result.state).toBe('AC');
		expect(result.cities).toEqual([]);
	});

	it('should throw for unknown provider', () => {
		expect(() => normalizeDdd({}, 'unknown')).toThrow('Unknown DDD provider: unknown');
	});
});
