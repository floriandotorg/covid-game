#include <iostream>
#include <emscripten/emscripten.h>

extern "C" {
  void EMSCRIPTEN_KEEPALIVE myfunc (int argc, char ** argv) {
    std::cout << "Hello World";
  }
}
