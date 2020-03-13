# Installation

![CI](https://github.com/NLESC-JCER/cpp2wasm/workflows/CI/badge.svg)

## Dependencies

To run the commands in the README.md the following items are required

1. [Apache httpd server 2.4](http://httpd.apache.org/) with `sudo apt install -y apache2`
1. Python devel with `sudo apt install -y python3-dev`
1. [Emscriptem](https://emscripten.org/docs/getting_started/downloads.html)
1. [Docker Engine](https://docs.docker.com/install/)

## Generating code from Markdown

Entangled is used to convert code blocks in Markdown to source code files.

1. Install [entangled](https://github.com/entangled/entangled)
2. Run entangled daemon with

```shell
entangled README.md INSTALL.md
```

Or the [Entangled - Pandoc filters](https://github.com/entangled/filters) Docker image can be used

```shell
docker run --rm -ti --user $(id -u) -v ${PWD}:/data nlesc/pandoc-tangle README.md INSTALL.md
```

## Command collection

All the commands in the README.md can be captured in a Makefile like so:

```{.makefile file=Makefile}
.PHONY: clean test entangle py-deps start-redis stop-redis run-webservice run-celery-webapp run-webapp

py-deps: pip-pybind11 pip-flask pip-celery pip-connexion

pip-pybind11:
	<<pip-pybind11>>

pip-flask:
	<<pip-flask>>

pip-celery:
	<<pip-celery>>

pip-connexion:
	<<pip-connexion>>

newtonraphson.exe: cli-newtonraphson.cpp
	<<build-cli>>

test-cli: newtonraphson.exe
	<<test-cli>>

cgi-bin/newtonraphson: cgi-newtonraphson.cpp
	<<build-cgi>>

test-cgi: cgi-bin/newtonraphson
	<<test-cgi>>

newtonraphsonpy.*.so: py-newtonraphson.cpp
	<<build-py>>

test-py: src/py/example.py newtonraphsonpy.*.so
	PYTHONPATH=${PWD} python src/py/example.py

test: test-cli test-cgi test-py test-webservice

clean:
	$(RM) newtonraphson.exe newtonraphsonpy.*.so cgi-bin/newtonraphson

start-redis:
	<<start-redis>>

stop-redis:
	<<stop-redis>>

run-webapp: newtonraphsonpy.*.so
	<<run-webapp>>

run-webservice: newtonraphsonpy.*.so
	<<run-webservice>>

test-webservice:
	<<test-webservice>>

# Unable to get worker runnig correctly from Makefile, the newtonraphsonpy.*.so cannot be found
# run-celery-worker: newtonraphsonpy.*.so
#	<<run-celery-worker>>

run-celery-webapp: newtonraphsonpy.*.so
	<<run-celery-webapp>>
```

For example the Python dependencies can be installed with

```shell
make py-deps
```

See [GitHub Actions workflow](.github/workflows/main.yml) for other usages of the Makefile.
