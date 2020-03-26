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
  - [Javascript](#javascript)
    - [Accessing C++ function from Javascript in web browser](#accessing-c-function-from-javascript-in-web-browser)
    - [Executing long running methods in Javascript](#executing-long-running-methods-in-javascript)
    - [Single page application](#single-page-application)
    - [Form](#form)
    - [Visualization](#visualization)

[![CI](https://github.com/NLESC-JCER/cpp2wasm/workflows/CI/badge.svg)](https://github.com/NLESC-JCER/cpp2wasm/actions?query=workflow%3ACI)

Document describing a way that a researcher with a C++ algorithm can make it available as a web application. We will host the C++ algorithm as an web application in several different ways:

- as a cgi script
- as a Python application via pybind11, Flask and Celery
- in the web browser using web assembly and JavaScript

We assume the operating system is Linux (We used Linux while writing this guide).

The [Newton-Raphson root finding algorithm](https://en.wikipedia.org/wiki/Newton%27s_method) will be the use case.
The algorithm is explained in [this video series](https://www.youtube.com/watch?v=cOmAk82cr9M).
The code we are using came from [geeksforgeeks.org](https://www.geeksforgeeks.org/program-for-newton-raphson-method/).

The interface would like

```{.cpp file=src/newtonraphson.hpp}
// this C++ snippet is stored as src/newtonraphson.hpp
#ifndef H_NEWTONRAPHSON_H
#define H_NEWTONRAPHSON_H

#include <string>

namespace rootfinding {
  class NewtonRaphson {
    public:
      NewtonRaphson(double tolerancein);
      double find(double xin);
    private:
      double tolerance;
  };
}

#endif
```

The implementation would look like

```{.cpp #algorithm}
// this C++ code snippet is later referred to as <<algorithm>>
#include "newtonraphson.hpp"

namespace rootfinding
{

// An example function is x^3 - x^2  + 2
double func(double x)
{
  return x * x * x - x * x + 2;
}

// Derivative of the above function which is 3*x^x - 2*x
double derivFunc(double x)
{
  return 3 * x * x - 2 * x;
}

NewtonRaphson::NewtonRaphson(double tolerancein) : tolerance(tolerancein) {}

// Function to find the root
double NewtonRaphson::find(double xin)
{
  double x = xin;
  double delta_x = func(x) / derivFunc(x);
  while (abs(delta_x) >= tolerance)
  {
    delta_x = func(x) / derivFunc(x);

    // x_new = x_old - f(x) / f'(x)
    x = x - delta_x;
  }
  return x;
};


} // namespace rootfinding
```

A simple CLI program would look like

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
  double x1 = finder.find(x0);

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
  "$id": "https://example.com/schemas/person.json",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "number", "minimum": 0 }
  },
  "required": [ "name" ]
}
```

And a valid document:

```json
{
  "name": "me",
  "age": 42
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
  double root = finder.find(guess);

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
        .def("find",
             &rootfinding::NewtonRaphson::find,
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
root = finder.find(guess=-20)
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

Each page is available on a different url. In flask the way urls are mapped to Python function is done by adding a route decorator to the function for example:

```{.python file=src/py/hello.py}
# this Python snippet is stored as src/py/hello.py
from flask import Flask
app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello World!"

app.run()
```

Run with

```{.awk #py-hello}
python src/py/hello.py
```

The above route will just return the string "Hello World!" in the web browser when visiting [http://localhost:5000/](http://localhost:5000/). It is possible to return a html page as well, but to make it dynamic it soon becomes a mess of string concatenations. Template engines help to avoid the concatination mess. Flask is configured with the [Jinja2](https://jinja.palletsprojects.com/) template engine. A template for the above route could look like:

```{.html file=src/py/templates/hello.html}
{# this Jinja2 template snippet is stored as src/py/templates/hello.html #}
<!doctype html>
<title>Hello from Flask</title>
{% if name %}
  <h1>Hello {{ name }}!</h1>
{% else %}
  <h1>Hello, World!</h1>
{% endif %}
```

and to render the template the function would look like:

```{.python file=src/py/hello-templated.py}
# this Python snippet is stored as src/py/hello-templated.py
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/hello/<name>')
def hello_name(name=None):
    return render_template('hello.html', name=name)

app.run()
```

Where `name` is a variable which gets combined with template to render into a html page.

The web application can be started with

```{.awk #py-hello-templated}
python src/py/hello-templated.py
```

In a web browser you can visit [http://localhost:5000/hello/yourname](http://localhost:5000/hello/yourname) to the web application.

Let's make the web application for our Newton raphson algorithm.

The first thing we want is the web page with the form, the template that renders the form looks like

```{.html file=src/py/templates/form.html}
{# this Jinja2 template snippet is stored as src/py/templates/form.html #}
<!doctype html>
<form method="POST">
  <label for="epsilon">Epsilon</label>
  <input type="number" name="epsilon" value="0.001">
  <label for="guess">Guess</label>
  <input type="number" name="guess" value="-20">
  <button type="submit">Submit</button>
</form>
```

The home page will render the form like so

```{.python #py-form}
# this Python code snippet is later referred to as <<py-form>>
@app.route('/', methods=['GET'])
def form():
  return render_template('form.html')
```

The result will be displayed on a html page with the following template

```{.html file=src/py/templates/result.html}
{# this Jinja2 template snippet is stored as src/py/templates/result.html #}
<!doctype html>
<p>With epsilon of {{ epsilon }} and a guess of {{ guess }} the found root is {{ root }}.</p>
```

The form will be submitted to the '/' path with the POST method. In the handler of this route we want to perform the calculation and return the result html page.

```{.python #py-calculate}
# this Python code snippet is later referred to as <<py-calculate>>
@app.route('/', methods=['POST'])
def calculate():
  epsilon = float(request.form['epsilon'])
  guess = float(request.form['guess'])

  from newtonraphsonpy import NewtonRaphson
  finder = NewtonRaphson(epsilon)
  root = finder.find(guess)

  return render_template('result.html', epsilon=epsilon, guess=guess, root=root)
```

Putting it all together in

```{.python file=src/py/webapp.py}
# this Python snippet is stored as src/py/webapp.py
from flask import Flask, render_template, request
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
pip install celery[redis]
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
  root = finder.find(guess)
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
    return render_template('result.html', epsilon=result['epsilon'], guess=result['guess'], root=result['root'])
  else:
    return job.status
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
  root = finder.find(guess)
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

## Javascript

Javascript is the de facto programming language for web browsers.
The Javascript engine in the Chrome browser called V8 has been wrapped in a runtime engine called Node.js which can execute Javascript code outside the browser.

### Accessing C++ function from Javascript in web browser

For a long time web browsers could only execute non-Javascript code using plugins like Flash.
Later tools where made that could transpile non-Javascript code to Javascript. The performance was less than running native code. To run code as fast as native code, the [WebAssembly](https://webassembly.org/) language was developed. WebAssembly is a low-level, [Assembly](https://en.wikipedia.org/wiki/Assembly_language)-like language with a compact binary format.
The binary format is stored as a WebAssembly module or _wasm_ file, which can be loaded by all modern web browsers.

Instead of writing code in the WebAssembly language, there are compilers that can take C++/C or Rust code and compile it to wasm. [Emscripten](https://emscripten.org) is the most popular C++ to wasm compiler. Emscripten has been successfully used to port game engines like the Unreal engine to the browser making it possible to have complex 3D games in the browser without needing to install anything else than the web browser. To call C++ code (which has been compiled to wasm) from Javascript, a binding is required. The binding will map C++ constructs to their Javascript equivalent and back. The binding called [embind](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/embind.html#embind) is declared in a C++ file which is included in the compilation.

An example binding of a C++ classe would look like

```C++
// Binding code
EMSCRIPTEN_BINDINGS(my_class_example) {
  class_<MyClass>("MyClass")
    .constructor<int, std::string>()
    .function("incrementX", &MyClass::incrementX)
    .property("x", &MyClass::getX, &MyClass::setX)
    .class_function("getStringFromInstance", &MyClass::getStringFromInstance)
    ;
}
```

The wasm file must be loaded into the web browser. Emscriptem will generate an html page, as well as a JavaScript file that loads the WebAssembly module.

The example class can then be called in Javascript with

```js
var instance = new Module.MyClass(10, "hello");
instance.incrementX();
instance.x; // 11
```

### Executing long running methods in Javascript

Executing a long running C++ method will block the browser from running any other code like updating the user interface. This is not very nice for the user. To run the method in the background, [web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) have been defined. A web worker runs in its own thread and can be interacted with from Javascript using messages.

Example of starting and interacting with a web worker

```js
const worker = new Worker('worker.js');
// Listen for messages from worker
worker.onmessage = (event) => {
  console.log('Message received from worker');
  console.log(event.data);
}
// Send message to worker
worker.postMessage({
  type: 'CALCULATE',
  data: [{b: 3e-10, e: 1e+5}]
});
```

> TODO add worker.js content

### Single page application

In the [Web application](#web_application) chapter a whole new page was rendered by the server even for a small change. With the advent of more powerful Javascript engines in browsers and Javascript methods to fetch JSON documents from a web service, it is possible to render the page with Javascript and fetch a small change from the web service and re-render a small part of the page with Javascript. The application running in the browser is called a [single page application](https://en.wikipedia.org/wiki/Single-page_application) or SPA.

To make writing a SPA easier, a number of frameworks have been developed. The most popular frontend web frameworks at the moment (July 2019) are:

- [React](https://reactjs.org/)
- [Vue.js](https://vuejs.org/)
- [Angular](https://angular.io/)

They have their strengths and weaknesses which are summarized in the [NLeSC guide](https://guide.esciencecenter.nl/best_practices/language_guides/javascript.html#frameworks).

<!-- Bubble below might need to be Newton-Raphson? -->

For Bubble I picked React as it is light and functional, because I like the small api footprint and the functional programming paradigm.

In Bubble the C++ is compiled to a wasm file using bindings. When a calculation form is submitted in the React application a web worker is started that loads the wasm file, starts the calculation, posts progress and lastly posts the result. With this architecture the application only needs cheap static file hosting to host the html, js and wasm files. **The calculation will be done in the web browser on the end users machine instead of a server**.

### Form

The JSON schema can be used to generate a form. The form submission will be validated against the schema.
The most popular JSON schema form for React is [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form).

### Visualization

The plots in Bubble are made using [vega-lite](https://vega.github.io/vega-lite/). Vega-lite is a JS library which accepts a JSON document describing the plot and generates interactive graphics.
