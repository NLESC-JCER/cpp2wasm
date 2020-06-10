add Announcement, something like _Five ways to host your C++ program online_

1. Example algorithm
    1. Newton-Raphson root finding algorithm
    2. Call from command line
2. Web service using Common Gateway Interface
3. Python web service
    1. Accessing C++ function from Python with pybind11
    2. OpenAPI with Connexion
4. Python web application using Flask
    1. Long-running tasks with Celery
5. JavaScript web service
    1. Accessing C++ function from NodeJS with Emscripten
    2. Web service with ExpressJS
6. JavaScript web application
    1. Using WebAssembly module in web browser
    2. Long-running tasks with web worker
    3. React application
    4. JSON schema powered form
    5. Visualization with vega

If chapter 5 (https://github.com/NLESC-JCER/cpp2wasm/issues/83) does not exist yet then have 5.1 as 6.0 with wasm loaded in web browser instead of in nodejs

Consider adding a line that helps people decide which section to focus on.

# Example algorithm

Introduce the example algorithm, as a CLI.

- Adapt to reading initial guess and tolerance from stdin, e.g. with argc and argv

# Web service using Common Gateway Interface

| Pros | Cons |
| --- | --- |
| :heart: pro1 | :no_entry: con1 |
| :heart: pro2 | :no_entry: con2 |

- Explain that there is no longer command line args, we need to change to JSON
- Explain what is JSON
- move JSON schema to openapi section
- JSON flavor of JSON schema can be removed (we still have the OpenAPI YAML)

# Python web service

- explain why python and pip
- OpenApi spec in json format, JSON schema code blocks for request and response

# Python web application

- web app v web service difference
- explanation of what is a web framework using @route decorator

# JavaScript web service

- See https://github.com/NLESC-JCER/cpp2wasm/issues/83

# JavaScript web application

- react, explain react/vue/angular here

---

- random tidbits:
    - web framework
    - long running tasks (concept, Python toolset, JavaScript toolset): consider splitting off into 1 or 2 separate documents; in the main document describe a what is basically a Promise and point to the relevant other document
- single page application
- Optional add pros and cons per section
