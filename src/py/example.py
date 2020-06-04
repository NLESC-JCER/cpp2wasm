# this Python snippet is stored as src/py/example.py
from newtonraphsonpy import NewtonRaphson

finder = NewtonRaphson(epsilon=0.001)
root = finder.find(guess=-20)
print(root)