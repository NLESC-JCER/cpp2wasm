# Installation

## Dependencies

To run the commands in the README.md the following items are required

1. GNU C++ compiler (`g++`) and `make`, install with `sudo apt install -y build-essential`
1. [Apache httpd server 2.4](http://httpd.apache.org/), install with `sudo apt install -y apache2`
1. Python development, install with `sudo apt install -y python3-dev`
1. [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html), includes a Node.js installation
1. [Docker Engine](https://docs.docker.com/install/), setup so `docker` command can be run [without sudo](https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user).
1. [Perl](https://www.perl.org/), already installed on Linux

## Command collection

All the commands in the [README.md](README.md) and [CONTRIBUTING.md](CONTRIBUTING.md) can be captured in a [Makefile](https://en.wikipedia.org/wiki/Makefile) like so:

```{.makefile file=Makefile}
# this Makefile snippet is stored as Makefile
.PHONY: clean clean-compiled clean-entangled test all entangle entangle-list py-deps test-cgi test-cli test-py start-redis stop-redis run-webservice test-webservice run-celery-worker run-celery-webapp run-webapp build-wasm host-webassembly-files host-react-files test-webassembly test-react init-git-hook check test-wasm-cli npm-fopenapi-deps npm-fastify npm-openapi run-js-webservice test-js-webservice test-js-webservice-invalid test-js-openapi run-js-openapi test-js-openapi npm-threaded run-js-threaded test-js-threaded

HOST_UID := $(shell id -u)
HOST_GID := $(shell id -g)
# Prevent suicide by excluding Makefile
ENTANGLED := $(shell docker run --rm --user ${HOST_UID}:${HOST_GID} -v ${PWD}:/data nlesc/entangled list)
COMPILED := cli/newtonraphson.exe openapi/newtonraphsonpy.*.so flask/newtonraphsonpy.*.so cgi/apache2/cgi-bin/newtonraphson webassembly/newtonraphsonwasm.js webassembly/newtonraphsonwasm.wasm react/newtonraphsonwasm.js react/newtonraphsonwasm.wasm

entangle: *.md
	<<entangled-tangle>>

$(ENTANGLED): entangle

entangled-list:
	@echo $(ENTANGLED)

flask-deps: pip-pybind11 pip-celery pip-flask

openapi-deps: pip-pybind11 pip-connexion

py-deps: flask-deps openapi-deps

pip-pybind11:
	<<pip-pybind11>>

pip-flask:
	<<pip-flask>>

pip-celery:
	<<pip-celery>>

pip-connexion:
	<<pip-connexion>>

cli/newtonraphson.exe:
	<<build-cli>>

test-cli: cli/newtonraphson.exe
	<<test-cli>>

cgi/apache2/cgi-bin/newtonraphson:
	<<build-cgi>>

test-cgi: cgi/apache2/cgi-bin/newtonraphson
	<<test-cgi>>

openapi/newtonraphsonpy.*.so:
	<<build-py>>

flask/newtonraphsonpy.*.so: openapi/newtonraphsonpy.*.so
	<<flask-link-newtonraphsonpy>>

test-py: openapi/newtonraphsonpy.*.so
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

run-webapp: flask/newtonraphsonpy.*.so
	<<run-webapp>>

run-webservice: openapi/newtonraphsonpy.*.so
	<<run-webservice>>

test-webservice:
	<<test-webservice>>

run-celery-worker: flask/newtonraphsonpy.*.so
	<<run-celery-worker>>

run-celery-webapp:
	<<run-celery-webapp>>

build-wasm: webassembly/newtonraphsonwasm.js webassembly/newtonraphsonwasm.wasm

webassembly/newtonraphsonwasm.js webassembly/newtonraphsonwasm.wasm:
	<<build-wasm>>

react/newtonraphsonwasm.wasm: webassembly/newtonraphsonwasm.wasm
	<<link-webassembly-wasm>>

react/newtonraphsonwasm.js: webassembly/newtonraphsonwasm.js
	<<link-webassembly-js>>

test-wasm-cli: build-wasm
	<<test-wasm-cli>>

host-webassembly-files: build-wasm
	<<host-files>>

host-react-files: react/newtonraphsonwasm.js react/newtonraphsonwasm.wasm
	<<host-files>>

test-webassembly:
	<<test-webassembly>>

js-deps: npm-fastify npm-openapi npm-threaded

npm-fastify:
	<<npm-fastify>>

npm-openapi:
	<<npm-openapi>>

npm-threaded:
	<<npm-threaded>>

run-js-webservice: build-wasm
	<<run-js-webservice>>

test-js-webservice:
	<<test-js-webservice>>

test-js-webservice-invalid:
	<<test-js-webservice-invalid>>

run-js-openapi: build-wasm
	<<run-js-openapi>>

test-js-openapi:
	<<test-js-openapi>>

run-js-threaded: build-wasm
	<<run-js-threaded>>

test-js-threaded:
	<<test-js-threaded>>

react/worker.js:
	<<link-worker>>

test-react: react/worker.js
	<<test-react>>

init-git-hook:
	<<hook-permission>>
	<<init-git-hook>>

check: entangle
	git diff-index --quiet HEAD --
# TODO entangled always OK due to entangle target being run before. `make check` should not have entangle target called.
#check:
#	docker run --rm --user ${UID} -v ${PWD}:/data nlesc/entangled -c tangle -a
```

For example the Python dependencies can be installed with

```shell
make py-deps
```

See [GitHub Actions workflow](.github/workflows/main.yml) and [CONTRIBUTING.md](CONTRIBUTING.md) for other usages of the Makefile.
