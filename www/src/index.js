import './css/index.css';

import { Universe } from 'wasm-game-of-life';
import * as Utils from './js/webgl-utils.js';

import vertexShaderSource from './shaders/vertex-shader.vert';
import fragmentShaderSource from './shaders/fragment-shader.frag';

let isPaused = false;

/**
 * Returns a World, which contaisn the objects to be rendered.
 *
 * @returns { World } An object that contains the objects to be rendered.
 */
function createWorld() {
    return Object.create({
        objects: {},

		/**
		 * Add a objects to be rendered.
		 * 
		 * @param { string } name - A name for the object.
		 * @param { GLEnum } type - A GLEnum specifying the primitive type to render (i.e. gl.TRIANGLES, gl.POINTS)
		 * @param { number[] } vertices - A list of integers representing the vertices of a objects.
		 * @param { boolean } shouldRender - Wheter or not the object should be rendered.
		 */
		addObject(name, type, vertices, shouldRender) {
            this.objects[name] = {
                type,
                vertices,
				shouldRender,
            };
        },
    });
}

/**
 * Toggle the value of a cell in a given Universe and set it to render if the game is paused.
 *
 * @param { MouseEvent } e
 * @param { Universe } universe - Universe to manipulate.
 * @param { World } world - World to manipulate.
 * @param { number } cellSize - An integer representing the size of a individual cell in pixels.
 */
function toggleCell(e, universe, world, cellSize) {
	const canvas = e.target;
	const rect = canvas.getBoundingClientRect();
	const size = universe.size();

	const scaleX = canvas.width / rect.width;
	const scaleY = canvas.height / rect.height;

	const x = (e.clientX - rect.left) * scaleX;
	const y = (e.clientY - rect.top) * scaleY;

	// I don't know why but row and cow are reversed for some reason
	const col = Math.min(Math.floor(y / (cellSize + 1)), size - 1);
	const row = Math.min(Math.floor(x / (cellSize + 1)), size - 1);
	
	if (isPaused) {
		const idx = col + (row * size);
		const cell = world.objects[`cell${idx}`];

		cell.shouldRender = !cell.shouldRender;
	}

	universe.toggle_cell(row, col);
}

/** Entry point of the program */
function main() {
	const body = document.body;
    const canvas = document.createElement('canvas');
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

    gl.vertexAttribPointer(programInfo.buffers.positon,
        2, gl.FLOAT, false, 0, 0);

	gl.useProgram(program);

	gl.uniform4fv(programInfo.uniformLocations.color,
		[0, 0, 0, 1]);

	gl.uniform2f(programInfo.uniformLocations.resolution,
		gl.canvas.width, gl.canvas.height);

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

    world.addObject('grid', gl.LINES, new Float32Array(gridVertices), true);

    // Create cells objects
	let x;
	let y;
	let x2;
	let y2;
	let idx;

    for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
			x = col * (cellSize + 1) + 1;
			y = row * (cellSize + 1) + 1;
			
			x2 = x + cellSize;
			y2 = y + cellSize;

			idx = row + (col * size);

            world.addObject(`cell${idx}`, gl.TRIANGLES, new Float32Array([
				x, y,
				x2, y,
				x, y2,

				x, y2,
				x2, y,
				x2, y2,
			]), true);
        }
    }

	const pauseButton = document.createElement('button');
	pauseButton.innerText = 'Stop';
	pauseButton.addEventListener('click', (e) => {
		isPaused = !isPaused;
		e.target.innerText = isPaused ? 'Play' : 'Stop';

		if (!isPaused) {
			requestAnimationFrame(() => {
				tick(gl, program, programInfo, world, universe, cellSize);
			});
		}
	});

	canvas.addEventListener('click', (e) => {
		toggleCell(e, universe, world, cellSize);

		if (!isPaused) {
			update(gl, program, programInfo, world, universe, cellSize);
		}

		render(gl, program, programInfo, world, universe, cellSize);
	});

	body.appendChild(pauseButton);
	body.appendChild(canvas);

    requestAnimationFrame(() => {
        tick(gl, program, programInfo, world, universe, cellSize);
    });
}

/**
 * Update the objects in a given world according to the changes that happened in the given Universe.
 *
 * @param { WebGLRenderingContext } gl
 * @param { World } world - An object containing the objects to be rendered.
 * @param { Universe } universe - An object that handles the calculations of the game.
 * @param { number } cellSize - An integer representing the size of a individual cell in pixels.
 */
function update(gl, world, universe, cellSize) {
	const changedCells = universe.cells();
	const size = universe.size();

	for (let i = 0; i < changedCells.length; i += 2) {
		const row = changedCells[i];
		const col = changedCells[i+1];

		const idx = col + (row * size);
		const cell = world.objects[`cell${idx}`];

		cell.shouldRender = true;
	}
}

/**
 * Render the objects in the given world
 *
 * @param { WebGLRenderingContext } gl
 * @param { WebGLProgram } program
 * @param { Object } programInfo - An objects containing informations about the rendering procces.
 * @param { World } world - An object containing the objects to be rendered.
 */
function render(gl, program, programInfo, world) {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if(Utils.resizeCanvasToDisplaySize(gl.canvas)) {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		gl.uniform2f(programInfo.uniformLocations.resolution,
			gl.canvas.width, gl.canvas.height);
    }

    for (const objectKey in world.objects) {
        const object = world.objects[objectKey];

        if (!object || !object.vertices || !object.shouldRender) {
            continue;
        }

        gl.bufferData(gl.ARRAY_BUFFER, object.vertices, gl.STATIC_DRAW);

        gl.drawArrays(object.type, 0, object.vertices.length / 2);

		object.shouldRender = isPaused;
    }


	world.objects['grid'].shouldRender = true;
}

/**
 * Advances the Universe to the next tick, updates and renders the game.
 *
 * @param { WebGLRenderingContext } gl
 * @param { WebGLProgram } program
 * @param { Object } programInfo - An objects containing informations about the rendering procces.
 * @param { World } world - An object containing the objects to be rendered.
 * @param { Universe } universe - An object that handles the calculations of the game.
 * @param { number } cellSize - An integer representing the size of a individual cell in pixels.
 */
function tick(gl, program, programInfo, world, universe, cellSize) {
	universe.tick();

	update(gl, world, universe, cellSize);
	render(gl, program, programInfo, world);

	if (!isPaused) {
		requestAnimationFrame(() => {
			tick(gl, program, programInfo, world, universe, cellSize);
		});
	}
}

// Don't use `window.onload = main`, it just doens't work and i don't know why
main();
