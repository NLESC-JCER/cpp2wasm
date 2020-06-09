// this C++ snippet is stored as src/cgi-newtonraphson.hpp
#include <string>
#include <iostream>
#include <iomanip>
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
  std::cout << "Content-type: application/json" << std::endl << std::endl;

  // Retrieve epsilon and guess from request body
  nlohmann::json request(nlohmann::json::parse(std::cin));
  double epsilon = request["epsilon"];
  double guess = request["guess"];

  // Find root
  rootfinding::NewtonRaphson finder(epsilon);
  double root = finder.solve(guess);

  // Assemble response
  nlohmann::json response;
  response["guess"] = guess;
  response["root"] = root;
  std::cout << std::fixed;
  std::cout << std::setprecision(6);
  std::cout << response.dump(2) << std::endl;
  return 0;
}