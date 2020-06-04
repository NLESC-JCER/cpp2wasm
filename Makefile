# ~\~ language=Make filename=Makefile
# ~\~ begin <<INSTALL.md|Makefile>>[0]
# this Makefile snippet is stored as Makefile
.PHONY: clean clean-compiled clean-entangled test all check entangle entangle-list py-deps start-redis stop-redis run-webservice run-celery-webapp run-webapp build-wasm host-files test-wasm

UID := $(shell id -u)
# Prevent suicide by excluding Makefile
ENTANGLED := $(shell docker run --rm --user ${UID} -v ${PWD}:/data nlesc/entangled list)
COMPILED := bin/newtonraphson.exe src/py/newtonraphsonpy.*.so apache2/cgi-bin/newtonraphson src/js/newtonraphsonwasm.js  src/js/newtonraphsonwasm.wasm

entangle: *.md
	# ~\~ begin <<CONTRIBUTING.md|entangled-tangle>>[0]
	docker run --rm --user ${UID} -v ${PWD}:/data nlesc/entangled insert -s *.md
	docker run --rm --user ${UID} -v ${PWD}:/data nlesc/entangled tangle -a
	# ~\~ end

$(ENTANGLED): entangle

entangled-list:
	@echo $(ENTANGLED)

py-deps: pip-pybind11 pip-flask pip-celery pip-connexion

pip-pybind11:
	# ~\~ begin <<README.md|pip-pybind11>>[0]
	pip install pybind11
	# ~\~ end

pip-flask:
	# ~\~ begin <<README.md|pip-flask>>[0]
	pip install flask
	# ~\~ end

pip-celery:
	# ~\~ begin <<README.md|pip-celery>>[0]
	pip install celery[redis]==4.4.3
	# ~\~ end

pip-connexion:
	# ~\~ begin <<README.md|pip-connexion>>[0]
	pip install connexion[swagger-ui]
	# ~\~ end

bin/newtonraphson.exe: src/cli-newtonraphson.cpp
	# ~\~ begin <<README.md|build-cli>>[0]
	g++ src/cli-newtonraphson.cpp -o bin/newtonraphson.exe
	# ~\~ end

test-cli: bin/newtonraphson.exe
	# ~\~ begin <<README.md|test-cli>>[0]
	./bin/newtonraphson.exe
	# ~\~ end

apache2/cgi-bin/newtonraphson: src/cgi-newtonraphson.cpp
	# ~\~ begin <<README.md|build-cgi>>[0]
	g++ -Ideps src/cgi-newtonraphson.cpp -o apache2/cgi-bin/newtonraphson
	# ~\~ end

test-cgi: apache2/cgi-bin/newtonraphson
	# ~\~ begin <<README.md|test-cgi>>[0]
	echo '{"guess":-20, "epsilon":0.001}' | apache2/cgi-bin/newtonraphson
	# ~\~ end

src/py/newtonraphsonpy.*.so: src/py-newtonraphson.cpp
	# ~\~ begin <<README.md|build-py>>[0]
	g++ -O3 -Wall -shared -std=c++14 -fPIC `python3 -m pybind11 --includes` \
	src/py-newtonraphson.cpp -o src/py/newtonraphsonpy`python3-config --extension-suffix`
	# ~\~ end

test-py: src/py/example.py src/py/newtonraphsonpy.*.so
	# ~\~ begin <<README.md|test-py>>[0]
	python src/py/example.py
	# ~\~ end

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
	# ~\~ begin <<README.md|start-redis>>[0]
	docker run --rm -d -p 6379:6379 --name some-redis redis
	# ~\~ end

stop-redis:
	# ~\~ begin <<README.md|stop-redis>>[0]
	docker stop some-redis
	# ~\~ end

run-webapp: src/py/newtonraphsonpy.*.so
	# ~\~ begin <<README.md|run-webapp>>[0]
	python src/py/webapp.py
	# ~\~ end

run-webservice: src/py/newtonraphsonpy.*.so
	# ~\~ begin <<README.md|run-webservice>>[0]
	python src/py/webservice.py
	# ~\~ end

test-webservice:
	# ~\~ begin <<README.md|test-webservice>>[0]
	curl -X POST "http://localhost:8080/api/newtonraphson" -H "accept: application/json" -H "Content-Type: application/json" -d "{\"epsilon\":0.001,\"guess\":-20}"
	# ~\~ end

run-celery-worker: src/py/newtonraphsonpy.*.so
	# ~\~ begin <<README.md|run-celery-worker>>[0]
	PYTHONPATH=src/py celery worker -A tasks
	# ~\~ end

run-celery-webapp: src/py/newtonraphsonpy.*.so
	# ~\~ begin <<README.md|run-celery-webapp>>[0]
	python src/py/webapp-celery.py
	# ~\~ end

build-wasm: src/js/newtonraphsonwasm.js src/js/newtonraphsonwasm.wasm

src/js/newtonraphsonwasm.js src/js/newtonraphsonwasm.wasm: src/wasm-newtonraphson.cpp
	# ~\~ begin <<README.md|build-wasm>>[0]
	emcc --bind -o src/js/newtonraphsonwasm.js -s MODULARIZE=1 -s EXPORT_NAME=createModule src/wasm-newtonraphson.cpp
	# ~\~ end

host-files: build-wasm
	# ~\~ begin <<README.md|host-files>>[0]
	python3 -m http.server 8000
	# ~\~ end

test-wasm:
	# ~\~ begin <<TESTING.md|test-wasm>>[0]
	npx cypress run --config-file false
	# ~\~ end

init-git-hook:
	# ~\~ begin <<CONTRIBUTING.md|hook-permission>>[0]
	chmod +x .githooks/pre-commit
	# ~\~ end
	# ~\~ begin <<CONTRIBUTING.md|init-git-hook>>[0]
	git config --local core.hooksPath .githooks
	# ~\~ end

check: entangle
	git diff-index --quiet HEAD --
# TODO entangled always OK due to entangle target being run before. `make check` should not have entangle target called.
#check:
#	docker run --rm --user ${UID} -v ${PWD}:/data nlesc/entangled -c tangle -a
# ~\~ end
