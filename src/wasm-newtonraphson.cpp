// this C++ snippet is stored as src/wasm-newtonraphson.cpp
#include <emscripten/bind.h>

// this C++ code snippet is later referred to as <<algorithm>>
#include "newtonraphson.hpp"

namespace rootfinding
{

// An example function is x^3 - x^2  + 2
double func(double x)
{
  return x * x * x - x * x + 2;
}

// Derivative of the above function which is 3*x*x - 2*x
double derivFunc(double x)
{
  return 3 * x * x - 2 * x;
}

NewtonRaphson::NewtonRaphson(double tolerancein) : tolerance(tolerancein) {}

// Function to find the root
double NewtonRaphson::find(double xin)
{
  double x = xin;
  double delta_x = func(x) / derivFunc(x);
  while (abs(delta_x) >= tolerance)
  {
    delta_x = func(x) / derivFunc(x);

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
    .function("find", &rootfinding::NewtonRaphson::find)
    ;
}