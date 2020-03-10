.PHONY: clean test entangle

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

entangle: README.md INSTALL.md
	docker run --rm -ti --user $$(id -u) -v ${PWD}:/data nlesc/pandoc-tangle README.md INSTALL.md