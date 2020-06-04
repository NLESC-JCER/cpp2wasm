// this C++ snippet is stored as src/py-newtonraphson.cpp
#include <pybind11/pybind11.h>
#include <pybind11/stl.h>

// this C++ code snippet is later referred to as <<algorithm>>
#include "newtonraphson.hpp"

namespace rootfinding
{

// An example function is x^3 - x^2  + 2
double equation(double x)
{
  return x * x * x - x * x + 2;
}

// Derivative of the above function which is 3*x^x - 2*x
double derivative(double x)
{
  return 3 * x * x - 2 * x;
}

NewtonRaphson::NewtonRaphson(double tolerancein) : tolerance(tolerancein) {}

// Function to find the root
double NewtonRaphson::solve(double xin)
{
  double x = xin;
  double delta_x = equation(x) / derivative(x);
  while (abs(delta_x) >= tolerance)
  {
    delta_x = equation(x) / derivative(x);

    // x_new = x_old - f(x) / f'(x)
    x = x - delta_x;
  }
  return x;
};


} // namespace rootfinding

namespace py = pybind11;

PYBIND11_MODULE(newtonraphsonpy, m) {
    py::class_<rootfinding::NewtonRaphson>(m, "NewtonRaphson")
        .def(py::init<double>(), py::arg("epsilon"))
        .def("find",
             &rootfinding::NewtonRaphson::find,
             py::arg("guess"),
             "Find root starting from initial guess"
        )
    ;
}