import type { IResourceDefinition } from '../../types';
import { fakeDescription } from './fake.description';
import { fakeCpf, fakeCnpj, fakePerson, fakeCompany } from './fake.execute';

export const fakeResource: IResourceDefinition = {
	resource: 'fake',
	description: fakeDescription,
	operations: { cpf: fakeCpf, cnpj: fakeCnpj, person: fakePerson, company: fakeCompany },
};
