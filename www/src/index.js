import { Universe } from 'wasm-game-of-life';
import { memory } from 'wasm-game-of-life/wasm_game_of_life_bg.wasm';

import * as Utils from './webgl-utils.js';

import vertexShaderSource from './vertex-shader.vert';
import fragmentShaderSource from './fragment-shader.frag';

function createWorld() {
    return Object.create({
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
    });
}

function cellVertices(cellSize, row, col) {
    const x = col * (cellSize + 1) + 1;
    const y = row * (cellSize + 1) + 1;
    
    const x2 = x + cellSize;
    const y2 = y + cellSize;

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
	const universe = Universe.new(60);

    const size = universe.size();	// In rows/cols number
	const cellSize = 5;				// In pixels

	// Pixels occupied by the cells + pixels between the cells
	const canvasSize =  (size * cellSize) + size;

	canvas.width = canvasSize;
	canvas.height = canvasSize;

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

    gl.bindBuffer(gl.ARRAY_BUFFER,
        programInfo.buffers.position);

    gl.enableVertexAttribArray(
        programInfo.attributeLocations.position);

    gl.vertexAttribPointer(programInfo.buffers.position,
        2, gl.FLOAT, false, 0, 0);

    const world = createWorld();
    const lineEnd = (cellSize + 1) * size + 1;

    // Create a grid object
    const gridVertices = [];

    for (let i = 0; i <= size; i++) {
        const lineStart = i * (cellSize + 1) + 1;
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
            deadCellsVertices.push(...cellVertices(cellSize, row, col));
        }
    }

    world.addObject('deadCells',
        gl.TRIANGLES, [0, 0, 0, 1], deadCellsVertices);

    world.addObject('aliveCells',
        gl.TRIANGLES, [1, 1, 1, 1], []);

    requestAnimationFrame(() => {
        tick(gl, program, programInfo, world, universe, cellSize);
    });
}

function tick(gl, program, programInfo, world, universe, cellSize) {
	// ----- updating stuff ------
	universe.tick();
	const size = universe.size();
	const ptr = universe.cells();
	const cells = new Uint8Array(memory.buffer, ptr, size * size);

	const newAliveCells = [];
	const newDeadCells = [];

	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			const idx = col + (row * size); 

			const vertices = cellVertices(cellSize, row, col);

			// I know this is ugly as hell
			if (cells[idx]) {
				newAliveCells.push(...vertices);
			} else {
				newDeadCells.push(...vertices);
			}
		}
	}

	world.updateObject('aliveCells', { vertices: newAliveCells });
	world.updateObject('deadCells', { vertices: newDeadCells });
	
	// ----- rendering stuff -----
    gl.useProgram(program);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if(Utils.resizeCanvasToDisplaySize(gl.canvas)) {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		console.log('a');
    }


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
        tick(gl, program, programInfo, world, universe, cellSize);
    });
}

main();
