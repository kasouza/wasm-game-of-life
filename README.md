# wasm-game-of-life

This project is an implementation of Conway's Game of Life that I made with Javascript and WebAssembly, using Rust + wasm-bindgen.

For the heavier calculations (ticking the Universe of the game), I used the Rust compiled to WASM, and for rendering I used a WebGL.

If you want to make this project yourself, you can follow [this](https://rustwasm.github.io/docs/book/) tutorial. If you are interested in Rust and WebAssembly, I really recommend you to follow the tutorial and try to build you own version, it'll surely be very fun!

# Building from source
If you want to see this project in actions you'll need [`wasm-pack`](https://github.com/rustwasm/wasm-pack) and [`Node.js`](https://nodejs.org/en/):

First, clone the repo:
```
git clone https://github.com/kasouza/wasm-game-of-life
```

Go to the folder:
```
cd wasm-game-of-life
```

Then compile the Rust code to WebAssembly using `wasm-pack`, it will generate a npm package in the `pkg` folder
```
wasm-pack build --release
```

Now, you go to the `www` directory, which is the Javascript project
```
cd www
```
and run:
```
npm install
```
Now all the dependencies have been installed (including the wasm package we just built).
The last step is to simply start a `webpack-dev-server` with:
```
npm start
```

Now if you go to `localhost:8080` in your browser, you should see something like this:

<p align="center">
  <img src="./example.gif">
</p>

I hope you liked it!
