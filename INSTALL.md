# Installation

## Dependencies

To run the commands in the README.md the following items are required

1. Apache httpd server 2.4
1. Python libraries `pip install flask pybind11 celery connexion`
1. Python devel with `sudo apt install python3-dev`
1. Emscriptem

## Generating code from Markdown

1. Install [entangled](https://github.com/entangled/entangled)
2. Run entangled daemon with

```shell
entangled README.md
```

## C++ dependencies

The `deps/` directory contains C++ dependencies.

They where downloaded by

```shell
mkdir -p deps/nmlohmann
cd deps/nmlohmann
wget https://github.com/nlohmann/json/releases/download/v3.7.3/json.hpp
cd -
cd deps
svn export --force https://github.com/pboettch/json-schema-validator/trunk/src/ .
```
