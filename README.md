# wasm-game-of-life

This project is a very simple implementation of Conway's Game of Life that I made with Javascript and WebAssembly, using Rust + wasm-bindgen.

# Compile from source

If you want to see this project in actions, you'll need `wasm-pack` and `npm`:

First, clone the repo:
```
git clone 
```

Go to the folder:
```
cd wasm-game-of-life
```

Then compile the Rust code to WebAssembly using `wasm-pack`, it will generate a `pkg` folder, which is a package you can use with `nodejs`
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
Now all the dependencies have been installed (including our wasm package we just built).
The last step is simply to start a `webpack-dev-server` with:
```
npm start
```

Now if you go to your browser and access `localhost:8080`, you should see something like this:
![screen-gif](./example.gif)

I hope you liked it!
