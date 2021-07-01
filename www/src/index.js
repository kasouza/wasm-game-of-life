import { Universe } from 'wasm-game-of-life';
import { memory } from 'wasm-game-of-life/wasm_game_of_life_bg.wasm';

import * as Utils from './webgl-utils.js';

import vertexShaderSource from './vertex-shader.vert';
import fragmentShaderSource from './fragment-shader.frag';

let shouldAnimate = true;

const fps = new class {
  constructor() {
    this.fps = document.getElementById("fps");
    this.frames = [];
    this.lastFrameTimeStamp = performance.now();
  }

  render() {
    // Convert the delta time since the last frame render into a measure
    // of frames per second.
    const now = performance.now();
    const delta = now - this.lastFrameTimeStamp;
    this.lastFrameTimeStamp = now;
    const fps = 1 / delta * 1000;

    // Save only the latest 100 timings.
    this.frames.push(fps);
    if (this.frames.length > 100) {
      this.frames.shift();
    }

    // Find the max, min, and mean of our 100 latest timings.
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    for (let i = 0; i < this.frames.length; i++) {
      sum += this.frames[i];
      min = Math.min(this.frames[i], min);
      max = Math.max(this.frames[i], max);
    }
    let mean = sum / this.frames.length;

    // Render the statistics.
    this.fps.textContent = `
Frames per Second:
         latest = ${Math.round(fps)}
avg of last 100 = ${Math.round(mean)}
min of last 100 = ${Math.round(min)}
max of last 100 = ${Math.round(max)}
`.trim();
  }
};

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

function toggleCell(e, universe, cellSize) {
	const canvas = e.target;
	const rect = canvas.getBoundingClientRect();
	const size = universe.size();

	const scaleX = canvas.width / rect.width;
	const scaleY = canvas.height / rect.height;

	const x = (e.clientX - rect.left) * scaleX;
	const y = (e.clientY - rect.top) * scaleY;

	const row = Math.min(Math.floor(y / (cellSize + 1)), size - 1);
	const col = Math.min(Math.floor(x / (cellSize + 1)), size - 1);

	universe.toggle_cell(row, col);
}

function main() {
    const canvas = document.querySelector('#webgl-canvas');
	const universe = Universe.new(220);

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

	let x;
	let y;
	let x2;
	let y2;

    for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
			x = col * (cellSize + 1) + 1;
			y = row * (cellSize + 1) + 1;
			
			x2 = x + cellSize;
			y2 = y + cellSize;

            deadCellsVertices.push(
				x, y,
				x2, y,
				x, y2,

				x, y2,
				x2, y,
				x2, y2,
			);
        }
    }

    world.addObject('deadCells',
        gl.TRIANGLES, [0, 0, 0, 1], deadCellsVertices);

    world.addObject('aliveCells',
        gl.TRIANGLES, [1, 1, 1, 1], []);

	document.querySelector('#btn').addEventListener('click', () => {
		shouldAnimate = !shouldAnimate;
		if (shouldAnimate) {
			requestAnimationFrame(() => {
				tick(gl, program, programInfo, world, universe, cellSize);
			});
		}
	});

	canvas.addEventListener('click', (e) => {
		toggleCell(e, universe, cellSize);

		update(gl, program, programInfo, world, universe, cellSize);
		render(gl, program, programInfo, world, universe, cellSize);
	});


    requestAnimationFrame(() => {
        tick(gl, program, programInfo, world, universe, cellSize);
    });
}

function render(gl, program, programInfo, world, universe, cellSize) {
    gl.useProgram(program);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if(Utils.resizeCanvasToDisplaySize(gl.canvas)) {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
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
}

function update(gl, program, programInfo, world, universe, cellSize) {
	const size = universe.size();
	const ptr = universe.cells();
	const cells = new Uint8Array(memory.buffer, ptr, size * size);

	const newAliveCells = [];
	const newDeadCells = [];

	let x;
	let y;
	let x2;
	let y2;

	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			const idx = col + (row * size); 

			x = col * (cellSize + 1) + 1;
			y = row * (cellSize + 1) + 1;
			
			x2 = x + cellSize;
			y2 = y + cellSize;

			// I know this is ugly as hell
			if (cells[idx]) {
				newAliveCells.push(
					x, y,
					x2, y,
					x, y2,

					x, y2,
					x2, y,
					x2, y2,
				);
			} else {
				newDeadCells.push(
					x, y,
					x2, y,
					x, y2,

					x, y2,
					x2, y,
					x2, y2,
				);
			}
		}
	}

	world.updateObject('aliveCells', { vertices: newAliveCells });
	world.updateObject('deadCells', { vertices: newDeadCells });
}

function tick(gl, program, programInfo, world, universe, cellSize) {
	fps.render();

	// Update the univese to the next gen
	universe.tick();

	// Update stuff for rendering, doesn't change nothing in the universe,
	// only rendering things
	update(gl, program, programInfo, world, universe, cellSize);
	
	// Just renders, doesn't update nothing
	render(gl, program, programInfo, world, universe, cellSize);

	if (shouldAnimate) {
		requestAnimationFrame(() => {
			tick(gl, program, programInfo, world, universe, cellSize);
		});
	}
}

main();
