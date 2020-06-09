# this Makefile snippet is stored as Makefile
.PHONY: clean clean-compiled clean-entangled test all check entangle entangle-list py-deps start-redis stop-redis run-webservice run-celery-webapp run-webapp build-wasm host-files test-wasm

UID := $(shell id -u)
# Prevent suicide by excluding Makefile
ENTANGLED := $(shell perl -ne 'print $$1,"\n" if /^```\{.*file=(.*)\}/' *.md | grep -v Makefile | sort -u)
COMPILED := cli/newtonraphson.exe src/py/newtonraphsonpy.*.so cgi/apache2/cgi-bin/newtonraphson src/js/newtonraphsonwasm.js  src/js/newtonraphsonwasm.wasm

entangle: *.md
	docker run --rm --user ${UID} -v ${PWD}:/data nlesc/pandoc-tangle:0.5.0 --preserve-tabs *.md

$(ENTANGLED): entangle

entangled-list:
	@echo $(ENTANGLED)

py-deps: pip-pybind11 pip-flask pip-celery pip-connexion

pip-pybind11:
	pip install pybind11

pip-flask:
	pip install flask

pip-celery:
	pip install celery[redis]

pip-connexion:
	pip install connexion[swagger-ui]

cli/newtonraphson.exe: cli/cli-newtonraphson.cpp
	g++ cli/cli-newtonraphson.cpp -o cli/newtonraphson.exe

test-cli: cli/newtonraphson.exe
	./cli/newtonraphson.exe

cgi/apache2/cgi-bin/newtonraphson: cgi/cgi-newtonraphson.cpp
	g++ -Icgi/deps/ -Icli/ cgi/cgi-newtonraphson.cpp -o cgi/apache2/cgi-bin/newtonraphson

test-cgi: cgi/apache2/cgi-bin/newtonraphson
	echo '{"guess":-20, "epsilon":0.001}' | cgi/apache2/cgi-bin/newtonraphson

src/py/newtonraphsonpy.*.so: src/py-newtonraphson.cpp
	g++ -O3 -Wall -shared -std=c++14 -fPIC `python3 -m pybind11 --includes` \
	src/py-newtonraphson.cpp -o src/py/newtonraphsonpy`python3-config --extension-suffix`

test-py: src/py/example.py src/py/newtonraphsonpy.*.so
	python src/py/example.py

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
	docker run --rm -d -p 6379:6379 --name some-redis redis

stop-redis:
	docker stop some-redis

run-webapp: src/py/newtonraphsonpy.*.so
	python src/py/webapp.py

run-webservice: src/py/newtonraphsonpy.*.so
	python src/py/webservice.py

test-webservice:
	curl -X POST "http://localhost:8080/api/newtonraphson" -H "accept: application/json" -H "Content-Type: application/json" -d "{\"epsilon\":0.001,\"guess\":-20}"

run-celery-worker: src/py/newtonraphsonpy.*.so
	PYTHONPATH=src/py celery worker -A tasks

run-celery-webapp: src/py/newtonraphsonpy.*.so
	python src/py/webapp-celery.py

build-wasm: src/js/newtonraphsonwasm.js src/js/newtonraphsonwasm.wasm

src/js/newtonraphsonwasm.js src/js/newtonraphsonwasm.wasm: src/wasm-newtonraphson.cpp
	emcc --bind -o src/js/newtonraphsonwasm.js -s MODULARIZE=1 -s EXPORT_NAME=createModule src/wasm-newtonraphson.cpp

host-files: build-wasm
	python3 -m http.server 8000

test-wasm:
	npx cypress run --config-file false

init-git-hook:
	chmod +x .githooks/pre-commit
	git config --local core.hooksPath .githooks

check: entangle
	git diff-index --quiet HEAD --