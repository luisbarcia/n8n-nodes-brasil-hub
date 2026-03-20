import type { IPixParticipant } from '../../types';
import { safeStr } from '../../shared/utils';

/**
 * Normalizes a BrasilAPI PIX participants array.
 *
 * @param data - Raw array from `/api/pix/v1/participants`.
 * @returns Array of normalized PIX participant objects.
 */
export function normalizePixParticipants(data: unknown): IPixParticipant[] {
	if (!Array.isArray(data)) return [];
	return (data as unknown[])
		.filter((item) => item != null && typeof item === 'object')
		.map((item) => {
			const obj = item as Record<string, unknown>;
			return {
				ispb: safeStr(obj.ispb),
				cnpj: safeStr(obj.cnpj),
				name: safeStr(obj.nome),
				shortName: safeStr(obj.nome_reduzido),
				participationType: safeStr(obj.modalidade_participacao),
				type: safeStr(obj.tipo_participacao),
				startDate: safeStr(obj.inicio_operacao),
			};
		});
}
