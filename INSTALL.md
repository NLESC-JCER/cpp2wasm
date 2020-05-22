# Installation

## Dependencies

To run the commands in the README.md the following items are required

1. GNU C++ compiler (`g++`) and `make`, install with `sudo apt install -y build-essential`
1. [Apache httpd server 2.4](http://httpd.apache.org/), install with `sudo apt install -y apache2`
1. Python development, install with `sudo apt install -y python3-dev`
1. [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html)
1. [Docker Engine](https://docs.docker.com/install/), setup so `docker` command can be run [without sudo](https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user).

## Generating code from Markdown

Entangled is used to convert code blocks in Markdown to source code files.

1. Install [entangled](https://github.com/entangled/entangled)
2. Run entangled daemon with

```shell
entangled README.md INSTALL.md
```

Or the [Entangled - Pandoc filters](https://github.com/entangled/filters) Docker image can be used

```{.awk #pandoc-tangle}
docker run --rm -ti --user ${UID} -v ${PWD}:/data nlesc/pandoc-tangle:0.5.0 --preserve-tabs README.md INSTALL.md
```

Or automatic generation during a commit.

We will use a pre-commit git hook to generate code.

The hook script runs entangle using Docker and adds newly written files to the current git commit.

```{.awk file=.githooks/pre-commit}
#!/bin/sh

UID=$(id -u)

echo 'Check entangled files are up to date'

FILES=$(docker run --rm --user ${UID} -v ${PWD}:/data nlesc/pandoc-tangle:0.5.0 --preserve-tabs README.md INSTALL.md 2>&1 > /dev/null | perl -ne 'print $1,"\n" if /^Writing \`(.*)\`./')
echo $FILES

echo 'Adding written files to commit'
echo $FILES | xargs git add
```

The hook must be made executable with

```{.awk #hook-permission}
chmod +x .githooks/pre-commit
```

The git hook can be enabled with

```{.awk #init-git-hook}
git config --local core.hooksPath .githooks
```

(`core.hooksPath` config is available in git version >= 2.9)

## Command collection

All the commands in the README.md can be captured in a Makefile like so:

```{.makefile file=Makefile}
.PHONY: clean clean-compiled clean-entangled test all entangle entangle-list py-deps start-redis stop-redis run-webservice run-celery-webapp run-webapp build-wasm host-files test-wasm

UID := $(shell id -u)
# Prevent suicide by excluding Makefile
ENTANGLED := $(shell perl -ne 'print $$1,"\n" if /^```\{.*file=(.*)\}/' README.md INSTALL.md | grep -v Makefile | sort -u)
COMPILED := bin/newtonraphson.exe src/py/newtonraphsonpy.*.so apache2/cgi-bin/newtonraphson src/js/newtonraphsonwasm.js  src/js/newtonraphsonwasm.wasm

entangle: README.md INSTALL.md
	<<pandoc-tangle>>

$(ENTANGLED): entangle

entangled-list:
	@echo $(ENTANGLED)

py-deps: pip-pybind11 pip-flask pip-celery pip-connexion

pip-pybind11:
	<<pip-pybind11>>

pip-flask:
	<<pip-flask>>

pip-celery:
	<<pip-celery>>

pip-connexion:
	<<pip-connexion>>

bin/newtonraphson.exe: src/cli-newtonraphson.cpp
	<<build-cli>>

test-cli: bin/newtonraphson.exe
	<<test-cli>>

apache2/cgi-bin/newtonraphson: src/cgi-newtonraphson.cpp
	<<build-cgi>>

test-cgi: apache2/cgi-bin/newtonraphson
	<<test-cgi>>

src/py/newtonraphsonpy.*.so: src/py-newtonraphson.cpp
	<<build-py>>

test-py: src/py/example.py src/py/newtonraphsonpy.*.so
	<<test-py>>

test: test-cli test-cgi test-py test-webservice

all: $(ENTANGLED) $(COMPILED)

clean: clean-compiled clean-entangled

# Removes the compiled files
clean-compiled:
	$(RM) $(COMPILED)

# Removed the entangled files
clean-entangled:
	$(RM) $(ENTANGLED)

start-redis:
	<<start-redis>>

stop-redis:
	<<stop-redis>>

run-webapp: src/py/newtonraphsonpy.*.so
	<<run-webapp>>

run-webservice: src/py/newtonraphsonpy.*.so
	<<run-webservice>>

test-webservice:
	<<test-webservice>>

run-celery-worker: src/py/newtonraphsonpy.*.so
	<<run-celery-worker>>

run-celery-webapp: src/py/newtonraphsonpy.*.so
	<<run-celery-webapp>>

build-wasm: src/js/newtonraphsonwasm.js src/js/newtonraphsonwasm.wasm

src/js/newtonraphsonwasm.js src/js/newtonraphsonwasm.wasm: src/wasm-newtonraphson.cpp
	<<build-wasm>>

host-files: build-wasm
	<<host-files>>

test-wasm:
	<<test-wasm>>

init-git-hook:
	<<hook-permission>>
	<<init-git-hook>>
```

For example the Python dependencies can be installed with

```shell
make py-deps
```

See [GitHub Actions workflow](.github/workflows/main.yml) for other usages of the Makefile.

## Tests

To make sure WebAssembly module code snippets work we want have a tests for it.
To test the WebAssembly module we will use the [cypress](https://www.cypress.io/) test framework.
Cypress can simulate what a user would do and expect in a web browser.

We want to test if visiting the example web page renders the answer `-1.00`.

First a test for the direct WebAssembly example.

```{.js file=cypress/integration/example_spec.js}
// this JavaScript snippet is run by cypress and is stored as cypress/integration/example_spec.js
describe('src/js/example.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example.html');
    cy.get('#answer').contains('-1.00');
  });
});
```

Second a test for the WebAssembly called through a web worker.

```{.js file=cypress/integration/example-web-worker_spec.js}
// this JavaScript snippet is run by cypress and is stored as cypress/integration/example-web-worker_spec.js
describe('src/js/example-web-worker.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example-web-worker.html');
    cy.get('#answer').contains('-1.00');
  });
});
```

And lastly a test for the full React/form/Web worker/WebAssembly combination.

```{.js file=cypress/integration/example-app_spec.js}
describe('src/js/example-app.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example-app.html');
    cy.get('input[name=guess]').type('-30');
    cy.contains('Submit').click();
    cy.get('#answer').contains('-1.00');
  });
});
```

The test can be run with

```{.awk #test-wasm}
npx cypress run --config-file false
```

The `npx` command ships with NodeJS which is included in the Emscripten SDK and can be used to run commands available on [npm repository](https://npmjs.com/).

The tests will also be run in the [GH Action continous integration build](.github/workflows/main.yml).
