# this Python snippet is stored as src/py/webapp.py
from flask import Flask, render_template, request
app = Flask(__name__)

# this Python code snippet is later referred to as <<py-form>>
@app.route('/', methods=['GET'])
def form():
  return render_template('form.html')

# this Python code snippet is later referred to as <<py-calculate>>
@app.route('/', methods=['POST'])
def calculate():
  epsilon = float(request.form['epsilon'])
  guess = float(request.form['guess'])

  from newtonraphsonpy import NewtonRaphson
  finder = NewtonRaphson(epsilon)
  root = finder.find(guess)

  return render_template('result.html', epsilon=epsilon, guess=guess, root=root)

app.run(port=5001)