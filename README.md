# Guide to make C++ available as a web application

- [Guide to make C++ available as a web application](#guide-to-make-c-available-as-a-web-application)
  - [JSON schema](#json-schema)
  - [CGI script](#cgi-script)
  - [Web framework](#web-framework)
  - [Python](#python)
    - [Accessing C++ function from Python](#accessing-c-function-from-python)
    - [Web application](#web-application)
    - [Web service](#web-service)
  - [Javascript](#javascript)
    - [Accessing C++ function from Javascript in web browser](#accessing-c-function-from-javascript-in-web-browser)
    - [Executing long running methods in Javascript](#executing-long-running-methods-in-javascript)
    - [Single page application](#single-page-application)
    - [Form](#form)
    - [Visualization](#visualization)

Document describing a way that a scientist with a C++ algorithm can make it available as a web application.
Bubble algoritm will be the use case.

```{.cpp file=newtonraphson.hpp}
#ifndef H_NEWTONRAPHSON_H
#define H_NEWTONRAPHSON_H

#include <string>

namespace rootfinding {
  class NewtonRaphson {
    public:
      NewtonRaphson(double epsilon);
      double find(double xin);
    private:
      double m_epsilon;
  };
}

#endif
```

```{.cpp #algorithm}
#include "newtonraphson.hpp"

namespace rootfinding
{

// An example function whose solution is determined using
// Bisection Method. The function is x^3 - x^2  + 2
double func(double x)
{
  return x * x * x - x * x + 2;
}

// Derivative of the above function which is 3*x^x - 2*x
double derivFunc(double x)
{
  return 3 * x * x - 2 * x;
}

NewtonRaphson::NewtonRaphson(double epsilon) : m_epsilon(epsilon) {}

// Function to find the root
double NewtonRaphson::find(double xin)
{
  double x = xin;
  double h = func(x) / derivFunc(x);
  while (abs(h) >= m_epsilon)
  {
    h = func(x) / derivFunc(x);

    // x(i+1) = x(i) - f(x) / f'(x)
    x = x - h;
  }
  return x;
};


} // namespace rootfinding
```

```{.cpp file=cli-newtonraphson.cpp}
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
g++ cli-newtonraphson.cpp -o newtonraphson.exe
```

Run with

```{.awk #test-cli}
./newtonraphson.exe
```
Should output

```shell
The value of the root is : -1.62292
```

A C++ algorithm is a collection of functions/classes that can perform a mathematical computation.

The web application is a set of web pages with a form to fill the input required for the algorithm, a submit button that will start the execution and a page that shows the output of the algorithm. The output should be presented in a usable format like a table, chart/plot and download.

The Bubble has the following characteristics:

- It is a collection of C++ algorithms which can be called as functions in a C++ library or command line executables.
- The input and output files of the command line executables adhere to a JSON schema
- Uses cmake as build tool
- Copies of C++ dependencies are in the git repository

## JSON schema

To make the same input and output reusable from either the command line or web service, the [JSON format](http://json.org/) was chosen. As the JSON format is easy read and write by human and machines.

Compare with a binary format or comma seperated file it is more verbose, but is more self documenting. It is less verbose than [XML](https://en.wikipedia.org/wiki/XML) and like there is a [XML schema definition](https://en.wikipedia.org/wiki/XML_Schema_(W3C)) for validation of XML there is an equivalent for JSON called [JSON schema](https://json-schema.org/). JSON schema is used to describe the shape of a JSON document and make sure Bubble consumers know how to provide the input and what to expect from the output. [YAML format](https://yaml.org/) was not chosen, because it is a superset of JSON and JSON is all expressiveness Bubble required. YAML allows for comments while this is not supported in JSON. Also JSON is the lingua france for web services.

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

The classic way to run programs when accessing an url is to use the Common Gateway Interface (CGI).
In the [Apache httpd web server](https://httpd.apache.org/docs/2.4/howto/cgi.html) you can configure a directory as a ScriptAlias, when visiting a file inside that directory the file will be executed.
The executable can read the request body from the stdin for and the response must be printed to the stdout.
The response must first print the content type and then the content. A web service which accepts and returns JSON documents can for example look like:

```{.cpp file=cgi-newtonraphson.cpp}
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

This can be compile with
```{.awk #build-cgi}
g++ -Ideps cgi-newtonraphson.cpp -o ./cgi-bin/newtonraphson
```

The CGI script can be tested directly with
```{.awk #test-cgi}
echo '{"guess":-20, "epsilon":0.001}' | ./cgi-bin/newtonraphson
```

It should output
```{.awk #test-cgi-output}
Content-type: application/json

{
  "guess": -20.0,
  "root": -1.622923986083026
}
```

Example Apache config file to host executables in `cgi-bin/` directory as `http://localhost:8080/cgi-bin/`.

```{.python file=httpd.conf}
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

```{.shell #run-httpd}
/usr/sbin/apache2  -X -d . -f ./httpd.conf 
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

A web framework is a abstraction layer for making web applications. It takes care of mapping a request on a certain url to an user defined function. And mapping the return of an user defined function to a response like a HTML page or error message.

## Python

Writing a web application in C++ can be done, but other languages like Python are better equipped.
Python has a big community making web applications, which resulted in a big ecosystem of web frameworks, template engines, tutorials.

Python packages can be installed using `pip` from the [Python Package Index](https://pypi.org/). It is customary to work with [virtual environments](https://packaging.python.org/tutorials/installing-packages/#creating-virtual-environments) to isolate the dependencies for a certain application and not pollute the global OS paths.

### Accessing C++ function from Python

To make a web application in Python, the C++ functions need to be called somehow.
Python can call functions in a C++ library if it's functions use [Python.h datatypes](https://docs.python.org/3.7/extending/index.html). This requires a lot of boilerplate and conversions, several tools are out there that make the boilerplate/conversions much simpler. The tool we chose to use is [pybind11](https://github.com/pybind/pybind11) as it is currently (May 2019) activly maintained and is header only library.

Pybind11 requires a bindings (PYBIND11_MODULE macro) to expose C++ constants/functions/enumerations/classes to Python. The bindings can be compiled to a shared library (eg. pybubble.so) which can be imported into Python.

For example the bindings of `newtonraphson.hpp:NewtonRaphson` class would look like:

```{.cpp file=py-newtonraphson.cpp}
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

```{.shell #build-py}
g++ -O3 -Wall -shared -std=c++14 -fPIC `python3 -m pybind11 --includes` \
py-newtonraphson.cpp -o newtonraphsonpy`python3-config --extension-suffix`
```

In Python it can be used:

```{.python file=example.py}
from newtonraphsonpy import NewtonRaphson

finder = NewtonRaphson(epsilon=0.001)
root = finder.find(guess=-20)
print(root)
-1.0000001181322415
```

### Web application

Now that the C++ functions can be called from Python it is time to call the function from a web page.
To assist in making a web application a web framework needs to be picked. For Bubble [flask](https://flask.palletsprojects.com/) was chosen as it minimalistic and has a large active community.

The Bubble web application has 3 kinds of pages:

1. a page with form and submit button,
2. a page to show the progress of the calculation
3. and a page which shows the result of the calculation. Each calculation will have it's own submit and result page.

Each page is available on a different url. In flask the way urls are mapped to Python function is done by adding a route decorator to the function for example:

```python
from flask import Flask
app = Flask(__name__)

@app.route("/")
def newtonraphson():
    return "Hello World!"
```

The above route will just return the string "Hello World!" in the web browser when visiting [http://localhost:5000/](http://localhost:5000/). It is possible to return a html page aswell, but to make it dynamic it soon becomes a mess of string concatenations. Template languages help to avoid the concatination mess. Flask is configured with the [Jinja2](https://jinja.palletsprojects.com/). A template for the above route could look like:

```jinja
<!doctype html>
<title>Hello from Flask</title>
{% if name %}
  <h1>Hello {{ name }}!</h1>
{% else %}
  <h1>Hello, World!</h1>
{% endif %}
```

and to render the template the function would look like:

```python
from flask import render_template

@app.route("/")
def newtonraphson():
    return render_template('newtonraphson.html')
```

Where `name` is a variable which gets combined with template to render into a html page.

When performing a long calculation (more than 30 seconds), the end-user requires feedback of the progress. In a normal request/response cycle, feedback is only returned in the response. To give feedback during the calculation, the computation must be offloaded to a task queue. In Python the most used task queue is [celery](http://www.celeryproject.org/). While the calculation is running on some worker it is possible to have a progress page which can check in the queue what the progress is of the calculation.

> TODO point celery example

### Web service

A web application is meant for consumption by humans and web service is meant for consumption by machines or other programs.
So instead of returning HTML pages a web service will accept and return machine readable documents like JSON documents. A web service is an application programming interface (API) based on web technologies.

A web service has a number of paths or urls to which a request can be sent and a response recieved.
The interface can be defined with [openapi specification](https://github.com/OAI/OpenAPI-Specification) (previously known as [Swagger](https://swagger.io/)). The openapi spec uses JSON schema to define request/response types. Making the JSON schema re-usable between the web service and command line interface.
The open api specifiation can either be generated by the web service provider or be a static document or contract. The contract first approach allows for both consumer and provider to come to an agreement on the contract and work more or less independently on implementation. The contract first approach was used for the Bubble web service.

To make a web service which adheres to the openapi specification contract, it is possible to generate a skeleton using the [generator](https://github.com/OpenAPITools/openapi-generator).
Each time the contract changes the generator must be re-run. The generator uses [connexion](https://github.com/zalando/connexion) as a web framework when generating a Python based service.
For the Python based Bubble web service connexion was used as the web framework as it maps each path+method combination to a Python function and will handle the validation and serialization.

## Javascript

Javascript is the defacto programming language for web browsers.
The Javascript engine in the Chrome browser called V8 has been wrapped in a runtime engine called Node.js which can execute Javascript code outside the browser.

### Accessing C++ function from Javascript in web browser

For a long time web browsers could only execute code non-Javascript using plugins like Flash.
Later tools where made that could transpile non-Javascript code to Javascript. The performance was less than running native code. To run code as fast as native code, the [WebAssembly](https://webassembly.org/) language was developed. Web assembly is a low-level assembly-like language with a compact binary format.
The binary format is stored as a web assembly module or wasm file which can be loaded by all modern web browsers.

Instead of writing code in the web assembly language there are compilers that can take C++/C or Rust code and compile it to wasm. [Emscripten](https://emscripten.org) is the most popular C++ to LLVM to wasm compiler. Emscripten has been successfully used to port game engines like the Unreal engine to the browser making it possible to have complex 3D games in the browser without needing to install anything else than the web browser. To call C++ code (which has been compiled to wasm) from Javascript, a binding is required. The binding will map C++ constructs to Javascript equivalent and back. The binding called [embind](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/embind.html#embind) is declared in a C++ file which is included in the compilation.

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

The wasm file must be loaded into the web browser. Emscriptem will generate a html page and js file which will load the module.

The example class can than be called in Javascript with

```js
var instance = new Module.MyClass(10, "hello");
instance.incrementX();
instance.x; // 11
```

### Executing long running methods in Javascript

Executing a long running C++ method will block the browser from running any other code like updating the user interface. This is not very nice for the user. To run the method in the background, [web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) have been defined. A web worker runs in it's own thread and can be interacted with from Javascript using messages.

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

To make it easier write a SPA a number of frameworks have been developed. The most popular frontend web frameworks at the moment (July 2019) are:

- [React](https://reactjs.org/)
- [Vue.js](https://vuejs.org/)
- [Angular](https://angular.io/)

The have their strengths and weaknesses which are summarized in the [NLeSC guide](https://guide.esciencecenter.nl/best_practices/language_guides/javascript.html#frameworks).

For Bubble I picked React as it is light and functional, because I like the small api footprint and the functional programming paradigm.

In Bubble the C++ is compiled to a wasm file using bindings. When a calculation form is submitted in the React application a web worker is started that loads the wasm file, starts the calculation, posts progress and lastly posts the result. With this architecture the application only needs cheap static file hosting to host the html, js and wasm files. **The calculation will be done in the web browser on the end users machine instead of a server**.

### Form

The JSON schema can be used to generate a form. The form submission will be validated against the schema.
The most popular JSON schema form for React is [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form).

### Visualization

The plots in Bubble are made using [vega-lite](https://vega.github.io/vega-lite/). Vega-lite is a JS library which accepts a JSON document describing the plot and generates interactive graphics.
