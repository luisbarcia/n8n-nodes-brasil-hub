/**
 * Pure generators for Brazilian fake data. No external dependencies.
 * All functions are deterministic given a seed or use Math.random().
 */

import {
	MALE_FIRST_NAMES, FEMALE_FIRST_NAMES, LAST_NAMES,
	STREET_PREFIXES, STREET_NAMES, NEIGHBORHOODS, STATES,
	COMPANY_SUFFIXES, COMPANY_ACTIVITIES, EMAIL_DOMAINS, COMPANY_EMAIL_DOMAINS,
} from './fake.data';

/** Picks a random element from an array. */
function pick<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

/** Generates a random integer between min (inclusive) and max (inclusive). */
function randInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Generates N random digits as a string. */
function randDigits(n: number): string {
	let result = '';
	for (let i = 0; i < n; i++) {
		result += String(Math.floor(Math.random() * 10));
	}
	return result;
}

/** Removes accents and special characters, lowercases. */
function simplify(str: string): string {
	return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '.');
}

// ─── CPF Generator ──────────────────────────────────────────────

/**
 * Generates a valid CPF using the official Receita Federal checksum algorithm.
 *
 * @param formatted - When true, returns `XXX.XXX.XXX-XX`. Default: unformatted 11 digits.
 * @returns A checksum-correct CPF string.
 */
export function generateCpf(formatted = false): string {
	const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));

	// First check digit
	let sum = 0;
	for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
	let rest = (sum * 10) % 11;
	digits.push(rest >= 10 ? 0 : rest);

	// Second check digit
	sum = 0;
	for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
	rest = (sum * 10) % 11;
	digits.push(rest >= 10 ? 0 : rest);

	const cpf = digits.join('');
	if (formatted) {
		return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
	}
	return cpf;
}

// ─── CNPJ Generator ─────────────────────────────────────────────

/**
 * Generates a valid CNPJ using the official Receita Federal checksum algorithm.
 * Always uses branch `0001` (headquarters).
 *
 * @param formatted - When true, returns `XX.XXX.XXX/XXXX-XX`. Default: unformatted 14 digits.
 * @returns A checksum-correct CNPJ string.
 */
export function generateCnpj(formatted = false): string {
	const base = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10));
	base.push(0, 0, 0, 1); // branch = 0001

	// First check digit
	const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
	let sum = 0;
	for (let i = 0; i < 12; i++) sum += base[i] * weights1[i];
	let rest = sum % 11;
	base.push(rest < 2 ? 0 : 11 - rest);

	// Second check digit
	const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
	sum = 0;
	for (let i = 0; i < 13; i++) sum += base[i] * weights2[i];
	rest = sum % 11;
	base.push(rest < 2 ? 0 : 11 - rest);

	const cnpj = base.join('');
	if (formatted) {
		return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
	}
	return cnpj;
}

// ─── RG Generator ───────────────────────────────────────────────

/**
 * Generates a fake RG number in SP/RJ format.
 *
 * @returns Formatted RG string (XX.XXX.XXX-X).
 */
export function generateRg(): string {
	return `${randDigits(2)}.${randDigits(3)}.${randDigits(3)}-${randDigits(1)}`;
}

// ─── Address Generator ──────────────────────────────────────────

/** Fake Brazilian address. City is always the state capital; CEP prefix matches the state. */
export interface IFakeAddress {
	/** Street with prefix (e.g. "Rua das Flores", "Avenida Brasil"). */
	street: string;
	/** Street number (1-9999). */
	number: string;
	/** Apartment/suite complement (empty ~60% of the time). */
	complement: string;
	/** Neighborhood name. */
	neighborhood: string;
	/** City name (always the state capital). */
	city: string;
	/** Two-letter state abbreviation (e.g. "SP", "RJ"). */
	state: string;
	/** 8-digit CEP (unformatted, prefix matches the state). */
	cep: string;
}

/**
 * Generates a fake Brazilian address with consistent state/city/CEP.
 *
 * @returns Address object where city is the state capital and CEP prefix matches the state.
 */
export function generateAddress(): IFakeAddress {
	const stateInfo = pick(STATES);
	const hasComplement = Math.random() > 0.6;
	return {
		street: `${pick(STREET_PREFIXES)} ${pick(STREET_NAMES)}`,
		number: String(randInt(1, 9999)),
		complement: hasComplement ? `Apto ${randInt(1, 500)}` : '',
		neighborhood: pick(NEIGHBORHOODS),
		city: stateInfo.capital,
		state: stateInfo.uf,
		cep: `${stateInfo.cepPrefix}${randDigits(3)}`,
	};
}

// ─── Person Generator ───────────────────────────────────────────

