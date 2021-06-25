export default {
    createShader(gl, type, src) {
        const shader = gl.createShader(type);

        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        const message = gl.getShaderInfoLog(shader);

        if (message) {
            const shaderType = type == gl.VERTEX ? 'vertex' : 'fragment';
            throw `error while compiling ${shaderType} shader: ${message}`;
        }

        return shader;
    },

    createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        const success = gl.getProgramParameter(program, gl.LINK_STATUS);

        if (!success) {
            throw gl.getProgramInfoLog(program);
        }

        return program;
    },

    resizeCanvasToDisplaySize(canvas) {
        const dpr = window.devicePixelRatio;
        const boundingRect = canvas.getBoundingClientRect();
        
        const displayWidth = Math.ceil(boundingRect.width * dpr);
        const displayHeight = Math.ceil(boundingRect.height * dpr);

        const shouldResize = canvas.width != displayWidth ||
                            canvas.height != displayHeight;

        if(shouldResize) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }

        return shouldResize;
    }
}
