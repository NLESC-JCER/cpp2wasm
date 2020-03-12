# Installation

## Dependencies

To run the commands in the README.md the following items are required

1. [Apache httpd server 2.4](http://httpd.apache.org/)
1. Python libraries `pip install flask pybind11 celery redis connexion[swagger-ui]`
1. Python devel with `sudo apt install python3-dev`
1. [Emscriptem](https://emscripten.org/docs/getting_started/downloads.html)

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
.PHONY: clean test entangle

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

test-py: example.py newtonraphsonpy.*.so
	python example.py

test: test-cli test-cgi test-py

clean:
	$(RM) newtonraphson.exe newtonraphsonpy.*.so cgi-bin/newtonraphson
```
