// Stub for isolated-vm native addon.
// n8n-workflow depends on isolated-vm via @n8n/expression-runtime,
// but this community node never exercises that code path.
// This stub allows tests to run without compiling the C++ addon.
module.exports = {};
