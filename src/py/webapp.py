# ~\~ language=Python filename=src/py/webapp.py
# ~\~ begin <<README.md|src/py/webapp.py>>[0]
# this Python snippet is stored as src/py/webapp.py
from flask import Flask, request
app = Flask(__name__)

# ~\~ begin <<README.md|py-form>>[0]
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
# ~\~ end

# ~\~ begin <<README.md|py-calculate>>[0]
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
# ~\~ end
# ~\~ begin <<README.md|py-calculate>>[1]
  # this Python code snippet is appended to <<py-calculate>>
# ~\~ end

app.run(port=5001)
# ~\~ end
