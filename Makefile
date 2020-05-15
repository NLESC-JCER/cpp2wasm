.PHONY: clean test entangle py-deps start-redis stop-redis run-webservice run-celery-webapp run-webapp build-wasm host-files test-wasm

py-deps: pip-pybind11 pip-flask pip-celery pip-connexion

pip-pybind11:
	pip install pybind11

pip-flask:
	pip install flask

pip-celery:
	pip install celery[redis]

pip-connexion:
	pip install connexion[swagger-ui]

bin/newtonraphson.exe: src/cli-newtonraphson.cpp
	g++ src/cli-newtonraphson.cpp -o bin/newtonraphson.exe

test-cli: bin/newtonraphson.exe
	./bin/newtonraphson.exe

apache2/cgi-bin/newtonraphson: src/cgi-newtonraphson.cpp
	g++ -Ideps src/cgi-newtonraphson.cpp -o apache2/cgi-bin/newtonraphson

test-cgi: apache2/cgi-bin/newtonraphson
	echo '{"guess":-20, "epsilon":0.001}' | apache2/cgi-bin/newtonraphson

src/py/newtonraphsonpy.*.so: src/py-newtonraphson.cpp
	g++ -O3 -Wall -shared -std=c++14 -fPIC `python3 -m pybind11 --includes` \
	src/py-newtonraphson.cpp -o src/py/newtonraphsonpy`python3-config --extension-suffix`

test-py: src/py/example.py src/py/newtonraphsonpy.*.so
	python src/py/example.py

test: test-cli test-cgi test-py test-webservice

# Removes the compiled files
clean:
	$(RM) bin/newtonraphson.exe src/py/newtonraphsonpy.*.so apache2/cgi-bin/newtonraphson src/js/newtonraphsonwasm.js  src/js/newtonraphsonwasm.wasm

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