// v009/site/scripts/_projects_desktop_circuit.js

window._registerProject({
    id: 'circuit',
    label: 'Circuit Maker',
    layout: 'desktop',
    cats: ['Educational'],
    thumb: 'circuit.svg',
    desc: 'A hand-drawn sketchbook for building electric circuits. Drag batteries, resistors, LEDs, switches and more onto the paper, wire them up, and watch current flow and voltages change as you tweak the parts.',
    init(container) {
        window._mountGodotProject(container, './godot/circuit/circuit.html');
    }
});
