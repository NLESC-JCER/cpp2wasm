# this Python snippet is stored as src/py/webapp-celery.py
from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

# this Python code snippet is later referred to as <<py-form>>
@app.route('/', methods=['GET'])
def form():
  return render_template('form.html')

# this Python code snippet is later referred to as <<py-submit>>
@app.route('/', methods=['POST'])
def submit():
  epsilon = float(request.form['epsilon'])
  guess = float(request.form['guess'])
  from tasks import calculate
  job = calculate.delay(epsilon, guess)
  return redirect(url_for('result', jobid=job.id))

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

if __name__ == '__main__':
  app.run(port=5000)