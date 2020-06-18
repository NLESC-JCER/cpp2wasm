# this Makefile snippet is stored as Makefile
.PHONY: clean clean-compiled clean-entangled test all entangle entangle-list py-deps test-cgi test-cli test-py start-redis stop-redis run-webservice test-webservice run-celery-worker run-celery-webapp run-webapp build-wasm host-webassembly-files host-react-files test-webassembly test-react init-git-hook check test-wasm-cli npm-fopenapi-deps npm-fastify npm-openapi run-js-webservice test-js-webservice test-js-webservice-invalid test-js-openapi run-js-openapi test-js-openapi npm-threaded run-js-threaded test-js-threaded

UID := $(shell id -u)
# Prevent suicide by excluding Makefile
ENTANGLED := $(shell perl -ne 'print $$1,"\n" if /^```\{.*file=(.*)\}/' *.md | grep -v Makefile | sort -u)
COMPILED := cli/newtonraphson.exe openapi/newtonraphsonpy.*.so flask/newtonraphsonpy.*.so cgi/apache2/cgi-bin/newtonraphson webassembly/newtonraphsonwasm.js webassembly/newtonraphsonwasm.wasm react/newtonraphsonwasm.js react/newtonraphsonwasm.wasm

entangle: *.md
	docker run --rm --user ${UID} -v ${PWD}:/data nlesc/pandoc-tangle:0.5.0 --preserve-tabs *.md

$(ENTANGLED): entangle

entangled-list:
	@echo $(ENTANGLED)

flask-deps: pip-pybind11 pip-celery pip-flask

openapi-deps: pip-pybind11 pip-connexion

py-deps: flask-deps openapi-deps

pip-pybind11:
	pip install pybind11

pip-flask:
	pip install flask

pip-celery:
	pip install celery[redis]

pip-connexion:
	pip install connexion[swagger-ui]

cli/newtonraphson.exe:
	g++ cli/cli-newtonraphson.cpp -o cli/newtonraphson.exe

test-cli: cli/newtonraphson.exe
	./cli/newtonraphson.exe

cgi/apache2/cgi-bin/newtonraphson:
	g++ -Icgi/deps/ -Icli/ cgi/cgi-newtonraphson.cpp -o cgi/apache2/cgi-bin/newtonraphson

test-cgi: cgi/apache2/cgi-bin/newtonraphson
	echo '{"guess":-20, "epsilon":0.001}' | cgi/apache2/cgi-bin/newtonraphson

openapi/newtonraphsonpy.*.so:
	g++ -O3 -Wall -shared -std=c++14 -fPIC -Icli/ `python3 -m pybind11 --includes` \
	openapi/py-newtonraphson.cpp -o openapi/newtonraphsonpy`python3-config --extension-suffix`

flask/newtonraphsonpy.*.so: openapi/newtonraphsonpy.*.so
	cd flask && ln -s ../openapi/newtonraphsonpy`python3-config --extension-suffix` . && cd -

test-py: openapi/newtonraphsonpy.*.so
	python openapi/example.py

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

run-webapp: flask/newtonraphsonpy.*.so
	python flask/webapp.py

run-webservice: openapi/newtonraphsonpy.*.so
	python openapi/webservice.py

test-webservice:
	curl --request POST \
	  --header "accept: application/json" \
	  --header "Content-Type: application/json" \
	  --data '{"epsilon":0.001,"guess":-20}' \
	  http://localhost:8080/api/newtonraphson

run-celery-worker: flask/newtonraphsonpy.*.so
	PYTHONPATH=flask celery worker -A tasks

run-celery-webapp:
	python flask/webapp-celery.py

build-wasm: webassembly/newtonraphsonwasm.js webassembly/newtonraphsonwasm.wasm

webassembly/newtonraphsonwasm.js webassembly/newtonraphsonwasm.wasm:
	emcc -Icli/ -o webassembly/newtonraphsonwasm.js \
	  -s MODULARIZE=1 -s EXPORT_NAME=createModule \
	  --bind webassembly/wasm-newtonraphson.cpp

react/newtonraphsonwasm.wasm: webassembly/newtonraphsonwasm.wasm
	cd react && ln -s ../webassembly/newtonraphsonwasm.wasm . && cd -

react/newtonraphsonwasm.js: webassembly/newtonraphsonwasm.js
	cd react && ln -s ../webassembly/newtonraphsonwasm.js . && cd -

test-wasm-cli: build-wasm
	node webassembly/cli.js 0.01 -20

host-webassembly-files: build-wasm
	python3 -m http.server 8000

host-react-files: react/newtonraphsonwasm.js react/newtonraphsonwasm.wasm
	python3 -m http.server 8000

test-webassembly:
	npx cypress run --config-file false --spec 'cypress/integration/webassembly/*_spec.js'

js-deps: npm-fastify npm-openapi npm-threaded

npm-fastify:
	npm install --no-save fastify

npm-openapi:
	npm install --no-save fastify-oas

npm-threaded:
	npm install --no-save node-worker-threads-pool

run-js-webservice: build-wasm
	node webassembly/webservice.js

test-js-webservice:
	curl --request POST \
	  --header "accept: application/json" \
	  --header "Content-Type: application/json" \
	  --data '{"epsilon":0.001,"guess":-20}' \
	  http://localhost:3000/api/newtonraphson

test-js-webservice-invalid:
	wget --content-on-error --quiet --output-document=- \
	  --header="accept: application/json" \
	  --header="Content-Type: application/json" \
	  --post-data '{"epilon":0.001,"guess":-20}' \
	  http://localhost:3000/api/newtonraphson

run-js-openapi: build-wasm
	node webassembly/openapi.js

test-js-openapi:
	curl --request POST \
	  --header "Content-Type: application/json" \
	  --header "accept: application/json" \
	  --data '{"guess":-20, "epsilon":0.001}' \
	  http://localhost:3001/api/newtonraphson

run-js-threaded: build-wasm
	node webassembly/webservice-threaded.js

test-js-threaded:
	curl --request POST \
	  --header "Content-Type: application/json" \
	  --header "accept: application/json" \
	  --data '{"guess":-20, "epsilon":0.001}' \
	  http://localhost:3002/api/newtonraphson

react/worker.js:
	cd react && ln -s ../webassembly/worker.js . && cd -

test-react: react/worker.js
	npx cypress run --config-file false --spec 'cypress/integration/react/*_spec.js'

init-git-hook:
	chmod +x .githooks/pre-commit
	git config --local core.hooksPath .githooks

check: entangle
	git diff-index --quiet HEAD --