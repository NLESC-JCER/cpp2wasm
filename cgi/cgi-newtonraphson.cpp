// this C++ snippet is stored as cgi/cgi-newtonraphson.hpp
#include <string>
#include <iostream>
#include <nlohmann/json.hpp>

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

int main(int argc, char *argv[])
{
  // this C++ snippet is appended to cgi/cgi-newtonraphson.hpp
  nlohmann::json request(nlohmann::json::parse(std::cin));
  double epsilon = request["epsilon"];
  double guess = request["guess"];
  // this C++ snippet is appended to cgi/cgi-newtonraphson.hpp
  rootfinding::NewtonRaphson finder(epsilon);
  double root = finder.solve(guess);
  // this C++ snippet is appended to cgi/cgi-newtonraphson.hpp
  nlohmann::json response;
  response["root"] = root;
  std::cout << "Content-type: application/json" << std::endl << std::endl;
  std::cout << response.dump(2) << std::endl;
  return 0;
}