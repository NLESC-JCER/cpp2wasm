// this C++ snippet is stored as src/newtonraphson.cpp
#include<bits/stdc++.h>

// this C++ code snippet is later referred to as <<algorithm>>
#include "newtonraphson.hpp"
#include "algebra.hpp"

using namespace algebra;

namespace rootfinding
{

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

// Driver program to test above
int main()
{
  double x0 = -20; // Initial values assumed
  double epsilon = 0.001;
  rootfinding::NewtonRaphson finder(epsilon);
  double x1 = finder.solve(x0);

  std::cout << "The value of the root is : " << x1 << std::endl;
  return 0;
}