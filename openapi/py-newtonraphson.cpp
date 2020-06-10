// this C++ snippet is stored as openapi/py-newtonraphson.cpp
#include <pybind11/pybind11.h>
#include <pybind11/stl.h>

// this C++ code snippet is later referred to as <<algorithm>>
#include "newtonraphson.hpp"
#include "algebra.hpp"
#include <math.h>

using namespace algebra;

namespace rootfinding
{

NewtonRaphson::NewtonRaphson(double tolerancein) : tolerance(tolerancein) {}

// Function to find the root
double NewtonRaphson::solve(double xin)
{
  double x = xin;
  double delta_x = equation(x) / derivative(x);

  while (fabs(delta_x) >= tolerance)
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
        .def("solve",
             &rootfinding::NewtonRaphson::solve,
             py::arg("guess"),
             "Find root starting from initial guess"
        )
    ;
}