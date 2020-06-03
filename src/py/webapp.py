# this Python snippet is stored as src/py/webapp.py
from flask import Flask, render_template, request
app = Flask(__name__)

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

# this Python code snippet is later referred to as <<py-calculate>>
@app.route('/', methods=['POST'])
def calculate():
  epsilon = float(request.form['epsilon'])
  guess = float(request.form['guess'])

  from newtonraphsonpy import NewtonRaphson
  finder = NewtonRaphson(epsilon)
  root = finder.find(guess)

  return f'''<!doctype html>
    <p>With epsilon of {epsilon} and a guess of {guess} the found root is {root}.</p>'''
  # this Python code snippet is appended to <<py-calculate>>

app.run(port=5001)