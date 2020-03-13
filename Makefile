.PHONY: clean test entangle py-deps start-redis stop-redis run-webservice run-celery-webapp run-webapp

py-deps: pip-pybind11 pip-flask pip-celery pip-connexion

pip-pybind11:
	pip install pybind11

pip-flask:
	pip install flask

pip-celery:
	pip install celery[redis]

pip-connexion:
	pip install connexion[swagger-ui]

newtonraphson.exe: cli-newtonraphson.cpp
	g++ cli-newtonraphson.cpp -o newtonraphson.exe

test-cli: newtonraphson.exe
	./newtonraphson.exe

cgi-bin/newtonraphson: cgi-newtonraphson.cpp
	g++ -Ideps cgi-newtonraphson.cpp -o ./cgi-bin/newtonraphson

test-cgi: cgi-bin/newtonraphson
	echo '{"guess":-20, "epsilon":0.001}' | ./cgi-bin/newtonraphson

newtonraphsonpy.*.so: py-newtonraphson.cpp
	g++ -O3 -Wall -shared -std=c++14 -fPIC `python3 -m pybind11 --includes` \
	py-newtonraphson.cpp -o newtonraphsonpy`python3-config --extension-suffix`

test-py: example.py newtonraphsonpy.*.so
	PYTHONPATH=${PWD} python src/py/example.py

test: test-cli test-cgi test-py test-webservice

clean:
	$(RM) newtonraphson.exe newtonraphsonpy.*.so cgi-bin/newtonraphson

start-redis:
	docker run --rm -d -p 6379:6379 --name some-redis redis

stop-redis:
	docker stop some-redis

run-webapp: newtonraphsonpy.*.so
	PYTHONPATH=${PWD} python src/py/webapp.py

run-webservice: newtonraphsonpy.*.so
	PYTHONPATH=${PWD} python src/py/webservice.py

test-webservice:
	curl -X POST "http://localhost:8080/api/newtonraphson" -H "accept: application/json" -H "Content-Type: application/json" -d "{\"epsilon\":0.001,\"guess\":-20}"

# Unable to get worker runnig correctly from Makefile, the newtonraphsonpy.*.so cannot be found
# run-celery-worker: newtonraphsonpy.*.so
#   <<run-celery-worker>>

run-celery-webapp: newtonraphsonpy.*.so
	PYTHONPATH=${PWD} python src/py/webapp-celery.py