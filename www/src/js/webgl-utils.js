/**
 * Create a shader of the given type.
 *
 * @param { WebGLRenderingContext } gl
 * @param { WebGLRenderingContext.VERTEXT_SHADER | WebGLRenderingContext.FRAGMENT_SHADER} type
 * @param { string } src Source code of the shader in GLSL
 *
 * @returns { WebGLShader }
 *
 * @throws Throws an error if the compilation failed.
 */
export function createShader(gl, type, src) {
	const shader = gl.createShader(type);

	gl.shaderSource(shader, src);
	gl.compileShader(shader);

	const message = gl.getShaderInfoLog(shader);

	if (message) {
		const shaderType = type == gl.VERTEX ? 'vertex' : 'fragment';
		throw `error while compiling ${shaderType} shader: ${message}`;
	}

	return shader;
}

/**
 * Create a program using the given shaders.
 *
 * @param { WebGLRenderingContext } gl
 * @param { WebGLShader } vertexShader
 * @param { WebGLShader } vertexShader
 *
 * @returns { WebGLProgram }
 *
 * @throws Throws an error if the linking failed.
 */
export function createProgram(gl, vertexShader, fragmentShader) {
	const program = gl.createProgram();

	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	const success = gl.getProgramParameter(program, gl.LINK_STATUS);

	if (!success) {
		throw gl.getProgramInfoLog(program);
	}

	return program;
}

/**
 * Resize the canvas to its client size if needed.
 *
 * @param { HTMLCanvasElement } canvas
 * 
 * @returns { boolean } Returns wheter or not the canvas has been resized.
 */
export function resizeCanvasToDisplaySize(canvas) {
	const boundingRect = canvas.getBoundingClientRect();
	
	const displayWidth = boundingRect.width;
	const displayHeight = boundingRect.height;

	const shouldResize = canvas.width != displayWidth ||
						canvas.height != displayHeight;

	if(shouldResize) {
		canvas.width = displayWidth;
		canvas.height = displayHeight;
	}

	return shouldResize;
}

