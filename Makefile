## ------ language="Make" file="Makefile"
.PHONY: clean test entangle py-deps start-redis stop-redis run-webservice run-celery-webapp run-webapp

py-deps: pip-pybind11 pip-flask pip-celery pip-connexion

pip-pybind11:
	## ------ begin <<pip-pybind11>>[0]
	pip install pybind11
	## ------ end

pip-flask:
	## ------ begin <<pip-flask>>[0]
	pip install flask
	## ------ end

pip-celery:
	## ------ begin <<pip-celery>>[0]
	pip install celery[redis]
	## ------ end

pip-connexion:
	## ------ begin <<pip-connexion>>[0]
	pip install connexion[swagger-ui]
	## ------ end

newtonraphson.exe: cli-newtonraphson.cpp
	## ------ begin <<build-cli>>[0]
	g++ cli-newtonraphson.cpp -o newtonraphson.exe
	## ------ end

test-cli: newtonraphson.exe
	## ------ begin <<test-cli>>[0]
	./newtonraphson.exe
	## ------ end

cgi-bin/newtonraphson: cgi-newtonraphson.cpp
	## ------ begin <<build-cgi>>[0]
	g++ -Ideps cgi-newtonraphson.cpp -o ./cgi-bin/newtonraphson
	## ------ end

test-cgi: cgi-bin/newtonraphson
	## ------ begin <<test-cgi>>[0]
	echo '{"guess":-20, "epsilon":0.001}' | ./cgi-bin/newtonraphson
	## ------ end

newtonraphsonpy.*.so: py-newtonraphson.cpp
	## ------ begin <<build-py>>[0]
	g++ -O3 -Wall -shared -std=c++14 -fPIC `python3 -m pybind11 --includes` \
	py-newtonraphson.cpp -o newtonraphsonpy`python3-config --extension-suffix`
	## ------ end

test-py: src/py/example.py newtonraphsonpy.*.so
	PYTHONPATH=${PWD} python src/py/example.py

test: test-cli test-cgi test-py test-webservice

clean:
	$(RM) newtonraphson.exe newtonraphsonpy.*.so cgi-bin/newtonraphson

start-redis:
	## ------ begin <<start-redis>>[0]
	docker run --rm -d -p 6379:6379 --name some-redis redis
	## ------ end

stop-redis:
	## ------ begin <<stop-redis>>[0]
	docker stop some-redis
	## ------ end

run-webapp: newtonraphsonpy.*.so
	## ------ begin <<run-webapp>>[0]
	PYTHONPATH=${PWD} python src/py/webapp.py
	## ------ end

run-webservice: newtonraphsonpy.*.so
	## ------ begin <<run-webservice>>[0]
	PYTHONPATH=${PWD} python src/py/webservice.py
	## ------ end

test-webservice:
	## ------ begin <<test-webservice>>[0]
	curl -X POST "http://localhost:8080/api/newtonraphson" -H "accept: application/json" -H "Content-Type: application/json" -d "{\"epsilon\":0.001,\"guess\":-20}"
	## ------ end

# Unable to get worker runnig correctly from Makefile, the newtonraphsonpy.*.so cannot be found
run-celery-worker: newtonraphsonpy.*.so
	## ------ begin <<run-celery-worker>>[0]
	celery worker --workdir src/py --app tasks
	## ------ end

run-celery-webapp: newtonraphsonpy.*.so
	## ------ begin <<run-celery-webapp>>[0]
	PYTHONPATH=${PWD} python src/py/webapp-celery.py
	## ------ end
## ------ end
