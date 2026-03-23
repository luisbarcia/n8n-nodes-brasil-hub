import type { IResourceDefinition } from '../../types';
import { fakeDescription } from './fake.description';
import { fakeCpf, fakeCnpj, fakePerson, fakeCompany } from './fake.execute';

/** Resource definition for the fake resource module. */
export const fakeResource: IResourceDefinition = {
	resource: 'fake',
	description: fakeDescription,
	operations: { cpf: fakeCpf, cnpj: fakeCnpj, person: fakePerson, company: fakeCompany },
};
