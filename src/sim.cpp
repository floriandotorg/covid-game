#include <iostream>
#include <array>
#include <cstdint>
#include <algorithm>
#include <random>
#include <numeric>
#include <vector>
#include <future>
#include <type_traits>
#include <experimental/iterator>

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#include <emscripten/bind.h>
#endif

class xorshift
{
public:
  using result_type = uint32_t;
  static constexpr result_type(min)() { return 0; }
  static constexpr result_type(max)() { return UINT32_MAX; }
  friend bool operator==(xorshift const &, xorshift const &);
  friend bool operator!=(xorshift const &, xorshift const &);

  xorshift() : m_seed(0xc1f651c67c62c6e0ull) {}
  explicit xorshift(std::random_device &rd)
  {
    seed(rd);
  }

  void seed(std::random_device &rd)
  {
    m_seed = uint64_t(rd()) << 31 | uint64_t(rd());
  }

  result_type operator()()
  {
    uint64_t result = m_seed * 0xd989bcacc137dcd5ull;
    m_seed ^= m_seed >> 11;
    m_seed ^= m_seed << 31;
    m_seed ^= m_seed >> 18;
    return uint32_t(result >> 32ull);
  }

  void discard(unsigned long long n)
  {
    for (unsigned long long i = 0; i < n; ++i)
      operator()();
  }

private:
  uint64_t m_seed;
};

#include "consts.hpp"

const float P = 0.1;
const float RISK_RATE = 0.1;
const std::size_t MIN_CONTACTS = 1;
const std::size_t MAX_CONTACTS = 8;
const float BEDS_PER_CAPITA = 25.8f / 100000.f * 10;
const std::size_t HOSPITAL_AFTER = 5;
const float DEAD_RATE_IN_HOSPITAL = 0.15;
const float TRAVELS_PER_CAPITA = 0.005f;
const float MIN_DAYS_SICK = 5.f;
const float MAX_DAYS_SICK = 20.f - MIN_DAYS_SICK;

const std::size_t NUM_THREADS = 10;

static_assert(static_cast<int>(std::size(counties) / static_cast<float>(NUM_THREADS)) == std::size(counties) / static_cast<float>(NUM_THREADS));
static_assert(std::size(biggest) == std::size(counties));
static_assert(std::size(neightbors) == std::size(counties));

const uint8_t STATE_HEALTHY = 0;
const uint8_t STATE_INFECTIOUS = 1;
const uint8_t STATE_HOSPITAlISED = 2;
const uint8_t STATE_QUARANTINED = 3;
const uint8_t STATE_HOME_QUARANTINED = 4;
const uint8_t STATE_RECOVERED = 5;
const uint8_t STATE_DEAD = 6;

const uint8_t STATE_MASK = 0b00000111;
const uint8_t TIMER_MASK = 0b01111000;
const uint8_t RISK_MASK = 0b10000000;

constexpr uint8_t get_state(uint8_t p)
{
  return (p & STATE_MASK);
}

constexpr uint8_t get_timer(uint8_t p)
{
  return (p & TIMER_MASK) >> 3;
}

constexpr bool has_risk(uint8_t p)
{
  return (p & RISK_MASK) > 0;
}

constexpr void set_state(uint8_t &p, uint8_t s)
{
  p = (s & STATE_MASK) | (p & ~STATE_MASK);
}

constexpr void set_timer(uint8_t &p, uint8_t t)
{
  p = ((t << 3) & TIMER_MASK) | (p & ~TIMER_MASK);
}

class simulation
{
public:
  simulation()
  {
    std::fill(pop.begin(), pop.end(), 0);

    for_each_county([&](auto begin, auto end, auto n) {
      const auto size = std::distance(begin, end);
      beds[n] = static_cast<float>(size) * BEDS_PER_CAPITA;
    });

    std::uniform_int_distribution<std::size_t> unii(0, POP_SIZE);
    for (std::size_t n = 0; n < 10; ++n)
    {
      pop[unii(rng)] = infect();
    }
  }

  void step(float domestic_travel_damping_factor, float travel_damping_factor, float social_distancing_factor, std::size_t num_tests, float app_factor)
  {
    progress = 0;
    result = std::async(&simulation::do_step, this, domestic_travel_damping_factor, travel_damping_factor, social_distancing_factor, num_tests, app_factor);
  }

  float get_progress()
  {
    return progress;
  }

  void wait_finished()
  {
    result.get();
  }

