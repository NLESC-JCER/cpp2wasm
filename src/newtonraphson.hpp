// ~\~ language=C++ filename=src/newtonraphson.hpp
// ~\~ begin <<README.md|src/newtonraphson.hpp>>[0]
// this C++ snippet is stored as src/newtonraphson.hpp
#ifndef H_NEWTONRAPHSON_H
#define H_NEWTONRAPHSON_H

#include <string>

namespace rootfinding {
  class NewtonRaphson {
    public:
      NewtonRaphson(double tolerancein);
      double find(double xin);
    private:
      double tolerance;
  };
}

#endif
// ~\~ end
