// this C++ snippet is stored as cli/newtonraphson.hpp
#ifndef H_NEWTONRAPHSON_H
#define H_NEWTONRAPHSON_H

#include <string>

namespace rootfinding {
  class NewtonRaphson {
    public:
      NewtonRaphson(double tolerancein);
      double solve(double xin);
    private:
      double tolerance;
  };
}

#endif