  void do_step(float domestic_travel_damping_factor, float travel_damping_factor, float social_distancing_factor, std::size_t num_tests, float app_factor)
  {
    for_each_county([&](auto begin, auto end, auto n) {
      if (infectious[n] > 0)
      {
        const auto size = std::distance(begin, end);
        std::uniform_int_distribution<std::size_t> rng_element(0, size - 1);
        const std::size_t num_travels = size * TRAVELS_PER_CAPITA;
        const auto &ns = neightbors[n];

        for (auto n : ns)
        {
          const auto nbegin = pop.begin() + counties[n];
          const auto nend = n == std::size(counties) - 1 ? pop.end() : pop.begin() + counties[n + 1];
          const auto nsize = std::distance(nbegin, nend);
          std::uniform_int_distribution<std::size_t> nrng_element(0, nsize - 1);

          for (std::size_t n = 0; n < num_travels * (1.f - domestic_travel_damping_factor); ++n)
          {
            auto &p = begin[rng_element(rng)];
            if (get_state(p) == STATE_INFECTIOUS)
            {
              std::swap(p, nbegin[nrng_element(rng)]);
            }
          }
        }

        std::exponential_distribution rng_expo(3.5);
        for (std::size_t i = 0; i < 10; ++i)
        {
          const std::size_t n = one_of_the_biggest();
          const auto nbegin = pop.begin() + counties[n];
          const auto nend = n == std::size(counties) - 1 ? pop.end() : pop.begin() + counties[n + 1];
          const auto nsize = std::distance(nbegin, nend);
          std::uniform_int_distribution<std::size_t> nrng_element(0, nsize - 1);

          for (std::size_t m = 0; m < num_travels * (1.f - travel_damping_factor); ++m)
          {
            auto &p = begin[rng_element(rng)];
            if (get_state(p) == STATE_INFECTIOUS)
            {
              std::swap(p, nbegin[nrng_element(rng)]);
            }
          }
        }
      }
    });

    std::fill(susceptible.begin(), susceptible.end(), 0);
    std::fill(infectious.begin(), infectious.end(), 0);
    std::fill(recovered.begin(), recovered.end(), 0);
    std::fill(quarantined.begin(), quarantined.end(), 0);
    std::fill(dead.begin(), dead.end(), 0);

    progress = 0.2;

    std::vector<std::thread> threads;
    threads.reserve(NUM_THREADS);
    const std::size_t part_size = std::size(counties) / NUM_THREADS;
    for (std::size_t n = 0; n < std::size(counties); n += part_size)
    {
      threads.push_back(std::thread([this, n, social_distancing_factor, num_tests, part_size, app_factor]() {
        for (std::size_t m = n; m < n + part_size; ++m)
        {
          const auto begin = pop.begin() + counties[m];
          const auto end = m == std::size(counties) - 1 ? pop.end() : pop.begin() + counties[m + 1];
          run_county(begin, end, m, social_distancing_factor, num_tests / part_size, app_factor);
          gen_stats(begin, end, m);
        }
      }));
    }

    for (auto &t : threads)
    {
      t.join();
    }

    progress = 1;
  }

#ifdef __EMSCRIPTEN__
  emscripten::val get_susceptible()
  {
    return emscripten::val(emscripten::typed_memory_view(std::size(susceptible), susceptible.begin()));
  }

  emscripten::val get_infectious()
  {
    return emscripten::val(emscripten::typed_memory_view(std::size(infectious), infectious.begin()));
  }

  emscripten::val get_recovered()
  {
    return emscripten::val(emscripten::typed_memory_view(std::size(recovered), recovered.begin()));
  }

  emscripten::val get_dead()
  {
    return emscripten::val(emscripten::typed_memory_view(std::size(dead), dead.begin()));
  }

  emscripten::val get_quarantined()
  {
    return emscripten::val(emscripten::typed_memory_view(std::size(quarantined), quarantined.begin()));
  }

  emscripten::val get_beds()
  {
    return emscripten::val(emscripten::typed_memory_view(std::size(beds), beds.begin()));
  }
#else
  void print()
  {
    std::cout << std::dec << "[ ";
    std::cout << "S: " << std::accumulate(susceptible.begin(), susceptible.end(), 0) << " ";
    std::cout << "I: " << std::accumulate(infectious.begin(), infectious.end(), 0) << " ";
    std::cout << "R: " << std::accumulate(recovered.begin(), recovered.end(), 0) << " ";
    std::cout << "D: " << std::accumulate(dead.begin(), dead.end(), 0) << " ";
    std::cout << "Q: " << std::accumulate(quarantined.begin(), quarantined.end(), 0) << " ";
    std::cout << "B: " << std::accumulate(beds.begin(), beds.end(), 0) << " ";
    //std::copy(std::begin(infectious), std::end(infectious), std::experimental::make_ostream_joiner(std::cout, ", "));
    std::cout << "]" << std::endl;
  }
#endif

private:
  uint8_t infect()
  {
    static std::normal_distribution<float> rng_lifetime(0.5, 0.2);
    static std::uniform_real_distribution<float> rng_risk;
    return STATE_INFECTIOUS | (static_cast<uint8_t>(MIN_DAYS_SICK + rng_lifetime(rng) * MAX_DAYS_SICK) << 3) | (rng_risk(rng) < RISK_RATE ? static_cast<uint8_t>(1) << 7 : 0);
  }

  template <typename F>
  void for_each_county(F f)
  {
    for (std::size_t n = 0; n < std::size(counties); ++n)
    {
      const auto begin = pop.begin() + counties[n];
      const auto end = n == std::size(counties) - 1 ? pop.end() : pop.begin() + counties[n + 1];
      f(begin, end, n);
    }
  }

