add Announcement, something like _Five ways to host your C++ program online_

1. Web service using Common Gateway Interface
1. Python web service using Swagger/OpenAPI
1. Python web application using Flask
1. JavaScript web service using Emscriptem and WebAssembly
1. JavaScript web application with React

Consider adding a line that helps people decide which section to focus on.

Introduce the example algorithm, as a CLI.
- delay introducing the interface if possible
- one file: algorithm and main
- Adapt to reading initial guess and tolerance from stdin, e.g. with argc and argv

# Web service using Common Gateway Interface

| Pros | Cons |
| --- | --- |
| :heart: pro1 | :no_entry: con1 |
| :heart: pro2 | :no_entry: con2 |

- Explain that there is no longer a stdin, we need to change to JSON
- move JSON schema to swagger section
- JSON flavor of JSON schema can be removed (we still have the OpenAPI YAML)

# Python web service

- OpenApi, Swagger, JSON schema

# Python web application

- web app v web service difference
- explanation of what is a web framework


# JavaScript web service

- OK to test with curl not browser?

# JavaScript web application


---

- random tidbits:
    - web framework
    - long running tasks (concept, Python toolset, JavaScript toolset): consider splitting off into 1 or 2 separate documents; in the main document describe a what is basically a Promise and point to the relevant other document
- single page application
- Optional add pros and cons per section
- embedded github.io doesnt yield the same values as the CLI