/** Fake Brazilian person profile. All documents are checksum-correct but fictitious. */
export interface IFakePerson {
	/** Full name (first + two last names). */
	name: string;
	/** Formatted CPF (XXX.XXX.XXX-XX), checksum-correct. */
	cpf: string;
	/** Formatted RG (XX.XXX.XXX-X). */
	rg: string;
	/** Birth date in ISO format (YYYY-MM-DD). */
	birthDate: string;
	/** Age in years (accounts for birthday month/day). */
	age: number;
	/** Gender: "M" or "F". */
	gender: string;
	/** Mother's full name (female first name + person's first last name). */
	motherName: string;
	/** Email with accent-free slug and Brazilian domain. */
	email: string;
	/** Mobile phone with valid DDD matching the address state. */
	phone: string;
	/** Full Brazilian address. */
	address: IFakeAddress;
}

/**
 * Generates a fake Brazilian person profile with consistent data
 * (phone DDD matches state, CEP prefix matches state, age matches birthDate).
 *
 * @param gender - Force "M" or "F". Omit for random.
 * @returns Complete person profile.
 */
export function generatePerson(gender?: 'M' | 'F'): IFakePerson {
	const g = gender ?? (Math.random() > 0.5 ? 'M' : 'F');
	const firstName = g === 'M' ? pick(MALE_FIRST_NAMES) : pick(FEMALE_FIRST_NAMES);
	const lastName1 = pick(LAST_NAMES);
	const lastName2 = pick(LAST_NAMES);
	const fullName = `${firstName} ${lastName1} ${lastName2}`;

	const motherFirst = pick(FEMALE_FIRST_NAMES);
	const motherName = `${motherFirst} ${lastName1}`;

	const today = new Date();
	const currentYear = today.getFullYear();
	const birthYear = randInt(currentYear - 80, currentYear - 18);
	const birthMonth = randInt(1, 12);
	const birthDay = randInt(1, 28);
	const birthDate = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
	let age = currentYear - birthYear;
	if (today.getMonth() + 1 < birthMonth || (today.getMonth() + 1 === birthMonth && today.getDate() < birthDay)) {
		age--;
	}

	const address = generateAddress();
	const emailName = simplify(`${firstName}.${lastName2}${randInt(1, 99)}`);
	const ddd = STATES.find((s) => s.uf === address.state)?.ddd ?? '11';

	return {
		name: fullName,
		cpf: generateCpf(true),
		rg: generateRg(),
		birthDate,
		age,
		gender: g,
		motherName,
		email: `${emailName}@${pick(EMAIL_DOMAINS)}`,
		phone: `(${ddd}) 9${randDigits(4)}-${randDigits(4)}`,
		address,
	};
}

// ─── Company Generator ──────────────────────────────────────────

/** Fake Brazilian company profile. CNPJ is checksum-correct but fictitious. */
export interface IFakeCompany {
	/** Official company name (razão social). */
	razaoSocial: string;
	/** Trade name (nome fantasia). */
	nomeFantasia: string;
	/** Formatted CNPJ (XX.XXX.XXX/XXXX-XX), checksum-correct. */
	cnpj: string;
	/** State registration number (inscrição estadual). */
	inscricaoEstadual: string;
	/** Company opening date in ISO format (YYYY-MM-DD). */
	openDate: string;
	/** Contact email with company domain. */
	email: string;
	/** Landline phone with valid DDD matching the address state. */
	phone: string;
	/** Primary economic activity description. */
	activity: string;
	/** Full Brazilian address. */
	address: IFakeAddress;
}

/**
 * Generates a fake Brazilian company profile with consistent data
 * (phone DDD matches state, CNPJ is checksum-correct).
 *
 * @returns Complete company profile.
 */
export function generateCompany(): IFakeCompany {
	const lastName1 = pick(LAST_NAMES);
	const lastName2 = pick(LAST_NAMES);
	const suffix = pick(COMPANY_SUFFIXES);
	const activity = pick(COMPANY_ACTIVITIES);

	const words = activity.split(' ');
	const fantasia = words.length > 1 ? `${lastName1} ${words[0]}` : `${lastName1} ${activity}`;

	const currentYear = new Date().getFullYear();
	const openYear = randInt(1990, currentYear - 1);
	const openMonth = randInt(1, 12);
	const openDay = randInt(1, 28);
	const openDate = `${openYear}-${String(openMonth).padStart(2, '0')}-${String(openDay).padStart(2, '0')}`;

	const address = generateAddress();
	const ddd = STATES.find((s) => s.uf === address.state)?.ddd ?? '11';
	const emailSlug = simplify(lastName1);

	return {
		razaoSocial: `${lastName1} & ${lastName2} ${activity.split(' ').slice(0, 2).join(' ')} ${suffix}`,
		nomeFantasia: fantasia,
		cnpj: generateCnpj(true),
		inscricaoEstadual: `${randDigits(3)}.${randDigits(3)}.${randDigits(3)}.${randDigits(3)}`,
		openDate,
		email: `contato@${emailSlug}.${pick(COMPANY_EMAIL_DOMAINS)}`,
		phone: `(${ddd}) ${randDigits(4)}-${randDigits(4)}`,
		activity,
		address,
	};
}
