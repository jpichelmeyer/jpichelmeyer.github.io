// v009/site/scripts/_projects_desktop_cellular_automata.js
//
// A flexible 1D/2D cellular automaton, written in Python (standard
// library only) and run live in the browser via Pyodide, through the
// shared window._mountPyodideTerminal helper in _projects.js.
//
// The Python source is a single, unmodified file shared with the
// terminal-only version used in the classroom:
//     python/cellular_automata.py
//
// To point this same project at a different standard-library-only
// script, duplicate this file and change `SCRIPT_PATH` below (and
// id/label/desc) -- window._mountPyodideTerminal takes care of the
// rest, exactly like _mountGodotProject does for Godot exports.

const SCRIPT_PATH = './python/cellular_automata.py';

window._registerProject({
    id: 'cellular-automata',
    label: 'Cellular Automata',
    layout: 'desktop',
    thumb: 'dull.svg',
    desc: 'A terminal-based 1D/2D cellular automaton written in Python. Choose 1D or 2D, configure the rules (including six different edge topologies for the 2D grid: finite plane, torus, cross-cap, cylinder, Klein bottle, and sphere), then watch it run.',
    init(container) {
        return window._mountPyodideTerminal(container, SCRIPT_PATH);
    }
});
