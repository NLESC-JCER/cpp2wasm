# Installation

## Dependencies

To run the commands in the README.md the following items are required

1. GNU C++ compiler (`g++`) and `make`, install with `sudo apt install -y build-essential`
1. [Apache httpd server 2.4](http://httpd.apache.org/), install with `sudo apt install -y apache2`
1. Python development, install with `sudo apt install -y python3-dev`
1. [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html)
1. [Docker Engine](https://docs.docker.com/install/), setup so `docker` command can be run [without sudo](https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user).
1. [Perl](https://www.perl.org/), already installed on Linux

## Command collection

All the commands in the [README.md](README.md) and [CONTRIBUTING.md](CONTRIBUTING.md) can be captured in a [Makefile](https://en.wikipedia.org/wiki/Makefile) like so:

```{.makefile file=Makefile}
# this Makefile snippet is stored as Makefile
.PHONY: clean clean-compiled clean-entangled test all check entangle entangle-list py-deps start-redis stop-redis run-webservice run-celery-webapp run-webapp build-wasm host-files test-wasm

UID := $(shell id -u)
# Prevent suicide by excluding Makefile
ENTANGLED := $(shell perl -ne 'print $$1,"\n" if /^```\{.*file=(.*)\}/' *.md | grep -v Makefile | sort -u)
COMPILED := cli/newtonraphson.exe openapi/newtonraphsonpy.*.so cgi/apache2/cgi-bin/newtonraphson webassembly/newtonraphsonwasm.js  webassembly/newtonraphsonwasm.wasm

entangle: *.md
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

cli/newtonraphson.exe: cli/cli-newtonraphson.cpp
	<<build-cli>>

test-cli: cli/newtonraphson.exe
	<<test-cli>>

cgi/apache2/cgi-bin/newtonraphson: cgi/cgi-newtonraphson.cpp
	<<build-cgi>>

test-cgi: cgi/apache2/cgi-bin/newtonraphson
	<<test-cgi>>

openapi/newtonraphsonpy.*.so: openapi/py-newtonraphson.cpp
	<<build-py>>

test-py: openapi/example.py openapi/newtonraphsonpy.*.so
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

run-webapp: openapi/newtonraphsonpy.*.so
	<<run-webapp>>

run-webservice: openapi/newtonraphsonpy.*.so
	<<run-webservice>>

test-webservice:
	<<test-webservice>>

run-celery-worker: openapi/newtonraphsonpy.*.so
	<<run-celery-worker>>

run-celery-webapp: openapi/newtonraphsonpy.*.so
	<<run-celery-webapp>>

build-wasm: webassembly/newtonraphsonwasm.js webassembly/newtonraphsonwasm.wasm

webassembly/newtonraphsonwasm.js webassembly/newtonraphsonwasm.wasm: webassembly/wasm-newtonraphson.cpp
	<<build-wasm>>

host-files: build-wasm
	<<host-files>>

test-wasm:
	<<test-wasm>>

init-git-hook:
	<<hook-permission>>
	<<init-git-hook>>

check: entangle
	git diff-index --quiet HEAD --
```

For example the Python dependencies can be installed with

```shell
make py-deps
```

See [GitHub Actions workflow](.github/workflows/main.yml) and [CONTRIBUTING.md](CONTRIBUTING.md) for other usages of the Makefile.
