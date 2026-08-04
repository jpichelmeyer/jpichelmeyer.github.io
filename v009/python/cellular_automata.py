#!/usr/bin/env python3
"""
cellular_automata.py
=====================

A flexible 1D/2D cellular automaton explorer, running entirely in the
terminal. Standard library only.

Run it directly:   python3 cellular_automata.py
Or it can be dropped, unmodified, into the site's Pyodide-backed
project runner (see scripts/_projects.js -> window._mountPyodideTerminal).

The sections below are ordered to match the semester's topic sequence,
so this file doubles as a worked example of how each concept was
layered on top of the last to build one real program:

    1.  Variables, expressions
    2.  Conditionals, control flow
    3.  Loops
    4.  Functions, recursion
    5.  Strings
    6.  Collections (list, set, dict, tuple)
    7.  Debugging, exceptions
    8.  Modules, Files I/O
    9.  Classes
    10. Inheritance, regular expressions
    11. Algorithms & pseudocode
"""

# ---------------------------------------------------------------------------
# Host-environment shim
# ---------------------------------------------------------------------------
# `ainput` and `should_stop` are ordinary names this module calls like any
# other function. When this file is run as a real script, neither name
# exists yet, so we define plain fallbacks right here. When it's instead
# executed inside the site's browser terminal, the host JS pre-defines
# both names as globals *before* running this file (see _projects.js),
# so the `try` below finds them already there and leaves them alone.
# That's the entire portability trick -- nothing else in this file needs
# to know or care which environment it's running in.
import sys

try:
    ainput
except NameError:
    async def ainput(prompt=''):
        return input(prompt)

try:
    should_stop
except NameError:
    def should_stop():
        return False

# ===========================================================================
# 8. Modules, Files I/O  (imports live at top of file, by convention)
# ===========================================================================
import asyncio
import os
import random
import re
import time

IS_PYODIDE = sys.platform == 'emscripten'


def clear_screen():
    """Clear the terminal. The ANSI sequence works in any real terminal
    *and* is understood by the browser terminal (which watches stdout
    for it and clears its own screen) -- so this one function works
    everywhere without an environment check."""
    print('\x1b[2J\x1b[H', end='')


# ===========================================================================
# 1. Variables, expressions  /  2. Conditionals, control flow
# ===========================================================================
# Small validated-input helpers. Every prompt in this program goes
# through one of these, so the configuration screens below are just
# straight-line calls -- no repeated validation logic.

async def ask_choice(prompt, options):
    """Show a numbered menu of `options` and return the chosen string."""
    while True:
        print(prompt)
        for i, opt in enumerate(options, start=1):
            print(f"  {i}. {opt}")
        raw = (await ainput("> ")).strip()
        if raw.isdigit() and 1 <= int(raw) <= len(options):
            return options[int(raw) - 1]
        print("Please enter a number from the list above.\n")


async def ask_int(prompt, default, lo=None, hi=None):
    while True:
        raw = (await ainput(f"{prompt} [{default}]: ")).strip()
        if raw == '':
            return default
        if raw.lstrip('-').isdigit():
            val = int(raw)
            if (lo is None or val >= lo) and (hi is None or val <= hi):
                return val
        print("  -> not a valid whole number in range, try again.")


async def ask_float(prompt, default, lo=None, hi=None):
    while True:
        raw = (await ainput(f"{prompt} [{default}]: ")).strip()
        if raw == '':
            return default
        try:
            val = float(raw)
        except ValueError:
            print("  -> not a valid number, try again.")
            continue
        if (lo is None or val >= lo) and (hi is None or val <= hi):
            return val
        print("  -> out of range, try again.")


# ===========================================================================
# 4. Functions, recursion
# ===========================================================================

