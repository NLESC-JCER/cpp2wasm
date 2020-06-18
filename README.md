# Guide to make C++ available as a web application

[![CI](https://github.com/NLESC-JCER/cpp2wasm/workflows/CI/badge.svg)](https://github.com/NLESC-JCER/cpp2wasm/actions?query=workflow%3ACI)
[![Markdown Link Checker](https://github.com/NLESC-JCER/cpp2wasm/workflows/Check%20Markdown%20links/badge.svg)](https://github.com/NLESC-JCER/cpp2wasm/actions?query=workflow%3A%22Check%20Markdown%20links%22)
[![Entangled](https://img.shields.io/badge/entangled-Use%20the%20source!-%2300aeff)](https://entangled.github.io/)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.3876112.svg)](https://doi.org/10.5281/zenodo.3876112)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=NLESC-JCER_cpp2wasm&metric=alert_status)](https://sonarcloud.io/dashboard?id=NLESC-JCER_cpp2wasm)

In this guide, we will describe 5 ways to make your C++ code available as a web application or web wervice

1. [Web service using Common Gateway Interface](#web-service-using-common-gateway-interface),
1. [Python web service using pybind11 and OpenAPI](#python-web-service),
1. [Python web application using Flask and Celery](#python-web-application-using-flask),
1. [JavaScript web service using Emscripten and Fastify](#javascript-web-service),
1. [JavaScript web application using web worker and React](#javascript-web-application)

This guide was written and tested on Linux operating system. The required dependencies to run this guide are described
in the [INSTALL.md](INSTALL.md) document. If you want to contribute to the guide see [CONTRIBUTING.md](CONTRIBUTING.md).
The [repo](https://github.com/NLESC-JCER/cpp2wasm) contains the files that can be made from the code snippets in this
guide. The code snippets can be [entangled](https://entangled.github.io/) to files using any of
[these](CONTRIBUTING.md#tips) methods.

A web application is meant for consumption by humans using [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML) pages and a web service is meant for consumption by machines or other
programs. A web service will accept and return machine readable documents like [JSON (JavaScript Object Notation)](https://www.json.org/) documents. JSON is a open standard file format and data interchange format that is human-readable.

## Example program: Newton-Raphson root finding

The [Newton-Raphson root finding algorithm](https://en.wikipedia.org/wiki/Newton%27s_method) will be the use case. The
algorithm is explained in [this video series](https://www.youtube.com/watch?v=cOmAk82cr9M). The code we are using came
from [geeksforgeeks.org](https://www.geeksforgeeks.org/program-for-newton-raphson-method/).

Let's first define the mathematical equation and its derivative, which we need in order to find the root.

The equation and its derivative which we will use in this guide are $x^3 - x^2 + 2$ and $3x^2 - 2x$ respectively. The
root is the value (x-coordinate) which makes the mathematical equation (y-coordinate) equal to `0`. In this equation the
root is `-1`.

[![Plotted equation](images/equation.svg)](https://www.wolframalpha.com/input/?i=x%5E3+-+x%5E2+%2B+2)

```{.hpp file=cli/algebra.hpp}
// this C++ code snippet is store as cli/algebra.hpp

namespace algebra
{

// An example equation is x^3 - x^2  + 2
double equation(double x)
{
  return x * x * x - x * x + 2;
}

// Derivative of the above equation which is 3*x^2 - 2*x
double derivative(double x)
{
  return 3 * x * x - 2 * x;
}

} // namespace algebra
```

Next, we define the interface (C++ class).

```{.cpp file=cli/newtonraphson.hpp}
// this C++ snippet is stored as cli/newtonraphson.hpp
#ifndef H_NEWTONRAPHSON_H
#define H_NEWTONRAPHSON_H

#include <string>

namespace rootfinding {
  class NewtonRaphson {
    public:
      NewtonRaphson(double tolerancein);
      double solve(double xin);
    private:
      double tolerance;
  };
}

#endif
```

In this C++ class, `solve` function will be performing the root finding task. We now need to define the algorithm so
that `solve` function does what it supposed to do.

The implementation of the algorithm is

```{.cpp #algorithm}
// this C++ code snippet is later referred to as <<algorithm>>
#include "newtonraphson.hpp"
#include "algebra.hpp"
#include <math.h>

using namespace algebra;

namespace rootfinding
{

NewtonRaphson::NewtonRaphson(double tolerancein) : tolerance(tolerancein) {}

// Function to find the root
double NewtonRaphson::solve(double xin)
{
  double x = xin;
  double delta_x = equation(x) / derivative(x);

  while (fabs(delta_x) >= tolerance)
  {
    delta_x = equation(x) / derivative(x);

    // x_new = x_old - f(x) / f'(x)
    x = x - delta_x;
  }
  return x;
};


} // namespace rootfinding
```

We are now ready to call the algorithm in a simple CLI program, as follows

```{.cpp file=cli/cli-newtonraphson.cpp}
// this C++ snippet is stored as cli/newtonraphson.cpp
#include<bits/stdc++.h>
#include <iomanip>

<<algorithm>>

// Driver program to test above
int main()
{
  double x0 = -20; // Initial values assumed
  double epsilon = 0.001;
  rootfinding::NewtonRaphson finder(epsilon);
  double x1 = finder.solve(x0);

  std::cout << std::fixed;
  std::cout << std::setprecision(6);
  std::cout << "The value of the root is : " << x1 << std::endl;

  return 0;
}
```

The program can be compiled with

```{.awk #build-cli}
g++ cli/cli-newtonraphson.cpp -o cli/newtonraphson.exe
```

and it can be run with

```{.awk #test-cli}
./cli/newtonraphson.exe
```

It should return the following

```shell
The value of the root is : -1.000000
```

## Web service using Common Gateway Interface

![cgi](images/cgi.svg.png "CGI")

| Pros | Cons |
| --- | --- |
| :heart: Very few moving parts, just C++ and Apache web server | :no_entry: Complicated Apache web server configuration |
| :heart: Proven technology | :no_entry: Not suitable for long initialization or calculations |

The classic way to run programs when accessing a url is to use the Common Gateway Interface (CGI). In the 
[Apache httpd web server](https://httpd.apache.org/docs/2.4/howto/cgi.html) you can configure a directory as a
`ScriptAlias`, when visiting a file inside that directory the file will be executed. The executable can read the
request body from the `stdin` and the response must be printed to the `stdout`. A response should consist of a
content type such as `application/json` or `text/html`, followed by the content itself.
For the web service, we parse and assemble JSON documents using the [nlohmann/json.hpp](https://github.com/nlohmann/json/) library.

We start writing the CGI script by importing the JSON library and starting the main function.

```{.cpp file=cgi/cgi-newtonraphson.cpp}
// this C++ snippet is stored as cgi/cgi-newtonraphson.hpp
#include <string>
#include <iostream>
#include <nlohmann/json.hpp>

<<algorithm>>

int main(int argc, char *argv[])
{
```

We should parse the JSON request body from the `stdin` to get the `epsilon` and `guess` values.

```{.cpp file=cgi/cgi-newtonraphson.cpp}
  // this C++ snippet is appended to cgi/cgi-newtonraphson.hpp
  nlohmann::json request(nlohmann::json::parse(std::cin));
  double epsilon = request["epsilon"];
  double guess = request["guess"];
```

The root can be found with

```{.cpp file=cgi/cgi-newtonraphson.cpp}
  // this C++ snippet is appended to cgi/cgi-newtonraphson.hpp
  rootfinding::NewtonRaphson finder(epsilon);
  double root = finder.solve(guess);
```

And lastly, return a JSON document with the result

```{.cpp file=cgi/cgi-newtonraphson.cpp}
  // this C++ snippet is appended to cgi/cgi-newtonraphson.hpp
  nlohmann::json response;
  response["root"] = root;
  std::cout << "Content-type: application/json" << std::endl << std::endl;
  std::cout << response.dump(2) << std::endl;
  return 0;
}
```

This can be compiled with

```{.awk #build-cgi}
g++ -Icgi/deps/ -Icli/ cgi/cgi-newtonraphson.cpp -o cgi/apache2/cgi-bin/newtonraphson
```

The CGI script can be tested from the command line

```{.awk #test-cgi}
echo '{"guess":-20, "epsilon":0.001}' | cgi/apache2/cgi-bin/newtonraphson
```

It should output

```shell
Content-type: application/json

{
  "root": -1.0000001181322415
}
```

To host the `cgi/apache2/cgi-bin/newtonraphson` executable as `http://localhost:8080/cgi-bin/newtonraphson` CGI script we have to configure Apache like so

```{.python file=cgi/apache2/apache2.conf}
# this Apache2 configuration snippet is stored as cgi/apache2/apache2.conf
ServerName 127.0.0.1
Listen 8080
LoadModule mpm_event_module /usr/lib/apache2/modules/mod_mpm_event.so
LoadModule authz_core_module /usr/lib/apache2/modules/mod_authz_core.so
LoadModule alias_module /usr/lib/apache2/modules/mod_alias.so
LoadModule cgi_module /usr/lib/apache2/modules/mod_cgi.so
ErrorLog httpd_error_log
PidFile httpd.pid

ScriptAlias "/cgi-bin/" "cgi-bin/"
```

Start Apache httpd web server using

```shell
/usr/sbin/apache2 -X -d ./cgi/apache2
```

To test the [CGI script](http://localhost:8080/cgi-bin/newtonraphson) we can not use a web browser, but need to use http client like [curl](https://curl.haxx.se/).
Because, a web browser uses the [GET http request method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET) and `text/html` as content type, but the CGI script requires a [POST http request method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST) and JSON string as request body.
The curl command with a POST request can be run in another shell with

```shell
curl --request POST \
  --data '{"guess":-20, "epsilon":0.001}' \
  --header "Content-Type: application/json" \
  http://localhost:8080/cgi-bin/newtonraphson
```

Should return the following JSON document as a response

```json
{
  "root":-1.0000001181322415
}
```

Instead of curl, we could use any http client in any language to consume the web service.

The problem with CGI scripts is when the program does some initialization, you have to wait for it on each visit. It is
better to do the initialization once when the web service is starting up.

## Python web service

![openapi](images/openapi.svg.png "OpenAPI")

| Pros | Cons |
| --- | --- |
| :heart: Python is a very popular language and has a large ecosystem | :no_entry: Pure Python is slower than C++ |
| :heart: Web service is easy to discover and effortlessly documented with OpenAPI specification | :no_entry: Exception thrown from C++ has number instead of message   |

Writing a web service in C++ is possible, but other languages like Python are better equipped. Python has a big
community making web applications, which resulted in a big ecosystem of web frameworks, template engines, tutorials.

Python packages can be installed using a package manager (`pip`) from the [Python Package Index](https://pypi.org/). It is customary to work
with [virtual environments](https://packaging.python.org/tutorials/installing-packages/#creating-virtual-environments)
to isolate the dependencies for a certain application and not pollute the global OS paths.

### Accessing C++ functions with pybind11

To make a web application in Python, the C++ functions need to be called somehow. Python can call functions in a C++
library if its functions use [Python.h datatypes](https://docs.python.org/3.7/extending/index.html). This requires a lot
of boilerplate and conversions, several tools are out there that make the boilerplate/conversions much simpler. The tool
we chose to use is [pybind11](https://github.com/pybind/pybind11) as it is currently (May 2020) actively maintained and
is a header-only library.

To use ``pybind11``, it must installed with ``pip``

```{.awk #pip-pybind11}
pip install pybind11
```

``pybind11`` requires bindings to expose C++ constants/functions/enumerations/classes to Python. The bindings are
implemented by using the C++ `PYBIND11_MODULE` macro to configure what will be exposed to Python. The bindings can be
compiled to a shared library called `newtonraphsonpy*.so` which can be imported into Python.

For example, the bindings of `newtonraphson.hpp:NewtonRaphson` class would look like:

```{.cpp file=openapi/py-newtonraphson.cpp}
// this C++ snippet is stored as openapi/py-newtonraphson.cpp
#include <pybind11/pybind11.h>
#include <pybind11/stl.h>

<<algorithm>>

namespace py = pybind11;

PYBIND11_MODULE(newtonraphsonpy, m) {
    py::class_<rootfinding::NewtonRaphson>(m, "NewtonRaphson")
        .def(py::init<double>(), py::arg("epsilon"))
        .def("solve",
             &rootfinding::NewtonRaphson::solve,
             py::arg("guess"),
             "Find root starting from initial guess"
        )
    ;
}
```

Compile with

```{.awk #build-py}
g++ -O3 -Wall -shared -std=c++14 -fPIC -Icli/ `python3 -m pybind11 --includes` \
openapi/py-newtonraphson.cpp -o openapi/newtonraphsonpy`python3-config --extension-suffix`
```

In Python it can be used like so:

```{.python file=openapi/example.py}
# this Python snippet is stored as openapi/example.py
from newtonraphsonpy import NewtonRaphson

finder = NewtonRaphson(epsilon=0.001)
root = finder.solve(guess=-20)
print ("{0:.6f}".format(root))

```

The Python example can be run with

```{.awk #test-py}
python openapi/example.py
```

It will output something like

```shell
-1.0000001181322415
```

Now that the C++ functions can be called from Python it is time to call the function from a web service.

### OpenAPI web service using connexion

A web service has a number of paths or urls to which requests can be sent and responses received. The interface can be
defined with the [OpenAPI specification](https://github.com/OAI/OpenAPI-Specification) (previously known as
[Swagger](https://swagger.io/)). The OpenAPI specification defines how requests and responses should look.
The OpenAPI specifiation can either be generated by the web service provider or be a static document or contract. The
contract-first approach allows for both consumer and provider to come to an agreement on the contract and work more or
less independently on implementation. We will use the contract-first approach for our root finding web service example.

To make a web service which adheres to the OpenAPI specification contract, it is possible to generate a skeleton using
the [generator](https://github.com/OpenAPITools/openapi-generator). Each time the contract changes, the generator must be
re-run. The generator uses the Python based web framework [Connexion](https://github.com/zalando/connexion). For the
Python based root finding web service, Connexion was used as the web framework as it maps each path+method combination
in the contract to a Python function and will handle the validation and serialization. The OpenAPI web service can be
tested with [Swagger UI](https://swagger.io/tools/swagger-ui/), which facilitates browsing through the available paths, trying
them out by constructing a request, and showing the curl command which can be used to call the web service. Swagger UI
comes bundled with the Connexion framework.

OpenAPI uses [JSON schema](https://json-schema.org/) to describe the structure of the request body and responses.

The request body we want to accept is

```json
{
  "epsilon": 0.001,
  "guess": -20
}
```

The JSON schema for the request body is

```{.json #request-schema}
{
  "type": "object",
  "description": "this JSON document is later referred to as <<request-schema>>",
  "properties": {
    "epsilon": {
      "title": "Epsilon",
      "type": "number",
      "minimum": 0
    },
    "guess": {
      "title": "Initial guess",
      "type": "number"
    }
  },
  "required": [
    "epsilon",
    "guess"
  ],
  "additionalProperties": false
}
```

The response body we want the web service to return is

```json
{
  "root": -1.00
}
```

The JSON schema for the response body is

```{.json #response-schema}
{
  "type": "object",
  "description": "this JSON document is later referred to as <<response-schema>>",
  "properties": {
      "root": {
        "title": "Root",
        "type": "number"
      }
  },
  "required": [
      "root"
  ],
  "additionalProperties": false
}
```

The OpenAPI specification for the web service is:

```{.yaml file=openapi/openapi.yaml}
# this yaml snippet is stored as openapi/openapi.yaml
openapi: 3.0.0
info:
  title: Root finder
  license:
    name: Apache-2.0
    url: https://www.apache.org/licenses/LICENSE-2.0.html
  version: 0.1.0
paths:
  /api/newtonraphson:
    post:
      description: Perform root finding with the Newton Raphson algorithm
      operationId: api.calculate
      requestBody:
        content:
          'application/json':
            schema:
              $ref: '#/components/schemas/NRRequest'
            example:
              epsilon: 0.001
              guess: -20
      responses:
        '200':
          description: The found root
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NRResponse'
components:
  schemas:
    NRRequest:
      <<request-schema>>
    NRResponse:
      <<response-schema>>
```

The webservice consists of a single path (``/api/newtonraphson``) with a POST method which receives a request and
returns a response. The request and response specifications are specified under ``#/components/schemas``.

The operation identifier (`operationId`) in the specification gets translated by Connexion to a Python method that will
be called when the path is requested. Connexion calls the function with the JSON parsed request body.

```{.python file=openapi/api.py}
# this Python snippet is stored as openapi/api.py
def calculate(body):
  epsilon = body['epsilon']
  guess = body['guess']
  from newtonraphsonpy import NewtonRaphson
  finder = NewtonRaphson(epsilon)
  root = finder.solve(guess)
  return {'root': root}
```

To provide the `calculate` method as a web service we must install Connexion Python library (with the Swagger UI for
later testing)

```{.awk #pip-connexion}
pip install connexion[swagger-ui]
```

To run the web service we have to to tell Connexion which specification it should expose.

```{.python file=openapi/webservice.py}
# this Python snippet is stored as openapi/webservice.py
import connexion

app = connexion.App(__name__)
app.add_api('openapi.yaml', validate_responses=True)
app.run(port=8080)
```

The web service can be started with

```{.awk #run-webservice}
python openapi/webservice.py
```

We can try out the web service using the Swagger UI at [http://localhost:8080/ui/](http://localhost:8080/ui/), or by
running a ``curl`` command like

```{.awk #test-webservice}
curl --request POST \
  --header "accept: application/json" \
  --header "Content-Type: application/json" \
  --data '{"epsilon":0.001,"guess":-20}' \
  http://localhost:8080/api/newtonraphson
```

## Python web application using Flask

![flask](images/flask.svg.png "Flask")

| Pros | Cons |
| --- | --- |
| :heart: Minimalist  and modular framework | :no_entry: Needs additional packages for extra functionality |
| :heart: A lot of examples and good documentation | :no_entry: Lots of moving parts: web service + worker + Redis queue |

The Python standard library ships with a [HTTP server](https://docs.python.org/3/library/http.server.html) which is very low level. A web framework is an abstraction layer for making writing web applications more pleasant. To write our web application we will use the [Flask](https://flask.palletsprojects.com/) web framework. Flask was chosen as it minimalistic and has a large active community.

The Flask Python library can be installed with

```{.awk #pip-flask}
pip install flask
```

We'll use the shared library that the openapi example also uses:

```{.awk #flask-link-newtonraphsonpy}
cd flask && ln -s ../openapi/newtonraphsonpy`python3-config --extension-suffix` . && cd -
```

Our web application will have 2 pages:

1. a page with form and submit button,
1. and a page which shows the result of the calculation.

Each page is available on a different url. In Flask the way urls are mapped to Python function is done by adding a
[route decorator](https://flask.palletsprojects.com/en/1.1.x/quickstart/#routing) (`@app.route`) to the function.

The first page with the form and submit button is defined as a function returning a HTML form.

```{.python #py-form}
# this Python code snippet is later referred to as <<py-form>>
@app.route('/', methods=['GET'])
def form():
  return '''<!doctype html>
    <form method="POST">
      <label for="epsilon">Epsilon</label>
      <input type="number" name="epsilon" value="0.001">
      <label for="guess">Guess</label>
      <input type="number" name="guess" value="-20">
      <button type="submit">Submit</button>
    </form>'''
```

The form will be submitted to the '/' path with the POST method. In the handler of this route we want to perform the
calculation and return the result HTML page. To get the submitted values we use the Flask global
[request](https://flask.palletsprojects.com/en/1.1.x/quickstart/#accessing-request-data) object. To construct the
returned HTML we use [f-strings](https://docs.python.org/3/reference/lexical_analysis.html#formatted-string-literals) to
replace the variable names with the variable values.

```{.python #py-calculate}
# this Python code snippet is later referred to as <<py-calculate>>
@app.route('/', methods=['POST'])
def calculate():
  epsilon = float(request.form['epsilon'])
  guess = float(request.form['guess'])

  from newtonraphsonpy import NewtonRaphson
  finder = NewtonRaphson(epsilon)
  root = finder.solve(guess)

  return f'''<!doctype html>
    <p>With epsilon of {epsilon} and a guess of {guess} the found root is {root}.</p>'''
```

```{.python #py-calculate}
  # this Python code snippet is appended to <<py-calculate>>
```

Putting it all together in

```{.python file=flask/webapp.py}
# this Python snippet is stored as flask/webapp.py
from flask import Flask, request
app = Flask(__name__)

<<py-form>>

<<py-calculate>>

app.run(port=5001)
```

And running it with

```{.awk #run-webapp}
python flask/webapp.py
```

To test we can visit [http://localhost:5001](http://localhost:5001) fill the form and press submit to get the result.

The form should look like

![Flask form](images/flask-form.png "Flask form")

After pressing submit the result should look like

![Flask result](images/flask-result.png "Flask result")

### Long-running tasks with Celery

When performing a long calculation (more than 30 seconds), the end-user requires feedback of the progress. In a normal
request/response cycle, feedback is only returned in the response. To give feedback during the calculation, the
computation must be offloaded to a task queue. In Python, a commonly used task queue is
[celery](http://docs.celeryproject.org/). While the calculation is running on some worker it is possible to have a
progress page which can check in the queue what the progress is of the calculation.

Our Celery powered web application will have 3 pages:

1. a page with a form and a submit button,
1. a page to show the progress of the calculation,
1. and a page which shows the result of the calculation. Each calculation will have it's own progress and result page.

Celery needs a broker for a queue and result storage. We'll use [redis](https://redis.io/) in a Docker container as
Celery broker, because it's simple to setup. Redis can be started with the following command

```{.awk #start-redis}
docker run --rm -d -p 6379:6379 --name some-redis redis
```

To use Celery we must install the redis flavored version with

```{.awk #pip-celery}
pip install celery[redis]
```

Let's set up a method that can be submitted to the Celery task queue.
First configure Celery to use the Redis database.

```{.python #celery-config}
# this Python code snippet is later referred to as <<celery-config>>
from celery import Celery
capp = Celery('tasks', broker='redis://localhost:6379', backend='redis://localhost:6379')
```

When a method is decorated with the Celery task decorator then it can be submitted to the Celery task queue. We'll add
some ``sleep``s to demonstrate what would happen with a long running calculation. We'll also tell Celery about in which
step the calculation is; later, we can display this step to the user.

```{.python file=flask/tasks.py}
# this Python snippet is stored as flask/tasks.py
import time

<<celery-config>>

@capp.task(bind=True)
def calculate(self, epsilon, guess):
  if not self.request.called_directly:
    self.update_state(state='INITIALIZING')
  time.sleep(5)
  from newtonraphsonpy import NewtonRaphson
  finder = NewtonRaphson(epsilon)
  if not self.request.called_directly:
    self.update_state(state='FINDING')
  time.sleep(5)
  root = finder.solve(guess)
  return {'root': root, 'guess': guess, 'epsilon':epsilon}
```

Instead of running the calculation when the submit button is pressed, we will submit the calculation task to the task
queue by using the `.delay()` function. The submission will return a job identifier we can use later to get the status
and result of the job. The web browser will redirect to a url with the job identifier in it.

```{.python #py-submit}
# this Python code snippet is later referred to as <<py-submit>>
@app.route('/', methods=['POST'])
def submit():
  epsilon = float(request.form['epsilon'])
  guess = float(request.form['guess'])
  from tasks import calculate
  job = calculate.delay(epsilon, guess)
  return redirect(url_for('result', jobid=job.id))
```

The last method is to ask the Celery task queue what the status is of the job and return the result when it is succesful.

```{.python #py-result}
# this Python code snippet is later referred to as <<py-result>>
@app.route('/result/<jobid>')
def result(jobid):
  from tasks import capp
  job = capp.AsyncResult(jobid)
  job.maybe_throw()
  if job.successful():
    result = job.get()
    epsilon = result['epsilon']
    guess = result['guess']
    root = result['root']
    return f'''<!doctype html>
      <p>With epsilon of {epsilon} and a guess of {guess} the found root is {root}.</p>'''
  else:
    return f'''<!doctype html>
      <p>{job.status}<p>'''
```

Putting it all together

```{.python file=flask/webapp-celery.py}
# this Python snippet is stored as flask/webapp-celery.py
from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

<<py-form>>

<<py-submit>>

<<py-result>>

if __name__ == '__main__':
  app.run(port=5000)
```

Start the web application like before with

```{.awk #run-celery-webapp}
python flask/webapp-celery.py
```

Tasks will be run by the Celery worker. The worker can be started with

```{.awk #run-celery-worker}
PYTHONPATH=flask celery worker -A tasks
```

(The PYTHONPATH environment variable is set so the Celery worker can find the `tasks.py` and `newtonraphsonpy.*.so`
files in the `flask/` directory)

To test the web service

1. Go to [http://localhost:5000](http://localhost:5000),

    ![Celery form](images/celery-form.png "Celery form")

2. Submit form,
3. Refresh result page until progress states are replaced with result.

    ![Celery sleep initializing](images/celery-init.png "Celery sleep initializing")

    ![Celery sleep finding](images/celery-finding.png "Celery sleep finding")

    ![Celery result](images/celery-result.png "Celery result")

The redis server can be shut down with

```{.awk #stop-redis}
docker stop some-redis
```

## JavaScript web service

![wasm](images/wasm.svg.png "WebAssembly")

| Pros | Cons |
| --- | --- |
| :heart: JavaScript is a powerful language which runs on many different platforms including mobile devices | :no_entry: OpenAPI spec and JSON schema are slightly out of sync |
| :heart: Same language on server as in web browser | :no_entry: Requires server infrastructure for calculations |

[JavaScript](https://developer.mozilla.org/en-US/docs/Web/javascript) is the de facto programming language for web browsers. The JavaScript engine in the Chrome browser called V8 has been wrapped in a runtime engine called [Node.js](http://nodejs.org/) which can execute JavaScript code outside the browser.

### Accessing C++ functions with Emscripten

For a long time web browsers could only execute non-JavaScript code using plugins like Flash. Later, tools where made
that could transpile non-JavaScript code to JavaScript, but the performance was less than running native code. To run code
as fast as native code, the [WebAssembly](https://webassembly.org/) language was developed. WebAssembly is a low-level,
[Assembly](https://en.wikipedia.org/wiki/Assembly_language)-like language with a compact binary format. The binary
format is stored as a WebAssembly module or `*.wasm` file, which can be loaded by all modern web browsers and by Node.js on the server.

Instead of writing code in the WebAssembly language, there are compilers that can take C++/C code and compile it to
a WebAssembly module. [Emscripten](https://emscripten.org) is the most popular C++ to WebAssembly compiler. Emscripten has been successfully
used to port game engines like the Unreal engine to the browser making it possible to have complex 3D games in the
browser without needing to install anything else than the web browser. To call C++ code (which has been compiled to
a WebAssembly module) from JavaScript, a binding is required. The binding will map C++ constructs to their JavaScript equivalent and
back. The binding called [embind](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/embind.html#embind)
is declared in a C++ file which is included in the compilation.

The binding of the C++ code will be

```{.cpp file=webassembly/wasm-newtonraphson.cpp}
// this C++ snippet is stored as webassembly/wasm-newtonraphson.cpp
#include <emscripten/bind.h>

<<algorithm>>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(newtonraphsonwasm) {
  class_<rootfinding::NewtonRaphson>("NewtonRaphson")
    .constructor<double>()
    .function("solve", &rootfinding::NewtonRaphson::solve)
    ;
}
```

The algorithm and binding can be compiled into a WebAssembly module with the Emscripten compiler called `emcc`. The C++ headers are located in the `cli/` directory so add it to the include path.
To make live easier we configure the compile command to generate a `webassembly/newtonraphsonwasm.js` file which exports the `createModule` function.
The `createModule` function loads and initializes the generated WebAssembly module called `webassembly/newtonraphsonwasm.wasm` for us. The last argument of the compiler is the C++ file with the emscripten bindings.

```{.awk #build-wasm}
emcc -Icli/ -o webassembly/newtonraphsonwasm.js \
  -s MODULARIZE=1 -s EXPORT_NAME=createModule \
  --bind webassembly/wasm-newtonraphson.cpp
```

To use the WebAssembly module in Node.js we need to import it with

```{.js #import-wasm}
// this JavaScript snippet is later referred to as <<import-wasm>>
const createModule = require('./newtonraphsonwasm.js')
```

The `createModule` function returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). We use [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) to keep the flow flat instead a nested promise chain for easier reading. The module returned by the await call contains the NewtonRaphson class we defined in the emscripten bindings.

```{.js #find-root-js}
// this JavaScript snippet is later referred to as <<find-root-js>>
const module = await createModule()
```

We create an object from the module.NewtonRaphson class and find the root.
We will define the `epsilon` and `guess` variables later when we call the code from the command line or from a web service or from a web application.

```{.js #find-root-js}
// this JavaScript snippet is appended to <<find-root-js>>
const finder = new module.NewtonRaphson(epsilon)
const root = finder.solve(guess)
```

Let's write a command line script to test the WebAssembly module. We get the `epsilon` and `guess` from the [command line arguments](https://nodejs.org/dist/latest-v12.x/docs/api/process.html#process_process_argv), find the root with the WebAssembly module and [print](https://nodejs.org/dist/latest-v12.x/docs/api/console.html) the result.
We need to wrap in a async function as Node.js (version 12) does support a top level `await`.

```{.js file=webassembly/cli.js}
// this JavaScript snippet stored as webassembly/cli.js
<<import-wasm>>

const main = async () => {
  const epsilon = parseFloat(process.argv[2])
  const guess = parseFloat(process.argv[3])
  <<find-root-js>>
  const msg = 'Given epsilon of %d and inital guess of %d the found root is %s'
  console.log(msg, epsilon, guess, root.toPrecision(3))
}
main()
```

Run the script with

```{.shell #test-wasm-cli}
node webassembly/cli.js 0.01 -20
```

Should output `Given epsilon of 0.01 and inital guess of -20 the found root is -1.00`.

In this chapter we executed the Newton-Raphson algorithm on the command line in JavaScript with Node.js by compiling the C++ code to a WebAssembly module with emscripten.

### Web service using Fastify

Now that we can execute the C++ code from JavaScript we are ready to wrap it up in a web service.
Node.js ships with a [low level http server](https://nodejs.org/en/knowledge/HTTP/servers/how-to-create-a-HTTP-server/) that can be used to write a web service, but we are going to use the [Fastify web framework](https://www.fastify.io/) as it supports multiple routes, async/await and JSON schemas.

First we need to install Fastify with the Node.js package manager called [npm](https://docs.npmjs.com/about-npm/). We will use `--no-save` option to skip saving the dependency in [package.json](https://docs.npmjs.com/files/package.json) as we are not publishing a package.

```{.shell #npm-fastify}
npm install --no-save fastify
```

The Fastify web framework can be imported with require.

```{.js #import-fastify}
// this JavaScript snippet is later referred to as <<import-wasm-fastify>>
const fastify = require('fastify')()
```

Let's start the web service file by importing Fastify and the WebAssembly module with

```{.js file=webassembly/webservice.js}
// this JavaScript snippet stored as webassembly/webservice.js
<<import-fastify>>
<<import-wasm>>
```

A handler function can be defined which will process a request `body` JSON object containing the `epsilon` and `guess` and returns the found root. We will later configure Fastify to call this method when visiting an url.

```{.js #fastify-handler}
// this JavaScript snippet is later referred to as <<fastify-handler>>
const handler = async ({body}) => {
  const { epsilon, guess } = body
  <<find-root-js>>
  return { root }
}
```

Fastify can use JSON-schema to validate the incoming request and and outgoing response.

Define a Fastify route for a POST request to `/api/newtonraphson` url which calls the `handler` function. The request body must be validated against `<<request-schema>>` and the OK (code=200) response must be validated against `<<response-schema>>` as defined in the [OpenAPI chapter](#openapi-web-service-using-connexion). By defining schemas we implicitly tell the web service it should accept and return `application/json` as content type.

```{.js file=webassembly/webservice.js}
// this JavaScript snippet appended to webassembly/webservice.js
<<fastify-handler>>

fastify.route({
  url: '/api/newtonraphson',
  method: 'POST',
  schema: {
    body:
      <<request-schema>>
    ,
    response: {
      200:
        <<response-schema>>
    }
  },
  handler
})
```

Now that the route have been defined we can tell Fastify to listen on `http://localhost:<port>` for requests and die when an error is thrown.

```{.js #fastify-listen}
// this JavaScript snippet is later referred to as <<fastify-listen>>
const main = async (port) => {
  try {
    const host = 'localhost'
    console.log('Server listening on http://%s:%d (Press CTRL+C to quit)', host, port)
    await fastify.listen(port, host)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}
```

Let's listen on `http://localhost:3000`

```{.js file=webassembly/webservice.js}
// this JavaScript snippet is appended to webassembly/webservice.js
<<fastify-listen>>
main(3000)
```

Run the web service with

```{.shell #run-js-webservice}
node webassembly/webservice.js
```

In another terminal test web service with

```{.shell #test-js-webservice}
curl --request POST \
  --header "accept: application/json" \
  --header "Content-Type: application/json" \
  --data '{"epsilon":0.001,"guess":-20}' \
  http://localhost:3000/api/newtonraphson
```

Should return something like

```json
{
  "root": -1.0000001181322415
}
```

To test the validation, call the web service with a typo in the epsilon field name

```{.shell #test-js-webservice-invalid}
wget --content-on-error --quiet --output-document=- \
  --header="accept: application/json" \
  --header="Content-Type: application/json" \
  --post-data '{"epilon":0.001,"guess":-20}' \
  http://localhost:3000/api/newtonraphson
```

Should return an error like

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "body should have required property 'epsilon'"
}
```

### OpenAPI web service using fastify-oas

The web service we made in the previous chapter can not tell us which urls or routes it has. We can use a OpenAPI specification for that. As Fastify routes already use JSON schemas for the request body and response body we can generate the OpenAPI specification with the [fastify-oas](https://gitlab.com/m03geek/fastify-oas) plugin.

Install the plugin with

```{.shell #npm-openapi}
npm install --no-save fastify-oas
```

Same as before we need to import Fastify

```{.js #fastify-openapi-plugin}
// this JavaScript snippet is later referred to as <<fastify-openapi-plugin>>
<<import-fastify>>
```

We need to import the plugin

```{.js #fastify-openapi-plugin}
// this JavaScript snippet is appended to <<fastify-openapi-plugin>>
const oas = require('fastify-oas')
```

Next we need to register the plugin (oas) and configure it.
Configure the plugin by setting the OpenAPI info fields and set all paths to consume/produce the `application/json` content type and set the urls of the web service.
Lastly setting `exposeRoute` to true will make the plugin add the following routes:

* [/documentation/json](http://localhost:3001/documentation/json) for OpenAPI specification in JSON format
* [/documentation/yaml](http://localhost:3001/documentation/yaml) for OpenAPI specification in YAML format
* [/documentation/index.html](http://localhost:3001/documentation/index.html) for [Swagger UI](https://swagger.io/tools/swagger-ui/)
* [/documentation/docs.html](http://localhost:3001/documentation/docs.html) for [ReDoc UI](https://github.com/Redocly/redoc)

```{.js #fastify-openapi-plugin}
// this JavaScript snippet is appended to <<fastify-openapi-plugin>>
fastify.register(oas, {
  swagger: {
    info: {
      title: 'Root finder',
      license: {
        name: 'Apache-2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
      },
      version: '0.1.0'
    },
    consumes: ['application/json'],
    produces: ['application/json'],
    servers: [{
      url: 'http://localhost:3001'
    }, {
      url: 'http://localhost:3002'
    }]
  },
  exposeRoute: true
})
```

In the route we would like to define example values. The JSON schema we defined for the request body in the [OpeAPI chapter](#openapi-web-service-using-connexion) does not allow an example field, but the OpenAPI specifaction does. So we inject the example here.

```{.js #fastify-openapi-route}
// this JavaScript snippet is later referred to as <<fastify-openapi-route>>
const requestSchemaWithExample =
  <<request-schema>>
requestSchemaWithExample.example = {
  epsilon: 0.001,
  guess: -20
}
```

We need to define a route using the same handler as before and the schemas with example request body.

```{.js #fastify-openapi-route}
// this JavaScript snippet is appended to <<fastify-openapi-route>>
fastify.route({
  url: '/api/newtonraphson',
  method: 'POST',
  schema: {
    body: requestSchemaWithExample,
    response: {
      200:
        <<response-schema>>
    }
  },
  handler
})
```

Let's load the WebAssembly module, add the plugin, add the handler and add the route to `webassembly/openapi.js` file with

```{.js file=webassembly/openapi.js}
// this JavaScript snippet is stored as webassembly/openapi.js
<<import-wasm>>

<<fastify-openapi-plugin>>

<<fastify-handler>>

<<fastify-openapi-route>>
```

Next we listen on [http://localhost:3001](http://localhost:3001).

```{.js file=webassembly/openapi.js}
// this JavaScript snippet is appended to webassembly/openapi.js
<<fastify-listen>>
main(3001)
```

Run the web service with

```{.shell #run-js-openapi}
node webassembly/openapi.js
```

The OpenAPI specification is generated in [JSON](http://localhost:3001/documentation/json) and [YAML](http://localhost:3001/documentation/yaml) format.
Try the web service out by visiting the [Swagger UI](http://localhost:3001/documentation/index.html).

Or try it out in another terminal with curl using

```{.shell #test-js-openapi}
curl --request POST \
  --header "Content-Type: application/json" \
  --header "accept: application/json" \
  --data '{"guess":-20, "epsilon":0.001}' \
  http://localhost:3001/api/newtonraphson
```

### Long running task with worker threads

The web service we made in the prevous chapter will block any other requests while the algorithm solving is running. This is due to the inner workings of Node.js. Node.js uses a single threaded event loop, so while an event is being handled Node.js is busy. Node.js uses callbacks and promises to handle long IO tasks efficiently. 

To use the CPU in parallel Node.js has [worker threads](https://nodejs.org/dist/latest-v12.x/docs/api/worker_threads.html). We don't want to start a new thread each time a request is recieved to perform the calculation, we want to use a pool of waiting threads. So each request will be computed by a thread from the pool.
Node.js gives use the low level primitives to create a thread. A thread pool implementation is explained in the [Node.js documentation](https://nodejs.org/docs/latest-v12.x/api/async_hooks.html#async_hooks_using_asyncresource_for_a_worker_thread_pool), we could copy it here or use an existing package.
On [npmjs](https://www.npmjs.com/search?q=worker%20thread%20pool) I found the [node-worker-threads-pool](https://www.npmjs.com/package/node-worker-threads-pool) package which is relativly similar to the version in the Node.js documentation, it is active and has a good number of stars/downloads compared to the other search results.

Let's use [node-worker-threads-pool](https://www.npmjs.com/package/node-worker-threads-pool) for our thread pool.

Install the pool package with

```{.shell #npm-threaded}
npm install --no-save node-worker-threads-pool
```

Let's create a static pool of 4 threads which runs the task defined in `./webassembly/task.js` as a worker thread.

```{.js file=webassembly/webservice-threaded.js}
// this JavaScript snippet stored as webassembly/webservice-threaded.js
const { StaticPool } = require('node-worker-threads-pool')

const pool = new StaticPool({
  size: 4,
  task: './webassembly/task.js'
});
```

The web service handler has to call `pool.exec()` to perform the calculation in the worker thread and wait for the result.
By using `await` the main event loop of Node.js is free to do other work while the work is being done in the worker thread.

```{.js #fastify-handler-threaded}
// this JavaScript snippet later referred to as <<fastify-handler-threaded>>

const handler = async ({body}) => {
  const { epsilon, guess } = body
  const root = await pool.exec({epsilon, guess})
  return { root }
}
```

The `pool.exec({epsilon, guess})` will cause an emit of an event with 'message' as name and `{epsilon, guess}` as argument in the task.

In the task, each time we get a 'message' event on the [parentPort](https://nodejs.org/docs/latest-v12.x/api/worker_threads.html#worker_threads_worker_parentport) we want to perform the calculation.

```{.js file=webassembly/task.js}
// this JavaScript snippet appended to webassembly/task.js
<<import-wasm>>
const { parentPort } = require('worker_threads')

parentPort.on('message', async ({epsilon, guess}) => {
```

We must wait for the WebAsemmbly module to be initialized.

```{.js file=webassembly/task.js}
  // this JavaScript snippet appended to webassembly/task.js
  const { NewtonRaphson } = await createModule()
```

Now we can find the root.

```{.js file=webassembly/task.js}
  // this JavaScript snippet appended to webassembly/task.js
  const finder = new NewtonRaphson(epsilon)
  const root = finder.solve(guess)
```

And send the result back to the web service handler by posting a message to the port of the parent thread.

```{.js file=webassembly/task.js}
  // this JavaScript snippet appended to webassembly/task.js
  parentPort.postMessage(root)
})
```

Similar to the previous chapter we register the OpenAPI plugin, define a route and listen on [http://localhost:3002](http://localhost:3002)

```{.js file=webassembly/webservice-threaded.js}
// this JavaScript snippet is appended to webassembly/webservice-threaded.js
<<fastify-openapi-plugin>>

<<fastify-handler-threaded>>

<<fastify-openapi-route>>

<<fastify-listen>>
main(3002)
```

Run the web service with

```{.shell #run-js-threaded}
node webassembly/webservice-threaded.js
```

Test with

```{.shell #test-js-threaded}
curl --request POST \
  --header "Content-Type: application/json" \
  --header "accept: application/json" \
  --data '{"guess":-20, "epsilon":0.001}' \
  http://localhost:3002/api/newtonraphson
```

Or goto [Swagger UI](http://localhost:3002/documentation/index.html) to try it out. Do not forget to switch to the `http://localhost:3002` server in the servers pull down.

In this chapter we created a web service which

1. was written in JavaScript and executed with Node.js
1. uses Emscripten to compile the C++ algorithm to WebAssembly module
1. uses Fastify web framework to define routes
1. validates requests and responses with a JSON schemas
1. generates an OpenAPI specfication
1. performs the calculation in a worker thread from a thread pool

## JavaScript web application

![react](images/react.svg.png "React")

| Pros | Cons |
| --- | --- |
| :heart: No server infrastucture required except file hosting | :no_entry: Big learning curve |
| :heart: Ecosystem allows for building application with few lines  | :no_entry: Requires modern web browser |

In the [Web application](#web-application) section, a common approach is to render an entire HTML page even if a subset
of elements requires a change. With the advances in the web browser (JavaScript) engines including methods to fetch JSON
documents from a web service, it has become possible to address this shortcoming. The so-called [Single Page
Applications](https://en.wikipedia.org/wiki/Single-page_application) (SPA) enable changes to be made in a part of the
page without rendering the entire page. To ease SPA development, a number of frameworks have been developed. The most
popular front-end web frameworks are (as of June 2020):

* [React](https://reactjs.org/)
* [Vue.js](https://vuejs.org/)
* [Angular](https://angular.io/)

Their pros and cons are summarized [here](https://en.wikipedia.org/wiki/Comparison_of_JavaScript_frameworks#Features).

For Newton-Raphson web application, we selected React because of its small API and its use of functional programming.

The C++ algorithm is compiled into a wasm file using bindings. When a calculation form is submitted in the React
application a web worker loads the wasm file, starts the calculation, renders the result. With this architecture the
application only needs cheap static file hosting to host the HTML, js and wasm files. **The calculation will be done in
the web browser on the end users machine instead of a server**.

### Using WebAssembly module in web browser

We reuse the WebAssembly module we created in [previous chapter](#accessing-c-functions-with-emscripten).

The WebAssembly module must be loaded and initialized by calling the `createModule` function and waiting for the JavaScript promise to resolve.

```{.js #wasm-promise}
// this JavaScript snippet is later referred to as <<wasm-promise>>
createModule().then((module) => {
  <<wasm-calculate>>
  <<render-answer>>
});
```

The `module` variable contains the `NewtonRaphson` class we defined in the binding above.

The root finder can be called with

```{.js #wasm-calculate}
// this JavaScript snippet is before referred to as <<wasm-calculate>>
const epsilon = 0.001;
const finder = new module.NewtonRaphson(epsilon);
const guess = -20;
const root = finder.solve(guess);
```

To run the JavaScript in a web browser an HTML page is needed. To be able to use the `createModule` function, we will
import the `newtonraphsonwasm.js` with a script tag.

```{.html file=webassembly/example.html}
<!doctype html>
<!-- this HTML page is stored as webassembly/example.html -->
<html lang="en">
  <head>
    <title>Example</title>
    <script type="text/javascript" src="newtonraphsonwasm.js"></script>
    <script>
      <<wasm-promise>>
    </script>
  </head>
  <body>
    <span id="answer"> </span>
  </body>
</html>
```

In order to display the value of ``root``, we use an HTML element whose ``id`` is equal to  ``answer``. We can use document
manipulation functions like [getElementById](https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementById)
and [innerHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) to find this element in our web
page and subsequently set its contents, like so:

```{.js #render-answer}
document.getElementById('answer').innerHTML = root.toFixed(2);
```

The web browser can only load the `newtonraphsonwasm.js` file when hosted by a web server. Python ships with a built-in
web server, we will use it to host all files of the repository on port 8000.

```{.awk #host-files}
python3 -m http.server 8000
```

Visit [http://localhost:8000/webassembly/example.html](http://localhost:8000/webassembly/example.html) to see the result
of the calculation. Embedded below is the example hosted on 
[GitHub pages](https://nlesc-jcer.github.io/cpp2wasm/webassembly/example.html)

[https://nlesc-jcer.github.io/cpp2wasm/webassembly/example.html](https://nlesc-jcer.github.io/cpp2wasm/webassembly/example.html ':include :type=iframe width=100% height=60px').

The result of root finding was calculated using the C++ algorithm compiled to a WebAssembly module, executed by some
JavaScript and rendered on a HTML page.

### Long-running tasks with web worker

Executing a long running C++ method will block the browser from running any other code like updating the user interface.
In order to avoid this, the method can be run in the background using [web
workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers). A web worker runs in its
own thread and can be interacted with from JavaScript using messages.

We need to instantiate a web worker which we will implement later in `webassembly/worker.js`.

```{.js #worker-consumer}
// this JavaScript snippet is later referred to as <<worker-consumer>>
const worker = new Worker('worker.js');
```

We need to send the worker a message with description for the work it should do.

```{.js #worker-consumer}
// this JavaScript snippet is appended to <<worker-consumer>>
worker.postMessage({
  type: 'CALCULATE',
  payload: { epsilon: 0.001, guess: -20 }
});
```

In the web worker we need to listen for incoming messages.

```{.js #worker-provider-onmessage}
// this JavaScript snippet is later referred to as <<worker-provider-onmessage>>
onmessage = function(message) {
  <<handle-message>>
};
```

Before we can handle the message we need to import the WebAssembly module.

```{.js file=webassembly/worker.js}
// this JavaScript snippet is stored as webassembly/worker.js
importScripts('newtonraphsonwasm.js');

<<worker-provider-onmessage>>
```

We can handle the `CALCULATE` message only after the WebAssembly module is loaded and initialized.

```{.js #handle-message}
// this JavaScript snippet is before referred to as <<handle-message>>
if (message.data.type === 'CALCULATE') {
  createModule().then((module) => {
    <<perform-calc-in-worker>>
    <<post-result>>
  });
}
```

Let's calculate the result (root) based on the payload parameters in the incoming message.

```{.js #perform-calc-in-worker}
// this JavaScript snippet is before referred to as <<perform-calc-in-worker>>
const epsilon = message.data.payload.epsilon;
const finder = new module.NewtonRaphson(epsilon);
const guess = message.data.payload.guess;
const root = finder.solve(guess);
```

And send the result back to the web worker consumer as a outgoing message.

```{.js #post-result}
// this JavaScript snippet is before referred to as <<post-result>>
postMessage({
  type: 'RESULT',
  payload: {
    root: root
  }
});
```

Listen for messages from worker and when a result message is received put the result in the HTML page like we did before.

```{.js #worker-consumer}
// this JavaScript snippet is appended to <<worker-consumer>>
worker.onmessage = function(message) {
  if (message.data.type === 'RESULT') {
    const root = message.data.payload.root;
    <<render-answer>>
  }
}
```

Like before we need a HTML page to run the JavaScript, but now we don't need to import the `newtonraphsonwasm.js` file
here as it is imported in the `worker.js` file.

```{.html file=webassembly/example-web-worker.html}
<!doctype html>
<!-- this HTML page is stored as webassembly/example-web-worker.html -->
<html lang="en">
  <head>
    <title>Example web worker</title>
    <script>
      <<worker-consumer>>
    </script>
  </head>
  <body>
    <span id="answer"> </span>
  </body>
</html>
```

Like before we also need to host the files in a web server with

```shell
python3 -m http.server 8000
```

Visit
[http://localhost:8000/webassembly/example-web-worker.html](http://localhost:8000/webassembly/example-web-worker.html)
to see the result of the calculation. Embedded below is the example hosted on [GitHub
pages](https://nlesc-jcer.github.io/cpp2wasm/webassembly/example-web-worker.html)

<iframe width="100%" height="60" src="https://nlesc-jcer.github.io/cpp2wasm/webassembly/example-web-worker.html" /></iframe>

The result of root finding was calculated using the C++ algorithm compiled to a WebAssembly module, imported in a web
worker (separate thread), executed by JavaScript with messages to/from the web worker and rendered on a HTML page.

### React application

To render the React application we need a HTML element as a container. We will give it the identifier `container` which will
use later when we implement the React application in the `app.js` file.

```{.html file=react/example-app.html}
<!doctype html>
<!-- this HTML page is stored as react/example-app.html -->
<html lang="en">
  <head>
    <title>Example React application</title>
    <<imports>>
  </head>
  <div id="container"></div>

  <script type="text/babel" src="app.js"></script>
</html>
```

To use React we need to import the React library.

```{.html #imports}
<!-- this HTML snippet is before and later referred to as <<imports>> -->
<script src="https://unpkg.com/react@16/umd/react.development.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@16/umd/react-dom.development.js" crossorigin></script>
```

A React application is constructed from React components. The simplest React component is a function which returns a
HTML tag with a variable inside.

```{.jsx #heading-component}
// this JavaScript snippet is later referred to as <<heading-component>>
function Heading() {
  const title = 'Root finding web application';
  return <h1>{title}</h1>
}
```

A component can be rendered using

```jsx
ReactDOM.render(
  <Heading/>,
  document.getElementById('container')
);
```

The `Heading` React component would render to the following HTML.

```html
<h1>Root finding web application</h1>;
```

The `<h1>{title}</h1>` looks like HTML, but is actually called [JSX](https://reactjs.org/docs/introducing-jsx.html). A
transformer like [Babel](https://babeljs.io/docs/en/next/babel-standalone.html) can convert JSX to valid JavaScript
code. The transformed Heading component will look like.

```js
function Heading() {
  const title = 'Root finding web application';
  return React.createElement('h1', null, `{title}`);
}
```

JXS is syntactic sugar that makes React components easier to write and read. In the rest of the chapter, we will use JSX.

To transform JSX we need to import Babel.

```{.html #imports}
<!-- this HTML snippet is appended to <<imports>> -->
<script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
```

The code supplied here should not be used in production as converting JSX in the web browser is slow. It's better to use
[Create React App](http://create-react-app.dev/) which gives you an infrastructure to perform the transformation
offline.

The web application in our example should have a form with `epsilon` and `guess` input fields, as well as a ``submit`` button.
The form in JSX can be written in the following way:

```{.jsx #react-form}
{ /* this JavaScript snippet is later referred to as <<react-form>> */ }
<form onSubmit={handleSubmit}>
  <label>
    Epsilon:
    <input name="epsilon" type="number" value={epsilon} onChange={onEpsilonChange}/>
  </label>
  <label>
    Initial guess:
    <input name="guess" type="number" value={guess} onChange={onGuessChange}/>
  </label>
  <input type="submit" value="Submit" />
</form>
```

The form tag has a `onSubmit` property, which is set to a function (`handleSubmit`) that will handle the form
submission. The input tag has a `value` property to set the variable (`epsilon` and `guess`) and it also has `onChange`
property to set the function (`onEpsilonChange` and `onGuessChange`) which will be triggered when the user changes the
value.

Let's implement the `value` and `onChange` for the `epsilon` input.
To store the value we will use the [React useState hook](https://reactjs.org/docs/hooks-state.html).

```{.js #react-state}
// this JavaScript snippet is later referred to as <<react-state>>
const [epsilon, setEpsilon] = React.useState(0.001);
```

The argument of the `useState` function is the initial value. The `epsilon` variable contains the current value for
epsilon and `setEpsilon` is a function to set epsilon to a new value.

The input tag in the form will call the `onChange` function with a event object. We need to extract the user input from
the event and pass it to `setEpsilon`. The value should be a number, so we use `Number()` to cast the string from the
event to a number.

```{.js #react-state}
// this JavaScript snippet is appended to <<react-state>>
function onEpsilonChange(event) {
  setEpsilon(Number(event.target.value));
}
```

We will follow the same steps for the guess input as well.

```{.js #react-state}
// this JavaScript snippet is appended to <<react-state>>
const [guess, setGuess] = React.useState(-20);

function onGuessChange(event) {
  setGuess(Number(event.target.value));
}
```

We are ready to implement the `handleSubmit` function which will process the form data. The function will get, similar
to the onChange of the input tag, an event object. Normally when you submit a form the form fields will be send to the
server, but we want to perform the calculation in the browser so we have to disable the default action with.

```{.jsx #handle-submit}
// this JavaScript snippet is later referred to as <<handle-submit>>
event.preventDefault();
```

Like we did in the previous chapter we have to construct a web worker.

```{.jsx #handle-submit}
// this JavaScript snippet is appended to <<handle-submit>>
const worker = new Worker('worker.js');
```

The `worker.js` is the same as in the previous chapter so we re-use it by

```{.awk #link-worker}
cd react && ln -s ../webassembly/worker.js . && cd -
```

We have to post a message to the worker with the values from the form.

```{.jsx #handle-submit}
// this JavaScript snippet is appended to <<handle-submit>>
worker.postMessage({
  type: 'CALCULATE',
  payload: { epsilon: epsilon, guess: guess }
});
```

We need a place to store the result of the calculation (`root` value), we will use `useState` function again. The
initial value of the result is set to `undefined` as the result is only known after the calculation has been completed.

```{.js #react-state}
// this JavaScript snippet is appended to <<react-state>>
const [root, setRoot] = React.useState(undefined);
```

When the worker is done it will send a message back to the app. The app needs to store the result value (`root`) using
`setRoot`. The worker will then be terminated because it did its job.

```{.jsx #handle-submit}
// this JavaScript snippet is appended to <<handle-submit>>
worker.onmessage = function(message) {
    if (message.data.type === 'RESULT') {
      const result = message.data.payload.root;
      setRoot(result);
      worker.terminate();
  }
};
```

To render the result we can use a React Component which has `root` as a property. When the calculation has not been done
yet, it will render `Not submitted`. When the `root` property value is set then we will show it.

```{.jsx #result-component}
// this JavaScript snippet is later referred to as <<result-component>>
function Result(props) {
  const root = props.root;
  let message = 'Not submitted';
  if (root !== undefined) {
    message = 'Root = ' + root;
  }
  return <div id="answer">{message}</div>;
}
```

We can combine the heading, form and result components and all the states and handleSubmit function into the `App` React
component.

```{.jsx file=react/app.js}
<<heading-component>>
<<result-component>>

// this JavaScript snippet appenended to react/app.js
function App() {
  <<react-state>>

  function handleSubmit(event) {
    <<handle-submit>>
  }

  return (
    <div>
      <Heading/>
      <<react-form>>
      <Result root={root}/>
    </div>
  );
}
```

Finally we can render the `App` component to the HTML container with `container` as identifier.

```{.jsx file=react/app.js}
// this JavaScript snippet appenended to react/app.js
ReactDOM.render(
  <App/>,
  document.getElementById('container')
);
```

Make sure that the App can find the WebAssembly files by

```{.awk #link-webassembly-wasm}
cd react && ln -s ../webassembly/newtonraphsonwasm.wasm . && cd -
```

and

```{.awk #link-webassembly-js}
cd react && ln -s ../webassembly/newtonraphsonwasm.js . && cd -
```

Like before, we also need to host the files in a web server with

```shell
python3 -m http.server 8000
```

Visit [http://localhost:8000/react/example-app.html](http://localhost:8000/react/example-app.html) to see the root
answer. Embedded below is the example app hosted on [GitHub pages](https://nlesc-jcer.github.io/cpp2wasm/react/example-app.html)

<iframe width="100%" height="160" src="https://nlesc-jcer.github.io/cpp2wasm/react/example-app.html" /></iframe>

### JSON schema powered form

The JSON schema can be used to generate a form. The form values will be validated against the schema. The most popular
JSON schema form for React is [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form) so we will
write a web application with it.

In the [OpenAPI chapter](#openapi-web-service-using-connexion) a request and response schema was defined. For the
form we need the request schema is

```{.js #jsonschema-app}
// this JavaScript snippet is later referred to as <<jsonschema-app>>
const schema =
  <<request-schema>>
;
```

To render the application we need a HTML page. We will reuse the imports we did in the previous chapter.

```{.html file=react/example-jsonschema-form.html}
<!doctype html>
<!-- this HTML page is stored as react/example-jsonschema-form.html -->
<html lang="en">
  <head>
    <title>Example JSON schema powered form</title>
    <<imports>>
  </head>
  <div id="container"></div>

  <script type="text/babel" src="jsonschema-app.js"></script>
</html>
```

To use the [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form) React component we need to import it.

```{.html #imports}
<!-- this HTML snippet is appended to <<imports>>  -->
<script src="https://unpkg.com/@rjsf/core/dist/react-jsonschema-form.js"></script>
```

The form component is exported as `JSONSchemaForm.default` and can be aliases to `Form` for easy use with

```{.js #jsonschema-app}
// this JavaScript snippet is appended to <<jsonschema-app>>
const Form = JSONSchemaForm.default;
```

The form [by default](https://react-jsonschema-form.readthedocs.io/en/latest/usage/themes/) uses the [Bootstrap
3](https://getbootstrap.com/docs/3.4/) theme. The theme injects class names into the HTML tags. The styles associated
with the class names must be imported from the Bootstrap CSS file.

```{.html #imports}
<!-- this HTML snippet is appended to <<imports>>  -->
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css" integrity="sha384-HSMxcRTRxnN+Bdg0JdbxYKrThecOKuH5zCYotlSAcp1+c8xmyTe9GYg1l9a69psu" crossorigin="anonymous">
```

The schema defines a description which we want to replace in the form. This can be done by defining a uiSchema

```{.js #jsonschema-app}
const uiSchema = {
  "ui:description": "Find root using Newton-Raphson algorithm"
}
```

The values in the form must be initialized and updated whenever the form changes.

```{.js #jsonschema-app}
// this JavaScript snippet is appended to <<jsonschema-app>>
const [formData, setFormData] = React.useState({
  epsilon: 0.001,
  guess: -20
});

function handleChange(event) {
  setFormData(event.formData);
}
```

The form can be rendered with

```{.jsx #jsonschema-form}
{ /* this JavaScript snippet is later referred to as <<jsonschema-form>>  */}
<Form
  schema={schema}
  uiSchema={uiSchema}
  formData={formData}
  onChange={handleChange}
  onSubmit={handleSubmit}
/>
```

The `handleSubmit` function recieves the form input values and use the web worker we created earlier to perform the
calculation and render the result.

```{.js #jsonschema-app}
// this JavaScript snippet is appended to <<jsonschema-app>>
const [root, setRoot] = React.useState(undefined);

function handleSubmit(submission, event) {
  event.preventDefault();
  const worker = new Worker('worker.js');
  worker.postMessage({
    type: 'CALCULATE',
    payload: submission.formData
  });
  worker.onmessage = function(message) {
      if (message.data.type === 'RESULT') {
        const result = message.data.payload.root;
        setRoot(result);
        worker.terminate();
    }
  };
}
```

The App component can be defined and rendered with.

```{.jsx file=react/jsonschema-app.js}
// this JavaScript snippet stored as react/jsonschema-app.js
function App() {
  <<jsonschema-app>>

  return (
    <div>
      <Heading/>
      <<jsonschema-form>>
      <Result root={root}/>
    </div>
  );
}

ReactDOM.render(
  <App/>,
  document.getElementById('container')
);
```

The `Heading` and `Result` React component can be reused.

```{.jsx file=react/jsonschema-app.js}
// this JavaScript snippet appended to react/jsonschema-app.js
<<heading-component>>
<<result-component>>
```

Like before we also need to host the files in a web server with

```shell
python3 -m http.server 8000
```

Visit
[http://localhost:8000/react/example-jsonschema-form.html](http://localhost:8000/react/example-jsonschema-form.html) to
see the root answer. Embedded below is the example app hosted on [GitHub
pages](https://nlesc-jcer.github.io/cpp2wasm/react/example-app.html)

<iframe width="100%" height="320" src="https://nlesc-jcer.github.io/cpp2wasm/react/example-jsonschema-form.html" /></iframe>

If you enter a negative number in the `epsilon` field the form will become invalid with a error message.

### Visualization with Vega-Lite

The plots in web application can be made using [Vega-Lite](https://vega.github.io/vega-lite/).
Vega-Lite is a JavaScript library which describes a plot using a JSON document.
In Vega-Lite the JSON Document is called a specification and can be compile to a lower level Vega specifcation to be rendered.

To make an interesting plot we need more than one result. We are going to do a parameter sweep and measure how long each
calculation takes.

Lets make a new JSON schema for the form in which we can set a max, min and step for epsilon.

```{.js #plot-app}
// this JavaScript snippet is later referred to as <<jsonschema-app>>
const schema = {
  "type": "object",
  "properties": {
    "epsilon": {
      "title": "Epsilon",
      "type": "object",
      "properties": {
        "min": {
          "title": "Minimum",
          "type": "number",
          "minimum": 0,
          "default": 0.0001
        },
        "max": {
          "title": "Maximum",
          "type": "number",
          "minimum": 0,
          "default": 0.001
        },
        "step": {
          "title": "Step",
          "type": "number",
          "enum": [
            0.1,
            0.01,
            0.001,
            0.0001,
            0.00001,
            0.000001
          ],
          "default": 0.0001
        }
      },
      "required": ["min", "max", "step"],
      "additionalProperties": false
    },
    "guess": {
      "title": "Initial guess",
      "type": "number",
      "default": -20
    }
  },
  "required": ["epsilon", "guess"],
  "additionalProperties": false
};
```

Let's render the epsilon step field as a radio group

```{.js #plot-app}
const uiSchema = {
  "epsilon": {
    "step": {
      "ui:widget": "radio",
      "ui:options": {
        "inline": true
      }
    }
  }
};
```

We need to rewrite the worker to perform a parameter sweep.
The worker will recieve a payload like

```json
{
  "epsilon": {
    "min": 0.0001,
    "max": 0.001,
    "step": 0.0001
  },
  "guess": -20
}
```

The worker will send back an array containing objects with the root result, the input parameters and the duration in
milliseconds.

```json
[{
  "epsilon": 0.0001,
  "guess": -20,
  "root": -1,
  "duration": 0.61
}]
```

To perform the sweep we will first unpack the payload.

```{.js #calculate-sweep}
// this JavaScript snippet is later referred to as <<calculate-sweep>>
const {min, max, step} = message.data.payload.epsilon;
const guess = message.data.payload.guess;
```

The result array needs to be initialized.

```{.js #calculate-sweep}
// this JavaScript snippet appended to <<calculate-sweep>>
const roots = [];
```

Lets use a [classic for loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for) to
iterate over requested the epsilons.

```{.js #calculate-sweep}
// this JavaScript snippet appended to <<calculate-sweep>>
for (let epsilon = min; epsilon <= max; epsilon += step) {
```

To measure the duration of a calculation we use the
[performance.now()](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now) method which returns a timestamp
in milliseconds.

```{.js #calculate-sweep}
  // this JavaScript snippet appended to <<calculate-sweep>>
  const t0 = performance.now();
  const finder = new module.NewtonRaphson(epsilon);
  const root = finder.solve(guess);
  const duration = performance.now() - t0;
```

We append the root result object using [shorthand property
names](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer) to the result
array.

```{.js #calculate-sweep}
  // this JavaScript snippet appended to <<calculate-sweep>>
  roots.push({
    epsilon,
    guess,
    root,
    duration
  });
```

To complete the sweep calculation we need to close the for loop and post the result.

```{.js #calculate-sweep}
  // this JavaScript snippet appended to <<calculate-sweep>>
}
postMessage({
  type: 'RESULT',
  payload: {
    roots
  }
});
```

The sweep calculation snippet (`<<calculate-sweep>>`) must be run in a new web worker called `worker-sweep.js`.
Like before we need to wait for the WebAssembly module to be initialized before we can start the calculation.

```{.js file=react/worker-sweep.js}
// this JavaScript snippet stored as react/worker-sweep.js
importScripts('newtonraphsonwasm.js');

onmessage = function(message) {
  if (message.data.type === 'CALCULATE') {
    createModule().then((module) => {
      <<calculate-sweep>>
    });
  }
};
```

To handle the submit we will start a worker, send the form data to the worker, recieve the workers result and store it
in the `roots` variable.

```{.js #plot-app}
// this JavaScript snippet is appended to <<plot-app>>
const [roots, setRoots] = React.useState([]);

function handleSubmit(submission, event) {
  event.preventDefault();
  const worker = new Worker('worker-sweep.js');
  worker.postMessage({
    type: 'CALCULATE',
    payload: submission.formData
  });
  worker.onmessage = function(message) {
      if (message.data.type === 'RESULT') {
        const result = message.data.payload.roots;
        setRoots(result);
        worker.terminate();
    }
  };
}
```

Now that we got data, we are ready to plot. We use the [Vega-Lite
specification](https://vega.github.io/vega-lite/docs/spec.html) to declare the plot. The specification for a scatter
plot of the `epsilon` against the `duration` looks like.

```{.js #vega-lite-spec}
// this JavaScript snippet is later referred to as <<vega-lite-spec>>
const spec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
  "data": { "values": roots },
  "mark": "point",
  "encoding": {
    "x": { "field": "epsilon", "type": "quantitative" },
    "y": { "field": "duration", "type": "quantitative", "title": "Duration (ms)" }
  },
  "width": 800,
  "height": 600
};
```

To render the spec we use the [vegaEmbed](https://github.com/vega/vega-embed) module. The Vega-Lite specification is a
simplification of the [Vega specification](https://vega.github.io/vega/docs/specification/) so wil first import `vega`
then `vega-lite` and lastly `vega-embed`.

```{.html #imports}
<script src="https://cdn.jsdelivr.net/npm/vega@5.13.0"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@4.13.0"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-embed@6.8.0"></script>
```

The `vegaEmbed()` function needs a DOM element to render the plot in. In React we must use the
[useRef](https://reactjs.org/docs/hooks-reference.html#useref) hook to get a reference to a DOM element. As the DOM
element needs time to initialize we need to use the [useEffect](https://reactjs.org/docs/hooks-effect.html) hook to only
embed the plot when the DOM element is ready. The `Plot` React component can be written as

```{.jsx #plot-component}
// this JavaScript snippet is later referred to as <<plot-component>>
function Plot({roots}) {
  const container = React.useRef(null);

  function didUpdate() {
    if (container.current === null) {
      return;
    }
    <<vega-lite-spec>>
    vegaEmbed(container.current, spec);
  }
  const dependencies = [container, roots];
  React.useEffect(didUpdate, dependencies);

  return <div ref={container}/>;
}
```

The App component can be defined and rendered with.

```{.jsx file=react/plot-app.js}
// this JavaScript snippet stored as react/plot-app.js
<<heading-component>>

<<plot-component>>

function App() {
  const Form = JSONSchemaForm.default;
  const [formData, setFormData] = React.useState({

  });

  function handleChange(event) {
    setFormData(event.formData);
  }

  <<plot-app>>

  return (
    <div>
      <Heading/>
      <<jsonschema-form>>
      <Plot roots={roots}/>
    </div>
  );
}

ReactDOM.render(
  <App/>,
  document.getElementById('container')
);
```

The HTML page should look like

```{.html file=react/example-plot.html}
<!doctype html>
<!-- this HTML page is stored as react/plot-form.html -->
<html lang="en">
  <head>
    <title>Example plot</title>
    <<imports>>
  <head>
  <body>
    <div id="container"></div>

    <script type="text/babel" src="plot-app.js"></script>
  </body>
</html>
```

Like before we also need to host the files in a web server with

```shell
python3 -m http.server 8000
```

Visit [http://localhost:8000/react/example-plot.html](http://localhost:8000/react/example-plot.html) to see the epsilon/duration plot.

Embedded below is the example app hosted on [GitHub pages](https://nlesc-jcer.github.io/cpp2wasm/react/example-plot.html)

<iframe width="100%" height="1450" src="https://nlesc-jcer.github.io/cpp2wasm/react/example-plot.html" /></iframe>

After the submit button is pressed the plot should show that the first calculation took a bit longer then the rest.
