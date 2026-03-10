/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/__tests__'],
	testMatch: ['**/*.spec.ts'],
	moduleNameMapper: {
		// isolated-vm is a native C++ addon required by n8n-workflow's expression
		// runtime. It is not used by this node and fails to compile on Node < 22.
		// Stub it so tests run without the native binary.
		'isolated-vm': '<rootDir>/__mocks__/isolated-vm.js',
	},
};
