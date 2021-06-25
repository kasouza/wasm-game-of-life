
import Utils from './webgl-utils.js';

import vertexShaderSource from './vertex-shader.vert';
import fragmentShaderSource from './fragment-shader.frag';

const CELL_SIZE = 5; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

function createWorld() {
    return {
        objects: {},

        addObject(name, type, color, vertices) {
            this.objects[name] = {
                type,
                color,
                vertices,
            };
        },

        deleteObject(name) {
            delete this.objects[name];
        },

        updateObject(name, updates) {
            for (const update in updates) {
                this.objects[name][update] = updates[update];
            }
        }
    }
}

function cellVertices(row, col) {
    const x = col * (CELL_SIZE + 1) + 1;
    const y = row * (CELL_SIZE + 1) + 1;
    
    const x2 = x + CELL_SIZE;
    const y2 = y + CELL_SIZE;

    return [
        x, y,
        x2, y,
        x, y2,

        x, y2,
        x2, y,
        x2, y2,
    ];
}

function main() {
    const canvas = document.querySelector('#webgl-canvas');
    const gl = canvas.getContext('webgl');

    const vertexShader = Utils.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = Utils.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = Utils.createProgram(gl, vertexShader, fragmentShader);

    const programInfo = {
        buffers: {
            position: gl.createBuffer(),
        },
        attributeLocations: {
            position: gl.getAttribLocation(program, 'a_position'),
        },
        uniformLocations: {
            resolution: gl.getUniformLocation(program, 'u_resolution'),
            color: gl.getUniformLocation(program, 'u_color'),
        },
    };

    // const universe = Universe.new();
    //const size = universe.size;
    const size = 40;

    const world = createWorld();
    const lineEnd = (CELL_SIZE + 1) * size + 1;

    // Create a grid object
    const gridVertices = [];

    for (let i = 0; i <= size; i++) {
        const lineStart = i * (CELL_SIZE + 1) + 1;
        // Vertical line
        gridVertices.push(lineStart, 0);  // From
        gridVertices.push(lineStart, lineEnd);

        // Horizontal line
        gridVertices.push(0, lineStart);
        gridVertices.push(lineEnd, lineStart);
    }

    world.addObject('grid', gl.LINES, [0.3, 0.3, 0.3, 1], gridVertices);

    // Create cells objects
    const deadCellsVertices = [];

    for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
            deadCellsVertices.push(...cellVertices(row, col));
        }
    }

    world.addObject('deadCells',
        gl.TRIANGLES, [0, 0, 0, 1], deadCellsVertices);

    world.addObject('aliveCells',
        gl.TRIANGLES, [1, 1, 1, 1], []);

    world.updateObject('aliveCells', {
        vertices: [...cellVertices(20, 20)]
    });

    requestAnimationFrame(() => {
        render(gl, program, programInfo, world);
    });
}

function render(gl, program, programInfo, world) {
    gl.useProgram(program);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    /*
    if(Utils.resizeCanvasToDisplaySize(gl.canvas)) {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }
    */

    gl.bindBuffer(gl.ARRAY_BUFFER,
        programInfo.buffers.position);

    gl.enableVertexAttribArray(
        programInfo.attributeLocations.position);

    gl.vertexAttribPointer(programInfo.buffers.position,
        2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(programInfo.uniformLocations.resolution,
        gl.canvas.width, gl.canvas.height);

    for (const objectKey in world.objects) {
        const object = world.objects[objectKey];

        if(!object || !object.vertices) {
            continue;
        }

        gl.uniform4fv(programInfo.uniformLocations.color,
            object.color);

        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(object.vertices), gl.STATIC_DRAW);

        gl.drawArrays(object.type, 0, object.vertices.length / 2);
    }

    requestAnimationFrame(() => {
        render(gl, program, programInfo, world);
    });
}

window.onload = main;
