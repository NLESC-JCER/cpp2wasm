# this Python snippet is stored as src/py/hello-templated.py
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/hello/<name>')
def hello_name(name=None):
    return render_template('hello.html', name=name)

app.run()