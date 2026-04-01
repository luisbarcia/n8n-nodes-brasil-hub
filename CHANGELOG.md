# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.2](https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v1.4.1...v1.4.2) (2026-04-01)


### Fixed

* add response validation to fallback engine (Ghost CNPJ + 404 short-circuit) ([#178](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/178)) ([84413c5](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/84413c5aed27a5152d30ff8d59d7c6b834f3d679))
* address pre-ship audit and docs audit findings ([#175](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/175)) ([21bf919](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/21bf9192b13edcd17f0585553dd71a94e4a6d2c1))
* replace Math.random with crypto.randomInt in fake generators ([#145](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/145)) ([9830224](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/9830224c7461e47c80a22b2b702a3ecca309d27d))
* resolve 16 SonarCloud issues (1 critical, 15 minor) ([#143](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/143)) ([50d42a3](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/50d42a3b5f952edfb47a593eb17d1ce210e561e4))


### Documentation

* fix 9 documentation audit findings ([#166](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/166)) ([972c2e8](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/972c2e8c3bc58ca532731d63bfc8a5a41536dc5e))
* update test counts and changelog for v1.4.2 pre-release ([#179](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/179)) ([dff6cdc](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/dff6cdc18d646ccd5d1c3394319f2cb5a9f39e0b))

## [Unreleased]

### Fixed

* add response validation to fallback engine — fixes Ghost CNPJ (error-shaped HTTP 200 responses now trigger fallback) and FIPE silent garbage (error objects now throw) ([#176](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/176)) ([#178](https://github.com/luisbarcia/n8n-nodes-brasil-hub/pull/178))
* add 404 short-circuit to fallback engine — stops chain immediately for "entity not found" instead of trying all providers ([#176](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/176))
* add encodeURIComponent to CNPJ, CEP, DDD URL construction for defense-in-depth ([#175](https://github.com/luisbarcia/n8n-nodes-brasil-hub/pull/175))
* address 6 pre-ship audit findings: execute-helpers direct tests, mutation killers, strengthened assertions, structural router test ([#171](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/171)) ([#175](https://github.com/luisbarcia/n8n-nodes-brasil-hub/pull/175))
* replace Math.random with crypto.randomInt in fake generators ([#145](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/145)) ([9830224](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/9830224))
* resolve 16 SonarCloud issues (1 critical, 15 minor) ([#143](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/143)) ([50d42a3](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/50d42a3))
* remove docs-arsenal spec from wrong project ([61752d1](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/61752d1))

### Changed

* refactor: extract Facade and Strategy helpers to reduce execute/normalize boilerplate ([4b9b52c](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/4b9b52c))

### Documentation

* fix stale test counts, factual errors, and comparison article across 8+ docs ([#171](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/171), [#172](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/172), [#174](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/174)) ([#175](https://github.com/luisbarcia/n8n-nodes-brasil-hub/pull/175))
* add docs/articles and PROJECT_INDEX to Living Docs table in CLAUDE.md
* migrate @throws tags from JSDoc to TSDoc format ([4e6e318](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/4e6e318))
* add NF-e resource design spec and update planning files ([bafdeba](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/bafdeba))
* add docs-arsenal plugin spec (feature-forge output) ([73e1f41](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/73e1f41))

## [1.4.1](https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v1.4.0...v1.4.1) (2026-03-23)


### Fixed

* add Câmbio and Taxas FAQ entries to README ([#142](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/142)) ([d1df769](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/d1df76970d1ecaed962cc1efb13a42a9c2403f7b))


### Documentation

* update living docs for v1.4.0 (13 resources, 28 ops, 25 providers) ([#140](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/140)) ([5ee6d6f](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/5ee6d6fc0a5256523e34a44f008074e967a7c95c))

## [1.4.0](https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v1.3.1...v1.4.0) (2026-03-23)


### Added

* add Bank resource with Query and List operations for v0.3.0 ([#51](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/51)) ([1c9f503](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/1c9f50340cee72aa237cf18d2b3bbeb169ce7460))
* add CNPJ and CEP normalizers for all providers with tests ([f0e6493](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/f0e649361f3ddf474af99bceb3149342a4935c8a))
* add CNPJ and CEP resource descriptions, execute handlers, and tests ([4a398da](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/4a398da115912eef17b78d259e55d210e63d9f7f))
* add CNPJ Output Mode (Full + AI Summary) — v0.11.0 ([#84](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/84)) ([a452772](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/a452772c1994616ac327601411f8913f684e0d35))
* add configurable provider order for 6 resources — v0.13.0 ([#88](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/88)) ([3b5a070](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/3b5a0702132da2ce760849cab45cf0f045c40105))
* add configurable timeout parameter — v0.10.0 ([#81](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/81)) ([2187f18](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/2187f1886c8641110191f4edee59fb1ae0d05e26))
* add CPF validate resource + router refactor for v0.2.0 ([#50](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/50)) ([b83fbd4](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/b83fbd426b21930ec434fd76ea4fb1023a63a1a5))
* add DDD fallback provider (municipios-brasileiros) for v0.4.2 ([#54](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/54)) ([751ba99](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/751ba99fc5cea535555fd2349a079cdc995a4cf1))
* add DDD resource with Query operation for v0.4.0 ([#52](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/52)) ([619e8f0](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/619e8f0fc80b113492b1fa61dd43f8e130745223))
* add Fake resource — generate Brazilian test data ([#118](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/118)) ([9c866ab](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/9c866ab1621595925dee28d4a03917c45f13be52))
* add Feriados resource — v0.6.0 ([#73](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/73)) ([9a54a57](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/9a54a57799b647a3476b2cdca97f8f6b1762a594))
* add FIPE Reference Tables + PIX resource ([#113](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/113)) ([55bd18d](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/55bd18d9b61c4e2ee3f2b1308a4107fa3522e5bb))
* add FIPE resource (Brands, Models, Years, Price) ([#69](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/69)) ([abf071f](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/abf071f55067ee377ee559f33c97eb4145c222bc))
* add IBGE resource (States + Cities) — v0.8.0 ([#75](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/75)) ([60be9a7](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/60be9a72845182550477d129d5c5ea64553bbf91))
* add NCM resource (Query + Search) — v0.9.0 ([#78](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/78)) ([0d47ba4](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/0d47ba4fe5f476b2b5f1365d99711e0b29574a8d))
* add rate limit awareness (429 detection) — v0.12.0 ([#86](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/86)) ([c4ca704](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/c4ca70444e6e40f4a6c508d1c8b140254b9f12d3))
* add validators (CNPJ checksum, CEP format) and multi-provider fallback ([7615ad0](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/7615ad0802dac43ad475f0807c1cfd8ed905033a))
* assemble Brasil Hub node with resource router, codex, icon, and tests ([985d578](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/985d578127670a238df8d877c7a2b69b3f209027))
* Câmbio + Taxas resources, fix _raw alignment ([#116](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/116), [#117](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/117), [#131](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/131)) ([#133](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/133)) ([d9d8221](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/d9d8221247b4921a76d6bfc5b87e2bd9d6e77495))
* initial project setup with design spec, plan, and CI/CD ([48b9b85](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/48b9b8504efe3381302e48c13763bf4a55dd6ce1))
* scaffold project with package.json, tsconfig, eslint, jest, and type definitions ([789787c](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/789787c93649f3cb34a56a08cf992d6808f520a7))
* validate CNPJ checksum and CEP format before HTTP queries ([#23](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/23)) ([b08f0d5](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/b08f0d5ef5daefee64108abb33801304a1fe365c))


### Fixed

* add author email to package.json for Creator Portal ([#25](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/25)) ([fdd7e91](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/fdd7e91ccfd745d0a54419e15fd8a5395bf36fdf))
* align package.json with n8n-nodes-starter template for Creator Portal vetting ([#26](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/26)) ([7fc6c93](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/7fc6c93e1d67687cb46429458604e88a44a4824c))
* **ci:** add CODECOV_TOKEN for coverage upload ([6ae3de0](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/6ae3de07f13b815ef8c562526f3325eb21222436))
* **ci:** add private-repository flag to SLSA provenance generator ([#17](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/17)) ([1d040db](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/1d040dbfd36119a30053d6e5803399daef15f499))
* **ci:** change audit level to critical and remove continue-on-error ([566ae6f](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/566ae6ff2f3beb94794286422651d82fa63c394b)), closes [#8](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/8)
* **ci:** configure Release Please to use simple v-tags without component prefix ([#106](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/106)) ([2402ad3](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/2402ad3eb55891b6a823e27e50da1263a49ca82a))
* **ci:** correct SHA pins for Scorecard, SonarCloud, and Codecov actions ([c65c8e0](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/c65c8e0f7be22a3e38a08d875f1bae320f82fa23))
* **ci:** disable Codecov auto-search to send only lcov.info ([25ef770](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/25ef77011164bc1214d700ca6c752437c69f3f3f))
* **ci:** mock isolated-vm native addon for Jest ([0ecac0a](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/0ecac0a8d7a4fdc99b583f38e82fe2a25e6a8a66))
* **ci:** replace SLSA generator with GitHub attestation ([#18](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/18)) ([485cd0f](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/485cd0f940d2cc489287885661c8d158aa7083d7))
* **ci:** skip native addon compilation and drop Node 18 from matrix ([c56baea](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/c56baea2243fe3f2c80164d2eb142f53197e8513))
* **ci:** skip prepublishOnly guard in release workflow ([aabba50](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/aabba5083e141fc9a7421197ea56c044b7c95f1a))
* comply with n8n UX guidelines ([#27](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/27)) ([c6d82b5](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/c6d82b521ee698a5b4d051e9d252d15b49bbb78b))
* FIPE buildMeta consistency + Holiday docs propagation — v1.0.2 ([#95](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/95)) ([fe0f0fd](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/fe0f0fd3b6d595e12ac936f20c8d27d0ebf1e31b))
* NaN/Infinity guard in IBGE normalizers + dispatch tests ([#77](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/77)) ([a82dc2d](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/a82dc2d28079a59bee0989ab41151d12606f9fde))
* reject CEPs below minimum range + expand validator tests ([#56](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/56)) ([72a35aa](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/72a35aa281164b49b5d006cbed5e3dd3bcca7397))
* remove paths-ignore from CodeQL PR trigger ([#15](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/15)) ([a5b2a62](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/a5b2a62e7eb8dab64524c2cb17275967f52e8799))
* remove setTimeout from fallback and correct node group ([4733503](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/47335032d1d496e0797357aa28318e8d7b48dd1e))
* rename resource display name Feriado → Holiday ([#92](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/92)) ([7fbf2e1](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/7fbf2e1ca482b9dac8522648ae6e5eb27614f9c5))
* resolve 6 bugs from adversarial attack testing ([#57](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/57)) ([2d1b789](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/2d1b7893d59a04493913b92e977508b74475393d))
* resolve S6551 in safeStr by narrowing types before toString ([#31](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/31)) ([5388963](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/53889637dd99bb541609b3230473fe8d773ea4d6))
* resolve SonarCloud code smells in node and utils ([#30](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/30)) ([ec79cd5](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/ec79cd57cf9fddf52a6d25347a5d540568d22ff7))
* retroactive quality improvements for v0.4.1 ([#53](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/53)) ([ef62abf](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/ef62abfd5e5f23cb60c172ff36827b9ddd255a34))
* **security:** FIPE input validation, null guards, attack tests ([#70](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/70)) ([26145ba](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/26145baa2d4f6ccbeb4106bc3fe200a0ee53891e))
* **security:** runtime timeout clamping + boundary tests ([#83](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/83)) ([93b5813](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/93b5813d2215ec89f4db6b11618d5587ff334320))
* testing arsenal findings on refactoring [#128](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/128) ([#132](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/132)) ([4375acf](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/4375acf025c32f449f246ef7954b11bf36d1bb47))
* use Number.parseInt for check digit comparisons ([2e1fec2](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/2e1fec25dc4b6564f96f4d9cb79ce936ce853c0c))


### Changed

* apply code review fixes and add integration tests ([6cf016f](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/6cf016f5d8b67194c243a3963c69ce30d9441321))
* architectural improvements for 20+ resource scaling ([#128](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/128)) ([a783209](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/a7832091316534e686873c267208c1392ee446a6))
* fix SonarCloud findings (security + code smells) ([9471487](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/94714879f4075003621e5baf234982efceb856cb))
* reduce cognitive complexity and use replaceAll ([#60](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/60)) ([9553be0](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/9553be01d585ace97b2d1b521994e956fd9423a5))


### Documentation

* add changelog following Keep a Changelog standard ([3f18bfb](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/3f18bfb0c364c3d1ed3f97c504dc47876022699b))
* add CII Silver level documentation ([#13](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/13)) ([0c641e3](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/0c641e3facd79d9193f81bd854f1014d4a3d25fc))
* add community health files and Copilot instructions ([246f798](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/246f7987c01993e9263f9abebcb68a77ee57b828))
* add development status banner to README ([#59](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/59)) ([c4f6cf7](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/c4f6cf71c185d2e7b9c3480d3019378f3f46fc6b))
* add GitHub Discussions to post-release workflow in CLAUDE.md ([#68](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/68)) ([487353b](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/487353bea590f4d498feca2158d710066d75ebc4))
* add JSDoc to all 25 exported symbols ([0d068d6](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/0d068d60ed0bde85cf9d0547da4938087b5f8e1a))
* add JSDoc to all internal functions and execute() method ([607a019](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/607a0192131c595325ad49e0aa30ff384eb1c6d7))
* add MIT license ([eb66a65](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/eb66a6566e5c162ecf93102480f06c705db0f869))
* add n8n skills reference to CLAUDE.md and update planning files ([c093ada](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/c093ada196f5a05037c3f1ad8433e3e46896881a))
* add npm, CI, and license badges to README ([c09da15](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/c09da159706a3e1b7306505db80c2c79d8ebd0f5))
* add OpenSSF Best Practices badge ([#12](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/12)) ([84b7a63](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/84b7a638f448ae392cf44aaef15b6d3701312869))
* add pre-release workflow checklist to CLAUDE.md ([4957e69](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/4957e69bd9eefb1f766494b5d37457aa1e03bc74))
* add README with installation, operations, example output, and providers ([bee8599](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/bee8599396a68aac315e26bcc819ccac8878cad1))
* add RELEASE_CHECKLIST.md + update all living docs for v0.9.0 ([#80](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/80)) ([1fdc737](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/1fdc737ea06b5e3fffb6e0d671d388e52ac7e89d))
* detail commit conventions, versioning, and changelog in CONTRIBUTING ([a377794](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/a377794090be1cf83e73b41a9fb5d305975806b4))
* expand governance continuity plan for CII Silver ([#14](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/14)) ([d81736a](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/d81736a412ad88d7f4ad51ecc633b05807738763))
* prepare release v0.1.1 ([4ba1ed9](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/4ba1ed96eb7831d83802951ce1154b65b5b9db7e))
* propagate Feriado → Holiday rename to all living docs ([#94](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/94)) ([17de67b](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/17de67b072c76244204b1ab968ce9838d995e6a1))
* SEO/AEO optimization — FAQ + tutorial + comparison article ([#126](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/126)) ([ac37564](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/ac37564bdcf0450b0c922e98a373ba55f34bc0e6))
* update all docs for per-resource release strategy ([#49](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/49)) ([646a734](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/646a7342451eeac698ce8df9ab886f66149a63df))
* update changelog and bump version for v0.1.3 ([#24](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/24)) ([e0bf506](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/e0bf5068ea6f99c864fe724ad28e917c1169c7af))
* update changelog and bump version for v0.1.6 ([#28](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/28)) ([fbaa3e5](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/fbaa3e579456700b88f3b27318ae985b25bbf7b9))
* update changelog and bump version for v0.4.3 ([#58](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/58)) ([f0d52c3](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/f0d52c38d5efbf3308c29e226f62b8f6170f340a))
* update changelog and tracking files for v0.1.0 implementation ([b84f6a7](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/b84f6a71bbfc45e86c501d49416ccc1302ff0a66))
* update changelog for v0.1.0 ([a1faf36](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/a1faf36c4a3af70867f84e19fbcb7b08a36cd9ad))
* update changelog, planning files after CI/CD simplification ([#21](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/21)) ([fb21475](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/fb21475416ea6142722ed9bc17a226054a076ecd))
* update documentation for v0.4.x ([#55](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/55)) ([1ee748b](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/1ee748b0d9b9b2d7f073c4acbfa612844e7a1264))
* update living docs for v1.2.0 (10 resources, PIX + FIPE ref tables) ([#114](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/114)) ([950358f](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/950358fd08b4bc4c6ba49256da9718bae11a3330))
* update planning files after v0.1.6 release ([#29](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/29)) ([bc38362](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/bc3836208da2471d4f9542e6df20b65a6885c984))
* update progress.md with full session log and test results ([7f67e70](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/7f67e70d20f98392b4d6249faca91b64f755e25a))
* update ROADMAP for v1.4.0 (Câmbio, Taxas, CNES/Correios not planned) ([#135](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/135)) ([5db7a94](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/5db7a9468d61ee1fe64315932e1e8988e52ff4d2))

## [1.3.1](https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v1.3.0...v1.3.1) (2026-03-20)


### Changed

* architectural improvements for 20+ resource scaling ([#128](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/128)) ([a783209](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/a7832091316534e686873c267208c1392ee446a6))

## [1.3.0](https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v1.2.0...v1.3.0) (2026-03-20)


### Added

* add Fake resource — generate Brazilian test data ([#118](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/118)) ([9c866ab](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/9c866ab1621595925dee28d4a03917c45f13be52))


### Documentation

* SEO/AEO optimization — FAQ + tutorial + comparison article ([#126](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/126)) ([ac37564](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/ac37564bdcf0450b0c922e98a373ba55f34bc0e6))

## [1.2.0](https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v1.1.1...v1.2.0) (2026-03-20)


### Added

* add FIPE Reference Tables + PIX resource ([#113](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/113)) ([55bd18d](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/55bd18d9b61c4e2ee3f2b1308a4107fa3522e5bb))


### Fixed

* **ci:** configure Release Please to use simple v-tags without component prefix ([#106](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/106)) ([2402ad3](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/2402ad3eb55891b6a823e27e50da1263a49ca82a))


### Documentation

* update living docs for v1.2.0 (10 resources, PIX + FIPE ref tables) ([#114](https://github.com/luisbarcia/n8n-nodes-brasil-hub/issues/114)) ([950358f](https://github.com/luisbarcia/n8n-nodes-brasil-hub/commit/950358fd08b4bc4c6ba49256da9718bae11a3330))

## [1.1.1] - 2026-03-19

### Changed
- README: prominent downloads + stars badges (for-the-badge style)
- GitHub: 17 repository topics added for discoverability

## [1.1.0] - 2026-03-19

### Added
- **SEO**: +10 npm keywords (brazilian, automation, workflow, public-data, address, zip-code, company, tax-id, validation, api-fallback)
- **SEO**: +11 codex aliases with PT-BR terms (brasil, banco, municipios, endereco, empresa, consulta, receita, tabela-fipe) for n8n marketplace discoverability
- npm description now highlights "22 providers", "no credentials", "AI Agent ready"

### Fixed
- **Type safety**: Replaced unsafe `error as Error` casts with proper `instanceof` guards in router error handling (prevents TypeError on non-Error throws)
- **NaN/Infinity leak**: FIPE normalizers now use `Number.isFinite()` instead of `typeof === 'number'` — rejects NaN/Infinity (falls back to 0)
- **Infinity in URL**: `referenceTable=Infinity` no longer produces `?tabela_referencia=Infinity` in FIPE URLs

### Changed
- **Generic `buildResultItem<T>`/`buildResultItems<T>`**: Eliminates 14 double-cast expressions across all execute files. Cast centralized in utils.ts
- **`useUnknownInCatchVariables: true`** in tsconfig — stricter catch variable typing
- Fixed orphaned JSDoc comment in BrasilHub.node.ts (moved to resourceOperations)
- Fixed stale DDD description comment ("Single provider" → "BrasilAPI → municipios-brasileiros")

## [1.0.3] - 2026-03-18

### Fixed
- FIPE buildMeta calls now pass explicit `false` for rateLimited (consistency with 10 other handlers)
- Documented in JSDoc why fallback.ts uses Error (not NodeApiError) for aggregated multi-provider errors

## [1.0.2] - 2026-03-18

### Fixed
- Propagated `Feriado` → `Holiday` rename to all living docs: README, CLAUDE.md, copilot-instructions, package.json description, node description, ROADMAP
- Updated README hero text and Roadmap link description

## [1.0.1] - 2026-03-18

### Fixed
- Renamed resource display name `Feriado` → `Holiday` for English consistency (all UI text must be in English per n8n Cloud requirements)
- Reordered resource options alphabetically per n8n lint rules (Holiday now between FIPE and IBGE)

### Changed
- Internal `value` remains `feriados` — no breaking change for existing workflows

## [1.0.0] - 2026-03-17

### Added
- **Stable release** — first major version, API contract locked under semver
- All 4 power-user features from v0.10–v0.13 consolidated:
  - Configurable Timeout (1s–60s) with runtime clamping
  - CNPJ Output Mode (Simplified, Full, AI Summary)
  - Rate Limit Awareness (429 detection, Retry-After, fallback chain)
  - Configurable Provider Order (6 resources, 22 providers)

### Changed
- 9 resources, 17 operations, 22 providers
- 1174 tests, 24 suites, 99%+ branch coverage
- All pre-1.0 versions deprecated

## [0.13.0] - 2026-03-17

### Added
- **Configurable Provider Order** — "Primary Provider" dropdown for 6 resources with 2+ providers
  - CNPJ: 7 providers (Auto, BrasilAPI, CNPJ.ws, CNPJA, MinhaReceita, OpenCNPJ.com, OpenCNPJ.org, ReceitaWS)
  - CEP: 4 providers (ApiCEP, Auto, BrasilAPI, OpenCEP, ViaCEP)
  - Banks: 2 providers (Auto, BrasilAPI, BancosBrasileiros)
  - DDD: 2 providers (Auto, BrasilAPI, Municipios-BR)
  - Feriados: 2 providers (Auto, BrasilAPI, Nager.Date)
  - IBGE: 2 providers (Auto, BrasilAPI, IBGE API)
- `reorderProviders()` helper in shared/utils.ts — moves chosen provider to position 0
- 7 new tests for reorderProviders (move, keep order, edge cases, immutability)

### Changed
- Options alphabetized per n8n lint rules
- Default "Auto (BrasilAPI First)" preserves existing behavior
- 1174 tests total (was 1167)

## [0.12.0] - 2026-03-17

### Added
- **Rate Limit Awareness** — HTTP 429 detection in fallback engine
  - Detects 429 status from any provider, moves to next immediately
  - Extracts `Retry-After` header when present (seconds → milliseconds)
  - Adds `rate_limited: true` and `retry_after_ms` to `_meta` output
  - Specific error message when all providers are rate-limited: "All providers rate-limited or failed"
  - Works across all 9 resources via shared `queryWithFallback`
- 9 new rate limit tests (429 detection, Retry-After parsing, error messages, edge cases)

### Changed
- `IFallbackResult` now includes `rateLimited` and `retryAfterMs` fields
- `IMeta` now includes optional `rate_limited` and `retry_after_ms` fields
- `buildMeta` accepts optional `rateLimited` and `retryAfterMs` params
- All 10 execute handlers pass rate limit info through to `_meta`
- 1167 tests total (was 1158)

## [0.11.0] - 2026-03-17

### Added
- **CNPJ Output Mode** — new `Output Mode` dropdown when Simplify is disabled
  - **Full** (default): all normalized fields (address, contacts, partners)
  - **AI Summary**: 8 flat English key-value fields optimized for AI Agent tool usage
    (`cnpj`, `company`, `trade_name`, `status`, `since`, `size`, `activity`, `city`)
- 4 new output mode tests in cnpj.execute.spec.ts

### Changed
- 1158 tests total (was 1154)
- Backward-compatible: existing workflows with `simplify: true/false` keep working identically

## [0.10.1] - 2026-03-17

### Fixed
- **Runtime timeout clamping** — timeout values are now clamped to [1000, 60000] ms at runtime, not just UI
  - Prevents `timeout: 0` (infinite wait in axios) via expressions or AI tool usage
  - NaN/Infinity values fall back to DEFAULT_TIMEOUT_MS (10000)
  - `clampTimeout()` guard applied in both `queryWithFallback` and `fetchFipe`

### Changed
- Exported `DEFAULT_TIMEOUT_MS` constant — all 9 resource handlers now import it instead of hardcoding `10000` (single source of truth)
- 13 new boundary tests for `clampTimeout` + `queryWithFallback` edge cases
- 1154 tests total (was 1141)

## [0.10.0] - 2026-03-17

### Added
- **Configurable Timeout** — global "Timeout (Ms)" parameter (1s–60s, default 10s)
  - Exposed in node UI after all resource-specific fields
  - Passed to `queryWithFallback` and `fetchFipe` for all 9 resources
  - Replaces hardcoded `REQUEST_TIMEOUT_MS` constant
- 5 new tests for timeout behavior (fallback, node metadata, execute integration)

### Changed
- Renamed `REQUEST_TIMEOUT_MS` → `DEFAULT_TIMEOUT_MS` in fallback.ts
- All resource handlers now read timeout from node parameter instead of constant
- 1141 tests total, 24 suites, 99%+ branch coverage

## [0.9.0] - 2026-03-17

### Added
- **NCM resource** with Query and Search operations (BrasilAPI)
  - **Query**: Fetch tax classification details by NCM code
  - **Search**: Find codes by description keyword (min 3 characters, multi-item)
- INcm interface with 7 fields (code, description, dates, act info)
- NCM and tax-classification aliases added to codex
- Attack tests for NCM resource

### Changed
- Node description updated to include NCM
- Resource options now include NCM (9 resources, 17 operations total)

## [0.8.0] - 2026-03-16

### Added
- **IBGE resource** with States and Cities operations and multi-provider fallback (BrasilAPI → IBGE API oficial)
  - **States**: List all 27 Brazilian states with region info
  - **Cities**: List all municipalities for a given state
- UF validation via allowlist (27 valid abbreviations, case-insensitive)
- IState and ICity interfaces in types.ts
- IBGE and states/cities aliases added to codex
- Attack tests for IBGE resource

### Changed
- Node description updated to include IBGE
- Resource options now include IBGE (8 resources total)

## [0.7.0] - 2026-03-16

### Added
- **4 new CNPJ providers** — total 7 (most of any community node):
  BrasilAPI → CNPJ.ws → ReceitaWS → MinhaReceita → OpenCNPJ.org → OpenCNPJ.com → CNPJA
  - MinhaReceita: flat snake_case, regime_tributario field
  - OpenCNPJ.org: structured telefones array, capital_social as string
  - OpenCNPJ.com: wrapped response, camelCase
  - CNPJA: deeply nested, updated timestamp, suframa
- **ApiCEP provider** — total 4 CEP providers:
  BrasilAPI → ViaCEP → OpenCEP → ApiCEP
  - English field names, hyphenated CEP format, ok-based error detection
- **CNPJ Simplify parameter** — returns only top-level fields (cnpj, razao_social, nome_fantasia, situacao, data_abertura, porte) when enabled (default: true)
- **HTTP status codes in error messages** — fallback errors now show `[404]`, `[500]` etc. when available
- `buildResultItem` and `buildResultItems` shared helpers in utils.ts
- 21 new provider tests, 709 total, 99%+ branch coverage

### Changed
- DRY refactor: all 10 execute handlers use shared `buildResultItem`/`buildResultItems`
- Deduplicated `normalizeBrands`/`normalizeYears` via shared `normalizeCodeNameList` (SonarCloud S4144)
- Node description updated to reflect 7 CNPJ + 4 CEP providers

## [0.6.0] - 2026-03-16

### Added
- **Feriados resource** with Query operation and multi-provider fallback (BrasilAPI → Nager.Date)
  - Returns one n8n item per holiday for a given year
  - Nager.Date normalizer prefers `localName` (pt-BR) over `name` (English)
  - Year validation: integer in range 1900–2199
- IFeriado interface in types.ts
- 121 adversarial attack tests for Feriados (normalizer + execute)
- 688 total tests, 99.56% branch coverage

### Security
- `encodeURIComponent` on year in provider URLs (defense-in-depth)
- `safeStr` sanitization on Nager.Date `types` array items

### Changed
- Node description updated to include Feriados
- Resource options now include "Feriado" (alphabetical: Bank, CEP, CNPJ, CPF, DDD, Feriado, FIPE)

## [0.5.1] - 2026-03-16

### Fixed
- **FIPE normalizer crash**: `normalizeBrands`, `normalizeModels`, `normalizeYears` crashed with TypeError when API returned null/undefined items in arrays — now filtered out safely
- **FIPE path traversal**: User-supplied `brandCode`, `modelCode`, `yearCode` were interpolated into URLs without validation — now validated with regex (`/^\d{1,6}$/`, `/^\d{1,5}-\d{1,2}$/`)
- **FIPE SSRF via vehicleType**: `vehicleType` was not validated server-side — now checked against allowlist (carros, motos, caminhoes)
- **FIPE URL encoding**: All user inputs now `encodeURIComponent()`-encoded before URL interpolation
- **referenceTable float injection**: Applied `Math.floor()` to prevent decimal values in query string
- Indentation of FIPE resource option in router

### Added
- 121 FIPE adversarial attack tests (normalizer + execute) via Testing Arsenal
- Router completeness test: verifies every UI resource/operation has a handler
- `buildMeta` unit tests: ISO 8601 timestamp validation, strategy logic, errors key presence
- Testing Arsenal as mandatory Fase 3 in pre-release workflow (6 phases total)
- 574 total tests, 99.5%+ branch coverage

### Security
- Input validation for all FIPE parameters prevents path traversal and SSRF
- `encodeURIComponent()` applied as defense-in-depth on all URL path segments

### Deprecated
- v0.5.0 contains normalizer crash bugs and security vulnerabilities fixed in this release

## [0.5.0] - 2026-03-16

### Added
- **FIPE resource** with 4 hierarchical operations for vehicle price queries (Tabela FIPE)
  - **Brands**: List all vehicle brands by type (Cars, Motorcycles, Trucks)
  - **Models**: List models for a specific brand
  - **Years**: List available years for a specific model
  - **Price**: Get the FIPE table price for a specific vehicle (brand/model/year)
- Conditional parameter visibility via displayOptions (vehicleType → brandCode → modelCode → yearCode)
- Optional Reference Table parameter for querying historical FIPE data
- IFipeBrand, IFipeModel, IFipeYear, IFipePrice interfaces in types.ts
- 27 new tests (14 normalizer + 13 execute), 419 total, 99%+ branch coverage
- FIPE and vehicle aliases added to codex for discoverability

### Changed
- Node description updated to include FIPE
- Resource options now include FIPE (alphabetical: Bank, CEP, CNPJ, CPF, DDD, FIPE)
- Provider: parallelum.com.br (single provider — BrasilAPI only supports price-by-code, not hierarchy)

## [0.4.3] - 2026-03-16

### Fixed
- **Normalizers crash with null/undefined**: All normalizer entry points now guard against null/undefined API responses with `(data ?? {})` coercion, producing empty defaults instead of TypeError
- **normalizeBanks/normalizeDdd no Array guard**: Added `Array.isArray()` guard before `.map()` and `.filter()` — non-array data returns empty array or descriptive error instead of crashing
- **DDD municipios string-vs-number equality**: Fixed `===` comparison that failed when JSON had string DDD codes (`"11"` vs `11`) by using `Number()` coercion
- **capital_social NaN for non-numeric strings**: Added `safeCapital()` helper with `Number.isNaN()` guard — `"abc"` now returns `0` instead of `NaN`
- **continueOnFail string throw**: Fixed error message extraction using `error instanceof Error ? error.message : String(error)` — non-Error throws no longer produce `undefined` json.error
- **stripNonDigits crash with non-string**: Added defensive `String(value ?? '')` coercion for non-string input types
- Lint errors in attack test files (unused variable, unnecessary eslint-disable directives, direct NaN comparison)

### Added
- 250 adversarial attack tests across 3 new test files:
  - `validators.attack.spec.ts` (66 tests): type confusion, unicode injection, prototype pollution, NaN propagation
  - `normalizers.attack.spec.ts` (127 tests): null/undefined crashes, non-array data, XSS/SQLi passthrough, large payloads
  - `execute.attack.spec.ts` (57 tests): garbage API responses, error objects, timeout, continueOnFail edge cases, DDD strict equality
- JSDoc `@throws {NodeOperationError}` to `BrasilHub.execute()` method
- Formal JSDoc with `@param`/`@returns` to `safeCapital()` helper

### Changed
- 374 tests total (was 124), 100% statement/function/line coverage, 96%+ branch coverage
- Pre-release workflow: all 5 phases executed (compliance 17/17, security PASS, validation 12/12, simplify clean, JSDoc 87%)

### Deprecated
- All versions prior to 0.4.3 contain bugs fixed in this release (CEP validation, normalizer crashes, DDD equality, capital_social NaN)

## [0.4.2] - 2026-03-15

### Added
- **DDD fallback provider**: municipios-brasileiros (kelvins/municipios-brasileiros GitHub JSON) as fallback when BrasilAPI fails
- UF_CODES mapping table (27 IBGE codes → state abbreviations) for municipios normalization
- Multi-state DDD support: picks the most frequent UF when a DDD spans multiple states
- 6 new DDD tests (municipios filtering, multi-state, not-found)

### Changed
- DDD resource now has fallback resilience (was single-provider)
- 112 tests total, 99.27% branch coverage

## [0.4.1] - 2026-03-15

### Changed
- Extract `buildMeta()` helper to `shared/utils.ts`, eliminating duplicated meta-building logic across 5 execute handlers
- Improve branch coverage: Banks 91% → 100%, DDD normalize 66% → 100% (3 new edge case tests)
- 108 tests total, 98.6% branch coverage (remaining gap: DDD fallback dead code with single provider)

### Fixed
- Document mandatory pre-release workflow rules in CLAUDE.md (all 5 phases must execute in order)

## [0.4.0] - 2026-03-15

### Added
- **DDD resource** with Query operation (BrasilAPI)
- Fetch state and cities for a Brazilian area code (DDD)
- Input validation: 2-digit range 11–99 before API call
- IDdd interface in types.ts
- 9 new tests (normalizer, execute, integration)

### Changed
- Resource options sorted alphabetically (Bank, CEP, CNPJ, CPF, DDD)
- 105 tests total

## [0.3.0] - 2026-03-15

### Added
- **Bank resource** with Query and List operations
- Query: fetch bank info by COMPE code (BrasilAPI → BancosBrasileiros fallback)
- List: fetch all Brazilian banks, returns one n8n item per bank (multi-item)
- Bank code validation (must be positive integer) before API calls
- BancosBrasileiros (GitHub raw JSON) as fallback provider with local filtering
- IBank interface in types.ts
- 18 new tests (normalizer, execute, integration, fallback)

### Changed
- Resource option uses singular "Bank" per n8n lint convention
- 96 tests total, 100% statement/function/line coverage

## [0.2.0] - 2026-03-15

### Added
- **CPF resource** with Validate operation (local Módulo 11 checksum, no API call)
- CPF checksum validator (`validateCpf`) and sanitizer (`sanitizeCpf`) in shared validators
- 16 new tests for CPF validation (validators, execute handler, integration, edge cases)
- CPF alias added to codex for discoverability

### Changed
- Execute handlers now return `INodeExecutionData[]` (array) instead of single items, enabling future multi-item resources (Banks list, Feriados)
- Router uses `push(...results)` spread pattern for multi-item support
- Resource options sorted alphabetically (CEP, CNPJ, CPF)
- Node description updated to include CPF
- 76 tests total with 100% coverage (statements, branches, functions, lines)

## [0.1.6] - 2026-03-11

### Fixed
- Comply with n8n UX guidelines: replace "All providers failed" error message with "No provider could fulfill the request" (avoids prohibited words)
- Add descriptive sub-text to Resource options (CNPJ, CEP) for better UX

## [0.1.5] - 2026-03-11

### Fixed
- Align package.json with n8n-nodes-starter template to fix Creator Portal vetting
- Remove unused `main` field and `index.js` entry point (not present in starter template)
- Change `files` from `["dist/nodes"]` to `["dist"]` to match starter convention

## [0.1.4] - 2026-03-11

### Fixed
- Add author email to package.json (required by n8n Creator Portal for node verification)

## [0.1.3] - 2026-03-11

### Added
- CNPJ checksum validation before HTTP queries (prevents wasted API calls on invalid CNPJs)
- CEP format validation before HTTP queries (rejects all-zeros CEP early)
- 8 new tests covering pre-query validation and normalizer edge cases
- GitHub repository topics, homepage URL, and Discussions for discoverability

### Changed
- Simplify CI/CD: remove OpenSSF Scorecard workflow and CodeQL (SonarCloud covers SAST + quality gate)
- Remove OpenSSF Scorecard and CII Best Practices badges from README
- README redesigned with centered hero, "Why Brasil Hub?" section, collapsible examples, fallback diagram
- Icon SVG improved with `{}` data symbol
- 100% test coverage across all metrics (statements, branches, functions, lines)

## [0.1.2] - 2026-03-11

### Added
- GOVERNANCE.md with BDFL model, roles, and continuity/succession plan
- ROADMAP.md with planned features for v0.2 and v1.0
- SECURITY-ASSESSMENT.md with threat model (8 threats), trust boundaries, and secure design principles
- Release verification instructions in SECURITY.md (npm provenance + build attestation)
- Build provenance attestation via `actions/attest-build-provenance`
- GPG signing for commits and tags

### Changed
- Release pipeline: Build & Pack (with attestation) → Publish
- Branch protection enhanced with pull request requirement and required status checks

### Fixed
- Remove `paths-ignore` from `pull_request` triggers in CI workflow to prevent docs-only PRs from being blocked by required status checks

### Security
- SonarCloud quality gate integrated
- All GitHub Actions pinned to SHA for supply chain security

## [0.1.1] - 2026-03-10

### Fixed
- Remove `setTimeout` from fallback logic to pass `@n8n/scan-community-package` ESLint check
- Replace Portuguese aliases in codex file with English equivalents (`tax-id`, `zip-code`)

### Changed
- Remove inter-provider delay from fallback strategy (providers are queried immediately on failure)
- Simplify test infrastructure: remove fake timers and `runWithTimers` helper

## [0.1.0] - 2026-03-10

### Added
- Brasil Hub n8n node with CNPJ and CEP resources
- CNPJ query operation with multi-provider fallback (BrasilAPI, CNPJ.ws, ReceitaWS)
- CNPJ validate operation (local checksum verification, no API call)
- CEP query operation with multi-provider fallback (BrasilAPI, ViaCEP, OpenCEP)
- CEP validate operation (local format check, no API call)
- Normalized output schema for all providers
- Optional raw API response inclusion via `Include Raw Response` toggle
- `_meta` field with provider info, query timestamp, strategy (`direct`/`fallback`), and errors
- `usableAsTool: true` for AI Agent compatibility
- Generic multi-provider fallback engine with 10s timeout per provider
- CNPJ checksum and CEP format validators (zero runtime dependencies)
- TypeScript strict mode with full type definitions and JSDoc on all 23 public exports
- 49 tests (99.46% statement coverage) across 8 suites
- README with installation, operations table, example output, and provider documentation
- Design spec and implementation plan
- GitHub Actions CI pipeline (lint, test matrix Node 20/22, build, dependency audit)
- GitHub Actions release pipeline (npm publish with provenance on GitHub release)
- Community health files (CODE_OF_CONDUCT, CONTRIBUTING, SECURITY, SUPPORT)
- Issue templates (bug report, feature request) with YAML form schema
- Pull request template with n8n-specific checklist
- Dependabot configuration (npm + GitHub Actions weekly updates)
- MIT license

[1.1.1]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v1.0.3...v1.1.0
[1.0.3]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.13.0...v1.0.0
[0.13.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.10.1...v0.11.0
[0.10.1]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.4.3...v0.5.0
[0.4.3]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.1.6...v0.2.0
[0.1.6]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/luisbarcia/n8n-nodes-brasil-hub/releases/tag/v0.1.0
