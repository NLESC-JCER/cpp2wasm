.PHONY: clean test entangle py-deps start-redis stop-redis

py-deps: pip-pybind11 pip-flask pip-celery pip-connexion

pip-pybind11:
    pip install pybind11

pip-flask:
    pip install flask

pip-celery:
    pip install celery[redis]

pip-connexion:
    <pip-connexion>>

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
    python example.py

test: test-cli test-cgi test-py

clean:
    $(RM) newtonraphson.exe newtonraphsonpy.*.so cgi-bin/newtonraphson

start-redis:
    docker run --rm -d -p 6379:6379 --name some-redis redis

stop-redis:
    docker stop some-redis