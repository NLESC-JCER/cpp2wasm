// this C++ code snippet is store as src/algebra.hpp

namespace algebra
{

// An example equation is x^3 - x^2  + 2
double equation(double x)
{
  return x * x * x - x * x + 2;
}

// Derivative of the above equation which is 3*x^x - 2*x
double derivative(double x)
{
  return 3 * x * x - 2 * x;
}

} // namespace algebra