def int_to_bits(n, width=8):
    """Turn n into a fixed-width bit string, one bit at a time -- a
    recursive stand-in for the built-in `format(n, '08b')`."""
    if width == 0:
        return ''
    return int_to_bits(n // 2, width - 1) + str(n % 2)


# ===========================================================================
# 5. Strings  /  6. Collections (list, set, dict, tuple)
# ===========================================================================

def rule_to_table(rule_number):
    """Wolfram elementary-CA rule number (0-255) -> a dict mapping every
    3-cell neighborhood tuple to its next state (0 or 1)."""
    bits = int_to_bits(rule_number, 8)
    neighborhoods = [
        (1, 1, 1), (1, 1, 0), (1, 0, 1), (1, 0, 0),
        (0, 1, 1), (0, 1, 0), (0, 0, 1), (0, 0, 0),
    ]
    return {nb: int(bit) for nb, bit in zip(neighborhoods, bits)}


def row_to_line(row, alive_char='#', dead_char=' '):
    return ''.join(alive_char if cell else dead_char for cell in row)


async def configure_1d():
    print("\n--- 1D configuration ---")
    rule = await ask_int("Wolfram rule number (0-255)", 30, 0, 255)
    width = await ask_int("Row width (cells)", 79, 5, 400)
    seed = await ask_choice("Initial row", ["single live cell (center)", "random"])
    max_lines = await ask_int("Lines to generate (0 = run until stopped)", 60, 0, None)
    delay = await ask_float("Delay between lines (seconds)", 0.03, 0, None)
    return {
        'rule': rule, 'width': width, 'seed': seed,
        'max_lines': max_lines, 'delay': delay,
    }


def initial_row_1d(config):
    width = config['width']
    if config['seed'].startswith('single'):
        row = [0] * width
        row[width // 2] = 1
        return row
    return [random.randint(0, 1) for _ in range(width)]


def next_row_1d(row, table):
    width = len(row)
    new_row = [0] * width
    for i in range(width):
        neighborhood = (row[(i - 1) % width], row[i], row[(i + 1) % width])
        new_row[i] = table[neighborhood]
    return new_row


# ===========================================================================
# 3. Loops  /  7. Debugging, exceptions
# ===========================================================================

async def run_1d(config):
    table = rule_to_table(config['rule'])
    row = initial_row_1d(config)
    clear_screen()
    print(f"Rule {config['rule']}  --  stop at any time with the Stop button "
          f"(or Ctrl+C in a real terminal)\n")

    lines_drawn = 0
    try:
        while True:
            print(row_to_line(row))
            lines_drawn += 1
            if config['max_lines'] and lines_drawn >= config['max_lines']:
                break
            if should_stop():
                break
            if config['delay']:
                await asyncio.sleep(config['delay'])
            row = next_row_1d(row, table)
    except (KeyboardInterrupt, EOFError):
        pass

    print(f"\nStopped after {lines_drawn} lines.")


# ===========================================================================
# 9. Classes  /  10. Inheritance, regular expressions
# ===========================================================================

class Topology:
    """How a 2D grid's edges are (or aren't) identified with each
    other. Subclasses implement `wrap`, which takes a neighbor
    coordinate that may have stepped outside the grid and returns
    either the (x, y) it's identified with, or None if that neighbor
    simply doesn't exist."""

    name = "Topology"

    def wrap(self, x, y, w, h):
        raise NotImplementedError


class FinitePlane(Topology):
    """No edges joined -- off-grid neighbors don't exist."""
    name = "Finite plane (no edges joined)"

    def wrap(self, x, y, w, h):
        if 0 <= x < w and 0 <= y < h:
            return (x, y)
        return None


class Cylinder(Topology):
    """Left/right edges glued directly; top/bottom stay open."""
    name = "Cylinder"

    def wrap(self, x, y, w, h):
        if y < 0 or y >= h:
            return None
        return (x % w, y)


class Torus(Topology):
    """Both pairs of opposite edges glued directly -- a flat torus."""
    name = "Torus"

    def wrap(self, x, y, w, h):
        return (x % w, y % h)


class KleinBottle(Topology):
    """Left/right glued directly; top/bottom glued with a flip in x
    (identification word 'aabb\u207b\u00b9')."""
    name = "Klein bottle"

    def wrap(self, x, y, w, h):
        if y < 0 or y >= h:
            x = w - 1 - x
        return (x % w, y % h)


class CrossCap(Topology):
    """The real projective plane RP\u00b2: both pairs of opposite edges
    are glued antipodally (identification word 'abab'), so crossing
    either boundary flips the *other* coordinate."""
    name = "Cross-cap (RP\u00b2)"

    def wrap(self, x, y, w, h):
        if x < 0 or x >= w:
            y = h - 1 - y
        if y < 0 or y >= h:
            x = w - 1 - x
        return (x % w, y % h)


class Sphere(Topology):
    """S\u00b2 admits no flat metric (Gauss-Bonnet), so unlike the
    surfaces above this can't be an exact isometric edge gluing. This
    approximates it by wrapping left/right like a cylinder (lines of
    longitude) and pinching the top and bottom rows into two poles --
    stepping off the top or bottom edge re-enters that same edge,
    reflected to the opposite longitude, the way meridians all meet at
    a globe's poles."""
    name = "Sphere (approx.)"

    def wrap(self, x, y, w, h):
        if y < 0:
            y, x = 0, w - 1 - x
        elif y >= h:
            y, x = h - 1, w - 1 - x
        return (x % w, y % h)


TOPOLOGIES = {
    t.name: t for t in
    (FinitePlane(), Torus(), CrossCap(), Cylinder(), KleinBottle(), Sphere())
}


class Grid:
    """A 2D cellular automaton state: a width x height grid of 0/1
    cells, stepped forward under a Conway-style birth/survive rule and
    a given edge Topology."""

    def __init__(self, width, height, topology, birth, survive, density=0.35):
        self.width = width
        self.height = height
        self.topology = topology
        self.birth = birth
        self.survive = survive
        self.cells = [
            [1 if random.random() < density else 0 for _ in range(width)]
            for _ in range(height)
        ]

    def count_live_neighbors(self, x, y):
        count = 0
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx == 0 and dy == 0:
                    continue
                wrapped = self.topology.wrap(x + dx, y + dy, self.width, self.height)
                if wrapped is None:
                    continue
                nx, ny = wrapped
                count += self.cells[ny][nx]
        return count

    # -----------------------------------------------------------------
    # 11. Algorithms & pseudocode
    #
    #   for each cell (x, y) in the grid:
    #       n <- count of live neighbors, following the grid's topology
    #       if cell is alive and n is in the survive set:  stays alive
    #       elif cell is dead and n is in the birth set:    becomes alive
    #       else:                                           (stays) dead
    #   replace the whole grid with the new generation at once, so every
    #   cell's next state is computed from the *same* snapshot in time.
    # -----------------------------------------------------------------
    def step(self):
        new_cells = [[0] * self.width for _ in range(self.height)]
        for y in range(self.height):
            for x in range(self.width):
                n = self.count_live_neighbors(x, y)
                alive = self.cells[y][x]
                if alive and n in self.survive:
                    new_cells[y][x] = 1
                elif not alive and n in self.birth:
                    new_cells[y][x] = 1
        self.cells = new_cells

    def render(self, alive_char='#', dead_char='.'):
        return '\n'.join(
            ''.join(alive_char if c else dead_char for c in row)
            for row in self.cells
        )


def parse_int_set(raw, fallback):
    """Pull every run of digits out of `raw` (accepts "3", "3,4", "3 4",
    "3-and-4", anything) and return it as a set of ints."""
    digits = re.findall(r'\d+', raw)
    if not digits:
        return fallback
    return {int(d) for d in digits}


async def configure_2d():
    print("\n--- 2D configuration ---")
    width = await ask_int("Grid width", 40, 5, 200)
    height = await ask_int("Grid height", 20, 5, 100)
    topo_name = await ask_choice("Edge topology", list(TOPOLOGIES.keys()))
    density = await ask_float("Initial live-cell density (0-1)", 0.35, 0, 1)
    birth_raw = (await ainput("Birth neighbor counts [3]: ")).strip()
    survive_raw = (await ainput("Survive neighbor counts [2,3]: ")).strip()
    birth = parse_int_set(birth_raw, {3})
    survive = parse_int_set(survive_raw, {2, 3})
    max_gens = await ask_int("Generations to run (0 = run until stopped)", 0, 0, None)
    delay = await ask_float("Delay between generations (seconds)", 0.12, 0, None)
    return {
        'width': width, 'height': height, 'topology_name': topo_name,
        'density': density, 'birth': birth, 'survive': survive,
        'max_gens': max_gens, 'delay': delay,
    }


async def run_2d(config):
    topology = TOPOLOGIES[config['topology_name']]
    grid = Grid(config['width'], config['height'], topology,
                config['birth'], config['survive'], config['density'])

    generation = 0
    try:
        while True:
            clear_screen()
            print(f"{topology.name}  |  gen {generation}  |  "
                  f"B{sorted(config['birth'])}/S{sorted(config['survive'])}\n")
            print(grid.render())
            generation += 1
            if config['max_gens'] and generation >= config['max_gens']:
                break
            if should_stop():
                break
            if config['delay']:
                await asyncio.sleep(config['delay'])
            grid.step()
    except (KeyboardInterrupt, EOFError):
        pass

    print(f"\nStopped after {generation} generations.")

    # 8. Modules, Files I/O -- offer to save the final frame. Skipped
    # automatically inside the browser terminal, which has no real
    # filesystem for the visitor to receive a file from.
    if not IS_PYODIDE:
        save = (await ainput("\nSave final frame to a text file? [y/N] ")).strip().lower()
        if save.startswith('y'):
            filename = (await ainput("Filename [ca_output.txt]: ")).strip() or 'ca_output.txt'
            with open(filename, 'w') as f:
                f.write(grid.render() + '\n')
            print(f"Saved to {filename}")


# ===========================================================================
# Entry point
# ===========================================================================

async def main():
    print("=" * 60)
    print("  Cellular Automata  --  1D / 2D terminal explorer")
    print("=" * 60)
    dimension = await ask_choice(
        "\nChoose a mode:",
        ["1D (Wolfram-style linescape)", "2D (Life-like grid)"],
    )
    try:
        if dimension.startswith('1D'):
            config = await configure_1d()
            await run_1d(config)
        else:
            config = await configure_2d()
            await run_2d(config)
    except (KeyboardInterrupt, EOFError):
        print("\nInterrupted.")


if __name__ == '__main__':
    # A real terminal has no event loop running yet, so asyncio.run()
    # is the normal, blocking way to kick things off. Pyodide, though,
    # already has its own event loop running by the time this file's
    # top-level code executes (that's what lets scripts elsewhere use
    # top-level `await`) -- and asyncio.run() refuses to start a
    # second loop inside an already-running one. So: if a loop is
    # already running, hand main() to *that* loop as a task instead of
    # trying to start a new one. Either way, main() actually runs;
    # this only decides how it gets scheduled.
    try:
        _running_loop = asyncio.get_running_loop()
    except RuntimeError:
        _running_loop = None

    if _running_loop is not None:
        asyncio.ensure_future(main())
    else:
        asyncio.run(main())
