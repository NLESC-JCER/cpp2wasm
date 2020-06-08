# Guide to make C++ available as a web application

- [Guide to make C++ available as a web application](#guide-to-make-c-available-as-a-web-application)
  - [JSON schema](#json-schema)
  - [CGI script](#cgi-script)
  - [Web framework](#web-framework)
  - [Python](#python)
    - [Accessing C++ function from Python](#accessing-c-function-from-python)
    - [Web application](#web-application)
    - [Long running tasks](#long-running-tasks)
    - [Web service](#web-service)
  - [JavaScript](#JavaScript)
    - [Accessing C++ function from JavaScript in web browser](#accessing-c-function-from-JavaScript-in-web-browser)
    - [Executing long running methods in JavaScript](#executing-long-running-methods-in-JavaScript)
  - [Single page application](#single-page-application)
    - [React component](#react-component)
    - [JSON schema powered form](#json-schema-powered-form)
    - [Visualization](#visualization)

[![CI](https://github.com/NLESC-JCER/cpp2wasm/workflows/CI/badge.svg)](https://github.com/NLESC-JCER/cpp2wasm/actions?query=workflow%3ACI)
[![Entangled](https://img.shields.io/badge/entangled-Use%20the%20source!-%2300aeff)](https://entangled.github.io/)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.3876112.svg)](https://doi.org/10.5281/zenodo.3876112)

Document describing a way that a researcher with a C++ algorithm can make it available as a web application. We will host the C++ algorithm as an web application in several different ways:

- as a cgi script
- as a Python application via pybind11, Flask and Celery
- in the web browser using web assembly and JavaScript

This guide was written and tested on Linux operating system. The required dependencies to run this guide are described in the [INSTALL.md](INSTALL.md) document. If you want to contribute to the guide see [CONTRIBUTING.md](CONTRIBUTING.md). The [repo](https://github.com/NLESC-JCER/cpp2wasm) contains the files that can be made from the code snippets in this guide. The code snippets can be [entangled](https://entangled.github.io/) to files using any of [these](CONTRIBUTING.md#tips) methods.

The [Newton-Raphson root finding algorithm](https://en.wikipedia.org/wiki/Newton%27s_method) will be the use case.
The algorithm is explained in [this video series](https://www.youtube.com/watch?v=cOmAk82cr9M).
The code we are using came from [geeksforgeeks.org](https://www.geeksforgeeks.org/program-for-newton-raphson-method/).

Let's first define the mathematical function, which we will be searching for its root, and the derivative of it.

```{.hpp file=src/algebra.hpp}
// this C++ code snippet is store as src/algebra.hpp

namespace algebra
{

// An example equation is x^3 - x^2  + 2
double equation(double x)
{
  return x * x * x - x * x + 2;
}

// Derivative of the above equation which is 3*x^x - 2*x
double derivative(double x)
{
  return 3 * x * x - 2 * x;
}

} // namespace algebra
```

Next, we define the interface (C++ class).

```{.cpp file=src/newtonraphson.hpp}
// this C++ snippet is stored as src/newtonraphson.hpp
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

In this C++ class, `solve` function will be performing the root finding task. We now need to define the algorithm so that `solve` function does what it supposed to do.

The implementation of the algorithm would look like

```{.cpp #algorithm}
// this C++ code snippet is later referred to as <<algorithm>>
#include "newtonraphson.hpp"
#include "algebra.hpp"

using namespace algebra;

namespace rootfinding
{

NewtonRaphson::NewtonRaphson(double tolerancein) : tolerance(tolerancein) {}

// Function to find the root
double NewtonRaphson::solve(double xin)
{
  double x = xin;
  double delta_x = equation(x) / derivative(x);
  while (abs(delta_x) >= tolerance)
  {
    delta_x = equation(x) / derivative(x);

    // x_new = x_old - f(x) / f'(x)
    x = x - delta_x;
  }
  return x;
};


} // namespace rootfinding
```

We are now ready to call the algorithm in a simple CLI program. It would look like

```{.cpp file=src/cli-newtonraphson.cpp}
// this C++ snippet is stored as src/newtonraphson.cpp
#include<bits/stdc++.h>

<<algorithm>>

// Driver program to test above
int main()
{
  double x0 = -20; // Initial values assumed
  double epsilon = 0.001;
  rootfinding::NewtonRaphson finder(epsilon);
  double x1 = finder.solve(x0);

  std::cout << "The value of the root is : " << x1 << std::endl;
  return 0;
}
```

Compile with

```{.awk #build-cli}
g++ src/cli-newtonraphson.cpp -o bin/newtonraphson.exe
```

Run with

```{.awk #test-cli}
./bin/newtonraphson.exe
```

Should output

```shell
The value of the root is : -1.62292
```

A C++ algorithm is a collection of functions/classes that can perform a mathematical computation.

The web application is a set of web pages with a form to fill the input required for the algorithm, a submit button that will start the execution and a page that shows the output of the algorithm. The output should be presented in a usable format like a table, chart/plot and download.

The C++ code has the following characteristics:

- A C++ algorithm which can be called as function in a C++ library or command line executable
- The input and output files of the command line executables adhere to a JSON schema
- Uses Makefile as build tool
- Copies of C++ dependencies are in the git repository

## JSON schema

To make the same input and output reusable from either the command line or web service, the [JSON format](http://json.org/) was chosen. As the JSON format is easy read and write by human and machines.

Compared with a binary format or a comma separated file, JSON is more verbose, but is more self documenting. It is less verbose than [XML](https://en.wikipedia.org/wiki/XML), and just like there is an [XML schema definition](https://en.wikipedia.org/wiki/XML_Schema_(W3C)) for validation of XML, there is an equivalent for JSON called [JSON schema](https://json-schema.org/). JSON schema is used to describe the shape of a JSON document and make sure root finder consumers know how to provide the input and what to expect from the output. [YAML format](https://yaml.org/) was not chosen, because it is a superset of JSON and JSON has all the expressiveness root finder required. YAML allows for comments while this is not supported in JSON. Also JSON is the lingua franca for web services.

An example of JSON schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://nlesc-jcer.github.io/cpp2wasm/NNRequest.json",
  "type": "object",
  "properties": {
    "epsilon": {
      "title": "Epsilon",
      "type": "number",
      "minimum": 0
    },
    "guess": {
      "title": "Initial guess",
      "type": "integer",
      "minimum": -100,
      "maximum": 100
    }
  },
  "required": ["epsilon", "guess"],
  "additionalProperties": false
}
```

And a valid document:

```json
{
  "epsilon": 0.001,
  "guess": -20
}
```

## CGI script

The classic way to run programs when accessing a url is to use the Common Gateway Interface (CGI).
In the [Apache httpd web server](https://httpd.apache.org/docs/2.4/howto/cgi.html) you can configure a directory as a ScriptAlias, when visiting a file inside that directory the file will be executed.
The executable can read the request body from the stdin for and the response must be printed to the stdout.
A response should consist of the content type such as ``application/json`` or ``text/html``, followed by the content itself. A web service which accepts and returns JSON documents can for example look like:

```{.cpp file=src/cgi-newtonraphson.cpp}
// this C++ snippet is stored as src/cgi-newtonraphson.hpp
#include <string>
#include <iostream>
#include <nlohmann/json.hpp>

<<algorithm>>

int main(int argc, char *argv[])
{
  std::cout << "Content-type: application/json" << std::endl << std::endl;

  // Retrieve epsilon and guess from request body
  nlohmann::json request(nlohmann::json::parse(std::cin));
  double epsilon = request["epsilon"];
  double guess = request["guess"];

  // Find root
  rootfinding::NewtonRaphson finder(epsilon);
  double root = finder.solve(guess);

  // Assemble response
  nlohmann::json response;
  response["guess"] = guess;
  response["root"] = root;
  std::cout << response.dump(2) << std::endl;
  return 0;
}
```

Where `nlohmann/json.hpp` is a JSON serialization/unserialization C++ header only library to convert a JSON string to and from a data type.

This can be compiled with

```{.awk #build-cgi}
g++ -Ideps src/cgi-newtonraphson.cpp -o apache2/cgi-bin/newtonraphson
```

The CGI script can be tested directly with

```{.awk #test-cgi}
echo '{"guess":-20, "epsilon":0.001}' | apache2/cgi-bin/newtonraphson
```

It should output

```shell
Content-type: application/json

{
  "guess": -20.0,
  "root": -1.622923986083026
}
```

Example Apache config file to host executables in `./apache2/cgi-bin/` directory as `http://localhost:8080/cgi-bin/`.

```{.python file=apache2/apache2.conf}
# this Apache2 configuration snippet is stored as apache2/apache2.conf
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
/usr/sbin/apache2 -X -d ./apache2
```

And in another shell call CGI script using curl

```shell
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"guess":-20, "epsilon":0.001}' \
  http://localhost:8080/cgi-bin/newtonraphson
```

Should return the following JSON document as a response

```json
{
  "guess": -20,
  "root":-1.62292
}
```

The problem with CGI scripts is when the program does some initialization, you have to wait for it each visit. It is better to do the initialization once when the web service is starting up.

## Web framework

A web framework is an abstraction layer for making web applications. It takes care of mapping a request on a certain url to a user defined function. And mapping the return of a user defined function to a response like an HTML page or an error message.

## Python

Writing a web application in C++ can be done, but other languages like Python are better equipped.
Python has a big community making web applications, which resulted in a big ecosystem of web frameworks, template engines, tutorials.

Python packages can be installed using `pip` from the [Python Package Index](https://pypi.org/). It is customary to work with [virtual environments](https://packaging.python.org/tutorials/installing-packages/#creating-virtual-environments) to isolate the dependencies for a certain application and not pollute the global OS paths.

### Accessing C++ function from Python

To make a web application in Python, the C++ functions need to be called somehow.
Python can call functions in a C++ library if its functions use [Python.h datatypes](https://docs.python.org/3.7/extending/index.html). This requires a lot of boilerplate and conversions, several tools are out there that make the boilerplate/conversions much simpler. The tool we chose to use is [pybind11](https://github.com/pybind/pybind11) as it is currently (May 2019) actively maintained and is a header-only library.

To use pybind11, it must installed with pip

```{.awk #pip-pybind11}
pip install pybind11
```

Pybind11 requires a bindings to expose C++ constants/functions/enumerations/classes to Python. The bindings are implemented by using the C++ `PYBIND11_MODULE` macro to configure what will be exposed to Python. The bindings can be compiled to a shared library called `newtonraphsonpy*.so` which can be imported into Python.

For example the bindings of `newtonraphson.hpp:NewtonRaphson` class would look like:

```{.cpp file=src/py-newtonraphson.cpp}
// this C++ snippet is stored as src/py-newtonraphson.cpp
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
g++ -O3 -Wall -shared -std=c++14 -fPIC `python3 -m pybind11 --includes` \
src/py-newtonraphson.cpp -o src/py/newtonraphsonpy`python3-config --extension-suffix`
```

In Python it can be used:

```{.python file=src/py/example.py}
# this Python snippet is stored as src/py/example.py
from newtonraphsonpy import NewtonRaphson

finder = NewtonRaphson(epsilon=0.001)
root = finder.solve(guess=-20)
print(root)
```

The Python example can be run with

```{.awk #test-py}
python src/py/example.py
```

It will output something like

```shell
-1.0000001181322415
```

### Web application

Now that the C++ functions can be called from Python it is time to call the function from a web page.
To assist in making a web application a web framework needs to be picked. The [Flask](https://flask.palletsprojects.com/) web framework was chosen as it minimalistic and has a large active community.

The Flask Python library can be installed with

```{.awk #pip-flask}
pip install flask
```

The web application has 3 kinds of pages:

1. a page with form and submit button,
2. a page to show the progress of the calculation
3. and a page which shows the result of the calculation. Each calculation will have it's own submit and result page.

Each page is available on a different url. In Flask the way urls are mapped to Python function is done by adding a [route decorator](https://flask.palletsprojects.com/en/1.1.x/quickstart/#routing) (`@app.route`) to the function.

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

The form will be submitted to the '/' path with the POST method. In the handler of this route we want to perform the calculation and return the result html page. To get the submitted values we use the Flask global [request](https://flask.palletsprojects.com/en/1.1.x/quickstart/#accessing-request-data) object. To construct the returned html we use [f-strings](https://docs.python.org/3/reference/lexical_analysis.html#formatted-string-literals) to replace the variable names with the variable values.

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

```{.python file=src/py/webapp.py}
# this Python snippet is stored as src/py/webapp.py
from flask import Flask, request
app = Flask(__name__)

<<py-form>>

<<py-calculate>>

app.run(port=5001)
```

And running it with

```{.awk #run-webapp}
python src/py/webapp.py
```

To test we can visit [http://localhost:5001](http://localhost:5001) fill the form and press submit to get the result.

### Long-running tasks

When performing a long calculation (more than 30 seconds), the end-user requires feedback of the progress. In a normal request/response cycle, feedback is only returned in the response. To give feedback during the calculation, the computation must be offloaded to a task queue. In Python, a commonly used task queue is [celery](http://www.celeryproject.org/). While the calculation is running on some worker it is possible to have a progress page which can check in the queue what the progress is of the calculation.

Celery needs a broker for a queue and result storage.
We'll use [redis](https://redis.io/) in a Docker container as Celery broker, because it's simple to setup. Redis can be started with the following command

```{.awk #start-redis}
docker run --rm -d -p 6379:6379 --name some-redis redis
```

To use Celery we must install the redis flavored version with

```{.awk #pip-celery}
pip install celery[redis]==4.4.3
```

Let's set up a method that can be submitted to the Celery task queue.
First configure Celery to use the Redis database.

```{.python #celery-config}
# this Python code snippet is later referred to as <<celery-config>>
from celery import Celery
capp = Celery('tasks', broker='redis://localhost:6379', backend='redis://localhost:6379')
```

When a method is decorated with the Celery task decorator then it can be submitted to the Celery task queue.
We'll add some ``sleep``s to demonstrate what would happen with a long running calculation. We'll also tell Celery about in which step the calculation is; later, we can display this step to the user.

```{.python file=src/py/tasks.py}
# this Python snippet is stored as src/py/tasks.py
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

Instead of running the calculation when the submit button is pressed, we will submit the calculation task to the task queue by using the `.delay()` function.
The submission will return a job identifier we can use later to get the status and result of the job. The web browser will redirect to a url with the job identifier in it.

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

```{.python file=src/py/webapp-celery.py}
# this Python snippet is stored as src/py/webapp-celery.py
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
python src/py/webapp-celery.py
```

Tasks will be run by the Celery worker. The worker can be started with

```{.awk #run-celery-worker}
PYTHONPATH=src/py celery worker -A tasks
```

(The PYTHONPATH environment variable is set so the Celery worker can find the `tasks.py` and `newtonraphsonpy.*.so` files in the `src/py/` directory)

To test the web service

1. Go to [http://localhost:5000](http://localhost:5000),
2. Submit form,
3. Refresh result page until progress states are replaced with result.

The redis server can be shut down with

```{.awk #stop-redis}
docker stop some-redis
```

### Web service

A web application is meant for consumption by humans and web service is meant for consumption by machines or other programs.
So instead of returning HTML pages a web service will accept and return machine readable documents like JSON documents. A web service is an application programming interface (API) based on web technologies.

A web service has a number of paths or urls to which a request can be sent and a response received.
The interface can be defined with [OpenAPI specification](https://github.com/OAI/OpenAPI-Specification) (previously known as [Swagger](https://swagger.io/)). The OpenAPI spec uses JSON schema to define request/response types. Making the JSON schema re-usable between the web service and command line interface.
The OpenAPI specifiation can either be generated by the web service provider or be a static document or contract. The contract-first approach allows for both consumer and provider to come to an agreement on the contract and work more or less independently on implementation. The contract-first approach was used for the root finding web service.

To make a web service which adheres to the OpenAPI specification contract, it is possible to generate a skeleton using the [generator](https://github.com/OpenAPITools/openapi-generator).
Each time the contract changes the generator must be re-run. The generator uses the Python based web framework [Connexion](https://github.com/zalando/connexion).
For the Python based root finding web service, Connexion was used as the web framework as it maps each path+method combination in the contract to a Python function and will handle the validation and serialization. The OpenAPI web service can be tested with [Swagger UI](https://swagger.io/tools/swagger-ui/), the UI allows browsing through the available paths, try them out by constructing a request and shows the curl command which can be used to call the web service. Swagger UI comes bundled with the Connexion framework.

The OpenAPI specification for performing root finding would look like

```{.yaml file=src/py/openapi.yaml}
# this yaml snippet is stored as src/py/openapi.yaml
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
      type: object
      properties:
        epsilon:
          type: number
          minimum: 0
        guess:
          type: number
      required:
        - epsilon
        - guess
      additionalProperties: false
    NRResponse:
      type: object
      properties:
        root:
          type: number
      required:
        - root
      additionalProperties: false
```

The webservice consists of a single path with the POST method which receives a request and returns a response.
The request and response are in JSON format and adhere to their respective JSON schemas.

The operation identifier (`operationId`) in the specification gets translated by Connexion to a Python method that will be called when the path is requested. Connexion calls the function with the JSON parsed request body.

```{.python file=src/py/api.py}
# this Python snippet is stored as src/py/api.py
def calculate(body):
  epsilon = body['epsilon']
  guess = body['guess']
  from newtonraphsonpy import NewtonRaphson
  finder = NewtonRaphson(epsilon)
  root = finder.solve(guess)
  return {'root': root}
```

To provide the `calculate` method as a web service we must install Connexion Python library (with the Swagger UI for later testing)

```{.awk #pip-connexion}
pip install connexion[swagger-ui]
```

To run the web service we have to to tell Connexion which specification it should expose.

```{.python file=src/py/webservice.py}
# this Python snippet is stored as src/py/webservice.py
import connexion

app = connexion.App(__name__)
app.add_api('openapi.yaml', validate_responses=True)
app.run(port=8080)
```

The web service can be started with

```{.awk #run-webservice}
python src/py/webservice.py
```

We can try out the web service using the Swagger UI at [http://localhost:8080/ui/](http://localhost:8080/ui/).
Or by running a ``curl`` command like

```{.awk #test-webservice}
curl -X POST "http://localhost:8080/api/newtonraphson" -H "accept: application/json" -H "Content-Type: application/json" -d "{\"epsilon\":0.001,\"guess\":-20}"
```

## JavaScript

JavaScript is the de facto programming language for web browsers.
The JavaScript engine in the Chrome browser called V8 has been wrapped in a runtime engine called Node.js which can execute JavaScript code outside the browser.

### Accessing C++ function from JavaScript in web browser

For a long time web browsers could only execute non-JavaScript code using plugins like Flash.
Later tools where made that could transpile non-JavaScript code to JavaScript. The performance was less than running native code. To run code as fast as native code, the [WebAssembly](https://webassembly.org/) language was developed. WebAssembly is a low-level, [Assembly](https://en.wikipedia.org/wiki/Assembly_language)-like language with a compact binary format.
The binary format is stored as a WebAssembly module or `*.wasm` file, which can be loaded by all modern web browsers.

Instead of writing code in the WebAssembly language, there are compilers that can take C++/C code and compile it to wasm. [Emscripten](https://emscripten.org) is the most popular C++ to wasm compiler. Emscripten has been successfully used to port game engines like the Unreal engine to the browser making it possible to have complex 3D games in the browser without needing to install anything else than the web browser. To call C++ code (which has been compiled to wasm) from JavaScript, a binding is required. The binding will map C++ constructs to their JavaScript equivalent and back. The binding called [embind](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/embind.html#embind) is declared in a C++ file which is included in the compilation.

The binding of the C++ code will be

```{.cpp file=src/wasm-newtonraphson.cpp}
// this C++ snippet is stored as src/wasm-newtonraphson.cpp
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

The algorithm and binding can be compiled into a WebAssembly module with the Emscripten compiler called `emcc`.
To make live easier we configure the compile command to generate a `src/js/newtonraphsonwasm.js` file which exports the `createModule` function.

```{.awk #build-wasm}
emcc --bind -o src/js/newtonraphsonwasm.js -s MODULARIZE=1 -s EXPORT_NAME=createModule src/wasm-newtonraphson.cpp
```

The compilation also generates a `src/js/newtonraphsonwasm.wasm` file which will be loaded with the `createModule` function.

The WebAssembly module must be loaded and initialized by calling the `createModule` function and waiting for the JavaScript promise to resolve.

```{.js #wasm-promise}
// this JavaScript snippet is later referred to as <<wasm-promise>>
createModule().then((module) => {
  <<wasm-calculate>>
  <<render-answer>>
});
```

The `module` variable contains the `NewtonRaphson` class we defined in the binding above.

The root finder can be called with.

```{.js #wasm-calculate}
// this JavaScript snippet is later referred to as <<wasm-calculate>>
const epsilon = 0.001;
const finder = new module.NewtonRaphson(epsilon);
const guess = -20;
const root = finder.solve(guess);
```

Append the root answer to the html page using [document manipulation functions](https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/append).

```{.js #render-answer}
const answer = document.createElement('span');
answer.id = 'answer';
answer.append(root);
document.body.append(answer);
```

To run the JavaScript in a web browser a HTML page is needed.
To be able to use the `createModule` function, we will import the `newtonraphsonwasm.js` with a script tag.

```{.html file=src/js/example.html}
<!doctype html>
<!-- this HTML page is stored as src/js/example.html -->
<html>
  <script type="text/javascript" src="newtonraphsonwasm.js"></script>
  <script>
    <<wasm-promise>>
  </script>
</html>
```

The web browser can only load the `newtonraphsonwasm.js` file when hosted by a web server.
Python ships with a built-in web server, we will use it to host the all files of the repository on port 8000.

```{.awk #host-files}
python3 -m http.server 8000
```

Visit [http://localhost:8000/src/js/example.html](http://localhost:8000/src/js/example.html) to see the result of the calculation.
Embedded below is the example hosted on [GitHub pages](https://nlesc-jcer.github.io/cpp2wasm/src/js/example.html)

[https://nlesc-jcer.github.io/cpp2wasm/src/js/example.html](https://nlesc-jcer.github.io/cpp2wasm/src/js/example.html ':include :type=iframe width=100% height=60px').

The result of root finding was calculated using the C++ algorithm compiled to a WebAssembly module, executed by some JavaScript and rendered on a HTML page.

### Executing long running methods in JavaScript

Executing a long running C++ method will block the browser from running any other code like updating the user interface. In order to avoid this, the method can be run in the background using [web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers). A web worker runs in its own thread and can be interacted with from JavaScript using messages.

We need to instantiate a web worker which we will implement later in `src/js/worker.js`.

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

```{.js file=src/js/worker.js}
// this JavaScript snippet is stored as src/js/worker.js
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

Like before we need a HTML page to run the JavaScript, but now we don't need to import the `newtonraphsonwasm.js` file here as it is imported in the `worker.js` file.

```{.html file=src/js/example-web-worker.html}
<!doctype html>
<!-- this HTML page is stored as src/js/example-web-worker.html -->
<html>
  <script>
    <<worker-consumer>>
  </script>
</html>
```

Like before we also need to host the files in a web server with

```shell
python3 -m http.server 8000
```

Visit [http://localhost:8000/src/js/example-web-worker.html](http://localhost:8000/src/js/example-web-worker.html) to see the result of the calculation.
Embedded below is the example hosted on [GitHub pages](https://nlesc-jcer.github.io/cpp2wasm/src/js/example-web-worker.html)

<iframe width="100%" height="60" src="https://nlesc-jcer.github.io/cpp2wasm/src/js/example-web-worker.html" /></iframe>

The result of root finding was calculated using the C++ algorithm compiled to a WebAssembly module, imported in a web worker (separate thread), executed by JavaScript with messages to/from the web worker and rendered on a HTML page.

## Single page application

In the [Web application](#web-application) section, a common approach is to render an entire HTML page even if a subset of elements requires a change. With the advances in the web browser (JavaScript) engines including methods to fetch JSON documents from a web service, it has become possible to address this shortcoming. The so-called [Single Page Applications](https://en.wikipedia.org/wiki/Single-page_application) (SPA) enable changes to be made in a part of the page without rendering the entire page. To ease SPA development, a number of frameworks have been developed. The most popular front-end web frameworks are (as of July 2019):

- [React](https://reactjs.org/)
- [Vue.js](https://vuejs.org/)
- [Angular](https://angular.io/)

Their pros and cons are summarized [here](https://en.wikipedia.org/wiki/Comparison_of_JavaScript_frameworks#Features).

For Newton-Raphson web application, we selected React because its small API footprint (light-weight) and the use of functional programming paradigm.

The C++ algorithm is compiled into a wasm file using bindings. When a calculation form is submitted in the React application a web worker loads the wasm file, starts the calculation, renders the result. With this architecture the application only needs cheap static file hosting to host the html, js and wasm files. **The calculation will be done in the web browser on the end users machine instead of a server**.

### React component

To render the React application we need a HTML tag as a container. We will give it the identifier `container` which will use later when
we implement the React application in the `app.js` file.

```{.html file=src/js/example-app.html}
<!doctype html>
<!-- this HTML page is stored as src/js/example-app.html -->
<html>
  <<imports>>
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

A React application is constructed from React components. The simplest React component is a function which returns a HTML tag with a variable inside.

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

The `<h1>{title}</h1>` looks like HTML, but is actually called [JSX](https://reactjs.org/docs/introducing-jsx.html).
A transformer like [Babel](https://babeljs.io/docs/en/next/babel-standalone.html) can convert JSX to valid JavaScript code. The transformed Heading component will look like.

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

The code supplied here should not be used in production as converting JSX in the web browser is slow. Better to use [Create React App](http://create-react-app.dev/) which gives you an infrastructure to perform the transformation offline.

The web application in our example should have a form with a `epsilon` and `guess` input field and a submit button.
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

The form tag has a `onSubmit` property, which is set to a function (`handleSubmit`) that will handle the form submission.
The input tag has a `value` property to set the variable (`epsilon` and `guess`) and it also has `onChange` property to set the function (`onEpsilonChange` and `onGuessChange`) which will be triggered when the user changes the value.

Let's implement the `value` and `onChange` for the `epsilon` input.
To store the value we will use the [React useState hook](https://reactjs.org/docs/hooks-state.html).

```{.js #react-state}
// this JavaScript snippet is later referred to as <<react-state>>
const [epsilon, setEpsilon] = React.useState(0.001);
```

The argument of the `useState` function is the initial value. The `epsilon` variable contains the current value for epsilon and `setEpsilon` is a function to set epsilon to a new value.

The input tag in the form will call the `onChange` function with a event object. We need to extract the user input from the event and pass it to `setEpsilon`. The value should be a number, so we use `Number()` to cast the string from the event to a number.

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

We are ready to implement the `handleSubmit` function which will process the form data.
The function will get, similar to the onChange of the input tag, an event object.
Normally when you submit a form the form fields will be send to the server, but we want to perform the calculation in the browser so we have to disable the default action with.

```{.jsx #handle-submit}
// this JavaScript snippet is later referred to as <<handle-submit>>
event.preventDefault();
```

Like we did in the previous chapter we have to construct a web worker.

```{.jsx #handle-submit}
// this JavaScript snippet is appended to <<handle-submit>>
const worker = new Worker('worker.js');
```

We have to post a message to the worker with the values from the form.

```{.jsx #handle-submit}
// this JavaScript snippet is appended to <<handle-submit>>
worker.postMessage({
  type: 'CALCULATE',
  payload: { epsilon: epsilon, guess: guess }
});
```

We need a place to store the result of the calculation (`root` value), we will use `useState` function again.
The initial value of the result is set to `undefined` as the result is only known after the calculation has been completed.

```{.js #react-state}
// this JavaScript snippet is appended to <<react-state>>
const [root, setRoot] = React.useState(undefined);
```

When the worker is done it will send a message back to the app. The app needs to store the result value (`root`) using `setRoot`. The worker will then be terminated because it did its job.

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

To render the result we can use a React Component which has `root` as a property.
When the calculation has not been done yet, it will render `Not submitted`.
When the `root` property value is set then we will show it.

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

We can combine the heading, form and result components and all the states and handleSubmit function into the `App` React component.

```{.jsx file=src/js/app.js}
<<heading-component>>
<<result-component>>

// this JavaScript snippet appenended to src/js/app.js
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

```{.jsx file=src/js/app.js}
// this JavaScript snippet appenended to src/js/app.js
ReactDOM.render(
  <App/>,
  document.getElementById('container')
);
```

Like before we also need to host the files in a web server with

```shell
python3 -m http.server 8000
```

Visit [http://localhost:8000/src/js/example-app.html](http://localhost:8000/src/js/example-app.html) to see the root answer.
Embedded below is the example app hosted on [GitHub pages](https://nlesc-jcer.github.io/cpp2wasm/src/js/example-app.html)

<iframe width="100%" height="160" src="https://nlesc-jcer.github.io/cpp2wasm/src/js/example-app.html" /></iframe>

### JSON schema powered form

The JSON schema can be used to generate a form. The form values will be validated against the schema.
The most popular JSON schema form for React is [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form) so we will write a web application with it.

In the [Web service](#web-service) an OpenAPI specification was used to specify the request and response schema. For the form we need the request schema in JSON format which is

```{.js #jsonschema-app}
// this JavaScript snippet is later referred to as <<jsonschema-app>>
const schema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://nlesc-jcer.github.io/cpp2wasm/NNRequest.json",
  "type": "object",
  "properties": {
    "epsilon": {
      "title": "Epsilon",
      "type": "number",
      "minimum": 0
    },
    "guess": {
      "title": "Initial guess",
      "type": "integer",
      "minimum": -100,
      "maximum": 100
    }
  },
  "required": ["epsilon", "guess"],
  "additionalProperties": false
}
```

To render the application we need a HTML page. We will reuse the imports we did in the previous chapter.

```{.html file=src/js/example-jsonschema-form.html}
<!doctype html>
<!-- this HTML page is stored as src/jsexample-jsonschema-form.html -->
<html>
  <<imports>>
  <div id="container"></div>

  <script type="text/babel" src="jsonschema-app.js"></script>
</html>
```

To use the [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form) React component we need to import it.

```{.html #imports}
<!-- this HTML snippet is appended to <<imports>>  -->
<script src="https://unpkg.com/@rjsf/core/dist/react-jsonschema-form.js"></script>
```

The form component is exported as `JSONSchemaForm.default` and can be aliases to `Form` with

```{.js #jsonschema-app}
// this JavaScript snippet is appended to <<jsonschema-app>>
const Form = JSONSchemaForm.default;
```

The form [by default](https://react-jsonschema-form.readthedocs.io/en/latest/usage/themes/) uses the [Bootstrap 3](https://getbootstrap.com/docs/3.4/) theme. The theme injects class names into the HTML tags. The styles associated with the class names must be imported from the Bootstrap CSS file.

```{.html #imports}
<!-- this HTML snippet is appended to <<imports>>  -->
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css" integrity="sha384-HSMxcRTRxnN+Bdg0JdbxYKrThecOKuH5zCYotlSAcp1+c8xmyTe9GYg1l9a69psu" crossorigin="anonymous">
```

The react-jsonschema-form component normally renders an integer with a updown selector. To use a range slider instead configure a [user interface schema](https://react-jsonschema-form.readthedocs.io/en/latest/quickstart/#form-uischema).

```{.js #jsonschema-app}
const uiSchema = {
  "guess": {
    "ui:widget": "range"
  }
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
  uiSchema={uiSchema}
  schema={schema}
  formData={formData}
  onChange={handleChange}
  onSubmit={handleSubmit}
/>
```

The `handleSubmit` function recieves the form input values and use the web worker we created earlier to perform the calculation and render the result.

```{.js #jsonschema-app}
// this JavaScript snippet is appended to <<jsonschema-app>>
const [root, setRoot] = React.useState(undefined);

function handleSubmit({formData}, event) {
  event.preventDefault();
  const worker = new Worker('worker.js');
  worker.postMessage({
    type: 'CALCULATE',
    payload: formData
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

```{.jsx file=src/js/jsonschema-app.js}
// this JavaScript snippet stored as src/js/jsonschema-app.js
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

```{.jsx file=src/js/jsonschema-app.js}
// this JavaScript snippet appended to src/js/jsonschema-app.js
<<heading-component>>
<<result-component>>
```

Like before we also need to host the files in a web server with

```shell
python3 -m http.server 8000
```

Visit [http://localhost:8000/src/js/example-jsonschema-form.html](http://localhost:8000/src/js/example-jsonschema-form.html) to see the root answer.
Embedded below is the example app hosted on [GitHub pages](https://nlesc-jcer.github.io/cpp2wasm/src/js/example-app.html)

<iframe width="100%" height="320" src="https://nlesc-jcer.github.io/cpp2wasm/src/js/example-jsonschema-form.html" /></iframe>

If you enter a negative number in the `epsilon` field the form will become invalid with a error message.

### Visualization

The plots in web apllicatoin can be made using [vega-lite](https://vega.github.io/vega-lite/). Vega-lite is a JS library which accepts a JSON document describing the plot and generates interactive graphics.
