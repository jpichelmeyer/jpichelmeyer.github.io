// v009/site/scripts/_projects_desktop_cellular_automata.js

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
