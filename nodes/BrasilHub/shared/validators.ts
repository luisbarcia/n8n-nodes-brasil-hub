import type { IValidationResult } from '../types';

function stripNonDigits(value: string): string {
	return value.replace(/\D/g, '');
}

function formatCnpj(digits: string): string {
	return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

function formatCep(digits: string): string {
	return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

export function validateCnpj(cnpj: string): IValidationResult {
	const input = cnpj;
	const digits = stripNonDigits(cnpj);

	if (digits.length !== 14) {
		return { valid: false, formatted: '', input };
	}

	if (/^(\d)\1{13}$/.test(digits)) {
		return { valid: false, formatted: '', input };
	}

	const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
	const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

	let sum = 0;
	for (let i = 0; i < 12; i++) {
		sum += parseInt(digits[i], 10) * weights1[i];
	}
	let remainder = sum % 11;
	const check1 = remainder < 2 ? 0 : 11 - remainder;

	if (parseInt(digits[12], 10) !== check1) {
		return { valid: false, formatted: '', input };
	}

	sum = 0;
	for (let i = 0; i < 13; i++) {
		sum += parseInt(digits[i], 10) * weights2[i];
	}
	remainder = sum % 11;
	const check2 = remainder < 2 ? 0 : 11 - remainder;

	if (parseInt(digits[13], 10) !== check2) {
		return { valid: false, formatted: '', input };
	}

	return { valid: true, formatted: formatCnpj(digits), input };
}

export function validateCep(cep: string): IValidationResult {
	const input = cep;
	const digits = stripNonDigits(cep);

	if (digits.length !== 8) {
		return { valid: false, formatted: '', input };
	}

	if (/^0{8}$/.test(digits)) {
		return { valid: false, formatted: '', input };
	}

	return { valid: true, formatted: formatCep(digits), input };
}

export function sanitizeCnpj(cnpj: string): string {
	return stripNonDigits(cnpj);
}

export function sanitizeCep(cep: string): string {
	return stripNonDigits(cep);
}