  void run_county(uint8_t *begin, uint8_t *end, std::size_t n, float social_distancing_factor, std::size_t num_tests, float app_factor)
  {
    std::uniform_real_distribution<float> rng_infection;

    const auto size = std::distance(begin, end);
    std::uniform_int_distribution<std::size_t> rng_element(0, size - 1);

    std::for_each(begin, end, [&](auto &p) {
      const auto state = get_state(p);

      if (state > STATE_HEALTHY && state < STATE_RECOVERED)
      {
        set_timer(p, get_timer(p) - 1);
      }

      if (state == STATE_INFECTIOUS)
      {
        if (get_timer(p) < HOSPITAL_AFTER && has_risk(p))
        {
          if (beds[n] > 0)
          {
            --beds[n];
            return set_state(p, STATE_HOSPITAlISED);
          }
          else
          {
            return set_state(p, STATE_DEAD);
          }
        }
      }

      if (state > STATE_HEALTHY && state < STATE_RECOVERED)
      {
        if (get_timer(p) < 1)
        {
          if (state == STATE_HOSPITAlISED)
          {
            ++beds[n];
            if (rng_infection(rng) < DEAD_RATE_IN_HOSPITAL)
            {
              set_state(p, STATE_DEAD);
            }
            else
            {
              set_state(p, STATE_RECOVERED);
            }
          }
          else
          {
            set_state(p, STATE_RECOVERED);
          }
        }
        else
        {
          if (state == STATE_INFECTIOUS) {
            const auto num_contacts = std::min<std::size_t>(MAX_CONTACTS, std::ceil(MIN_CONTACTS + size * 0.0003)) * (1.f - social_distancing_factor);
            for (std::size_t n = 0; n < num_contacts; ++n)
            {
              uint8_t &p2 = begin[rng_element(rng)];

              if (get_state(p2) == STATE_HEALTHY && rng_infection(rng) < P)
              {
                p2 = infect();
              }
            }
          }

          const auto t = get_timer(p);
          if (rng_infection(rng) < app_factor * 0.8 * std::max<float>(.05f, std::min<float>(1, (1 - (t / MAX_DAYS_SICK))))) {
            set_state(p, STATE_HOME_QUARANTINED);
          }
        }
      }
    });

    for (std::size_t n = 0; n < num_tests; ++n) {
      uint8_t &p2 = begin[rng_element(rng)];
      if (get_state(p2) == STATE_INFECTIOUS) {
        set_state(p2, STATE_QUARANTINED);
      }
    }
  }

  void gen_stats(uint8_t *begin, uint8_t *end, std::size_t n)
  {
    std::for_each(begin, end, [&](auto p) {
      const auto state = get_state(p);

      if (state == STATE_HEALTHY)
      {
        ++susceptible[n];
      }
      else if (state > STATE_HEALTHY && state < STATE_RECOVERED)
      {
        ++infectious[n];
      }
      else if (state == STATE_RECOVERED)
      {
        ++recovered[n];
      }
      else
      {
        ++dead[n];
      }

      if (state == STATE_QUARANTINED) {
        ++quarantined[n];
      }
    });
    susceptible[n] *= 10;
    infectious[n] *= 10;
    recovered[n] *= 10;
    dead[n] *= 10;
  }

  std::size_t one_of_the_biggest()
  {
    static std::exponential_distribution rng_expo(3.5);
    while (true)
    {
      const auto x = rng_expo(rng);
      if (x <= 1.0)
      {
        return biggest[static_cast<size_t>(std::floor(x * std::size(counties)))];
      }
    }
  }

  std::array<uint8_t, POP_SIZE> pop;
  std::array<std::size_t, std::size(counties)> beds;
  xorshift rng;
  float progress;
  std::future<void> result;
  std::array<std::size_t, std::size(counties)> susceptible;
  std::array<std::size_t, std::size(counties)> infectious;
  std::array<std::size_t, std::size(counties)> recovered;
  std::array<std::size_t, std::size(counties)> dead;
  std::array<std::size_t, std::size(counties)> quarantined;
};

#ifndef __EMSCRIPTEN__
int main()
{
  auto bla = simulation();

  for (std::size_t n = 0; n < 150; ++n)
  {
    bla.step(0, 0, 0, 0, 0);
    bla.wait_finished();
    bla.print();
  }
}
#else
EMSCRIPTEN_BINDINGS(simulation)
{
  emscripten::class_<simulation>("Simulation")
      .constructor()
      .function("step", &simulation::step)
      .function("getSusceptible", &simulation::get_susceptible)
      .function("getInfectious", &simulation::get_infectious)
      .function("getRecovered", &simulation::get_recovered)
      .function("getDead", &simulation::get_dead)
      .function("getQuarantined", &simulation::get_quarantined)
      .function("getBeds", &simulation::get_beds)
      .function("getProgress", &simulation::get_progress)
      .function("waitFinished", &simulation::wait_finished);
}
#endif
