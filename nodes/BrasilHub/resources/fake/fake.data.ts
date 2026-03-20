/** Embedded Brazilian data lists for fake profile generation (~5KB). */

export const MALE_FIRST_NAMES = [
	'Agostinho', 'Alexandre', 'Anderson', 'André', 'Antonio', 'Arthur', 'Benedito', 'Benjamin',
	'Bernardo', 'Bruno', 'Carlos', 'Cauã', 'César', 'Daniel', 'Davi', 'Diego', 'Eduardo',
	'Elias', 'Emanuel', 'Enzo', 'Fabiano', 'Felipe', 'Fernando', 'Francisco', 'Gabriel',
	'Geraldo', 'Guilherme', 'Gustavo', 'Heitor', 'Henrique', 'Hugo', 'Igor', 'Isaac',
	'João', 'Jorge', 'José', 'Juan', 'Julio', 'Leandro', 'Leonardo', 'Lorenzo', 'Lucas',
	'Luciano', 'Luis', 'Marcelo', 'Marco', 'Marcos', 'Matheus', 'Miguel', 'Nathan',
	'Nicolas', 'Noah', 'Otávio', 'Paulo', 'Pedro', 'Rafael', 'Raul', 'Renato', 'Ricardo',
	'Rodrigo', 'Samuel', 'Santiago', 'Sérgio', 'Thiago', 'Thomas', 'Valentim', 'Vicente',
	'Vinicius', 'Vitor', 'Wagner',
];

export const FEMALE_FIRST_NAMES = [
	'Adriana', 'Agatha', 'Alice', 'Aline', 'Amanda', 'Ana', 'Beatriz', 'Bianca', 'Bruna',
	'Camila', 'Carla', 'Carolina', 'Cecília', 'Clara', 'Cristina', 'Daniela', 'Débora',
	'Eduarda', 'Elisa', 'Emanuelle', 'Eloá', 'Fernanda', 'Gabriela', 'Giovanna', 'Helena',
	'Heloísa', 'Isabel', 'Isabela', 'Isadora', 'Jade', 'Juliana', 'Lara', 'Larissa',
	'Laura', 'Letícia', 'Lívia', 'Lorena', 'Luana', 'Luísa', 'Manuela', 'Mariana',
	'Maria', 'Marina', 'Melissa', 'Mirella', 'Natália', 'Nicole', 'Patrícia', 'Paula',
	'Rafaela', 'Raquel', 'Rebeca', 'Regina', 'Renata', 'Rita', 'Roberta', 'Rosa',
	'Sabrina', 'Sara', 'Silvia', 'Sofia', 'Stella', 'Tatiana', 'Valentina', 'Vanessa',
	'Vera', 'Vitória', 'Viviane', 'Yasmin',
];

export const LAST_NAMES = [
	'Almeida', 'Alves', 'Amaral', 'Andrade', 'Araújo', 'Azevedo', 'Barbosa', 'Barros',
	'Batista', 'Borges', 'Braga', 'Brito', 'Campos', 'Cardoso', 'Carvalho', 'Castro',
	'Cavalcanti', 'Coelho', 'Correia', 'Costa', 'Cruz', 'Cunha', 'Dias', 'Duarte',
	'Farias', 'Fernandes', 'Ferreira', 'Figueiredo', 'Freitas', 'Garcia', 'Gomes',
	'Gonçalves', 'Guimarães', 'Jesus', 'Lima', 'Lopes', 'Machado', 'Martins', 'Medeiros',
	'Melo', 'Mendes', 'Miranda', 'Monteiro', 'Moraes', 'Moreira', 'Nascimento', 'Neves',
	'Nogueira', 'Nunes', 'Oliveira', 'Pereira', 'Pinto', 'Ramos', 'Reis', 'Ribeiro',
	'Rocha', 'Rodrigues', 'Sampaio', 'Santana', 'Santos', 'Silva', 'Soares', 'Souza',
	'Tavares', 'Teixeira', 'Vieira',
];

export const STREET_PREFIXES = [
	'Rua', 'Avenida', 'Travessa', 'Alameda', 'Praça',
];

export const STREET_NAMES = [
	'das Flores', 'dos Bandeirantes', 'Brasil', 'São Paulo', 'da Paz', 'das Acácias',
	'do Comércio', 'Principal', 'XV de Novembro', 'Sete de Setembro', 'da Liberdade',
	'Santos Dumont', 'Tiradentes', 'Rio Branco', 'Getúlio Vargas', 'Dom Pedro I',
	'da República', 'Beira Mar', 'das Palmeiras', 'do Sol', 'da Esperança',
	'Presidente Kennedy', 'Marechal Deodoro', 'Barão do Rio Branco', 'Rui Barbosa',
	'Castro Alves', 'Machado de Assis', 'Olavo Bilac', 'José de Alencar', 'Gonçalves Dias',
];

