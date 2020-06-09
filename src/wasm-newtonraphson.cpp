// this C++ snippet is stored as src/wasm-newtonraphson.cpp
#include <emscripten/bind.h>

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

using namespace emscripten;

EMSCRIPTEN_BINDINGS(newtonraphsonwasm) {
  class_<rootfinding::NewtonRaphson>("NewtonRaphson")
    .constructor<double>()
    .function("solve", &rootfinding::NewtonRaphson::solve)
    ;
}