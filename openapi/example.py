# this Python snippet is stored as openapi/example.py
from newtonraphsonpy import NewtonRaphson

finder = NewtonRaphson(epsilon=0.001)
root = finder.solve(guess=-20)
print(root)