export const NEIGHBORHOODS = [
	'Centro', 'Jardim América', 'Vila Nova', 'Santa Cruz', 'Boa Vista', 'São José',
	'Liberdade', 'Consolação', 'Bela Vista', 'Moema', 'Pinheiros', 'Vila Mariana',
	'Copacabana', 'Botafogo', 'Tijuca', 'Santo Amaro', 'Saúde', 'Graça',
	'Boa Viagem', 'Aldeota', 'Barra', 'Pituba', 'Funcionários', 'Setor Bueno',
	'Água Verde', 'Batel', 'Moinhos de Vento', 'Cidade Baixa',
];

/** State abbreviation → capital city + CEP prefix (first 5 digits). */
export const STATES: Array<{ uf: string; capital: string; cepPrefix: string; ddd: string }> = [
	{ uf: 'AC', capital: 'Rio Branco', cepPrefix: '69900', ddd: '68' },
	{ uf: 'AL', capital: 'Maceió', cepPrefix: '57000', ddd: '82' },
	{ uf: 'AM', capital: 'Manaus', cepPrefix: '69000', ddd: '92' },
	{ uf: 'AP', capital: 'Macapá', cepPrefix: '68900', ddd: '96' },
	{ uf: 'BA', capital: 'Salvador', cepPrefix: '40000', ddd: '71' },
	{ uf: 'CE', capital: 'Fortaleza', cepPrefix: '60000', ddd: '85' },
	{ uf: 'DF', capital: 'Brasília', cepPrefix: '70000', ddd: '61' },
	{ uf: 'ES', capital: 'Vitória', cepPrefix: '29000', ddd: '27' },
	{ uf: 'GO', capital: 'Goiânia', cepPrefix: '74000', ddd: '62' },
	{ uf: 'MA', capital: 'São Luís', cepPrefix: '65000', ddd: '98' },
	{ uf: 'MG', capital: 'Belo Horizonte', cepPrefix: '30000', ddd: '31' },
	{ uf: 'MS', capital: 'Campo Grande', cepPrefix: '79000', ddd: '67' },
	{ uf: 'MT', capital: 'Cuiabá', cepPrefix: '78000', ddd: '65' },
	{ uf: 'PA', capital: 'Belém', cepPrefix: '66000', ddd: '91' },
	{ uf: 'PB', capital: 'João Pessoa', cepPrefix: '58000', ddd: '83' },
	{ uf: 'PE', capital: 'Recife', cepPrefix: '50000', ddd: '81' },
	{ uf: 'PI', capital: 'Teresina', cepPrefix: '64000', ddd: '86' },
	{ uf: 'PR', capital: 'Curitiba', cepPrefix: '80000', ddd: '41' },
	{ uf: 'RJ', capital: 'Rio de Janeiro', cepPrefix: '20000', ddd: '21' },
	{ uf: 'RN', capital: 'Natal', cepPrefix: '59000', ddd: '84' },
	{ uf: 'RO', capital: 'Porto Velho', cepPrefix: '76800', ddd: '69' },
	{ uf: 'RR', capital: 'Boa Vista', cepPrefix: '69300', ddd: '95' },
	{ uf: 'RS', capital: 'Porto Alegre', cepPrefix: '90000', ddd: '51' },
	{ uf: 'SC', capital: 'Florianópolis', cepPrefix: '88000', ddd: '48' },
	{ uf: 'SE', capital: 'Aracaju', cepPrefix: '49000', ddd: '79' },
	{ uf: 'SP', capital: 'São Paulo', cepPrefix: '01000', ddd: '11' },
	{ uf: 'TO', capital: 'Palmas', cepPrefix: '77000', ddd: '63' },
];

export const COMPANY_SUFFIXES = [
	'Ltda', 'S.A.', 'ME', 'EPP', 'EIRELI', 'Ltda ME', 'S/A',
];

export const COMPANY_ACTIVITIES = [
	'Desenvolvimento de software', 'Consultoria empresarial', 'Comércio varejista',
	'Serviços de alimentação', 'Transporte rodoviário', 'Construção civil',
	'Serviços de saúde', 'Educação e ensino', 'Serviços financeiros',
	'Comércio eletrônico', 'Marketing digital', 'Logística e distribuição',
	'Serviços de engenharia', 'Agropecuária', 'Indústria têxtil',
	'Tecnologia da informação', 'Comunicação e mídia', 'Serviços jurídicos',
	'Contabilidade e auditoria', 'Hotelaria e turismo',
];

export const EMAIL_DOMAINS = [
	'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.br', 'uol.com.br',
	'terra.com.br', 'bol.com.br', 'ig.com.br', 'globo.com', 'live.com',
];

export const COMPANY_EMAIL_DOMAINS = [
	'empresa.com.br', 'negocio.com.br', 'tech.com.br', 'group.com.br', 'corp.com.br',
];
