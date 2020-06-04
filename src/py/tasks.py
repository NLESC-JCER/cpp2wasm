# this Python snippet is stored as src/py/tasks.py
import time

# this Python code snippet is later referred to as <<celery-config>>
from celery import Celery
capp = Celery('tasks', broker='redis://localhost:6379', backend='redis://localhost:6379')

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