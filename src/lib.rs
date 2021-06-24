extern crate wasm_bindgen;

use wasm_bindgen::prelude::*;

const SIZE: usize = 40; // SIZE == widht == height

#[wasm_bindgen]
pub struct Universe {
    size: usize,
    cells: [bool; SIZE * SIZE],
    next_cells: [bool; SIZE * SIZE],
}

impl Universe {
    fn get_index(&self, x: usize, y: usize) -> usize {
        x + (y * self.size)
    }

    fn get_live_neighbors_count(&self, x: usize, y: usize) -> u8 {
        let mut count = 0;

        let north = if y == 0 {
            self.size - 1
        } else {
            y - 1
        };

        let east = if x == self.size - 1 {
            0
        } else {
            x + 1
        };

        let south = if y == self.size - 1 {
            0
        } else {
            y + 1
        };

        let west = if x == 0 {
            self.size - 1
        } else {
            x - 1
        };
        
        let nw = self.get_index(west, north);
        count += self.cells[nw] as u8;

        let n = self.get_index(x, north);
        count += self.cells[n] as u8;

        let ne = self.get_index(east, north);
        count += self.cells[ne] as u8;

        let w = self.get_index(west, y);
        count += self.cells[w] as u8;

        let e = self.get_index(east, y);
        count += self.cells[e] as u8;

        let sw = self.get_index(west, south);
        count += self.cells[sw] as u8;

        let s = self.get_index(x, south);
        count += self.cells[s] as u8;

        let se = self.get_index(east, south);
        count += self.cells[se] as u8;

        count
    }
}

#[wasm_bindgen]
impl Universe {
    pub fn new() -> Universe {
        Universe {
            size: SIZE,
            cells: [false; SIZE * SIZE],
            next_cells: [false; SIZE * SIZE],
        }
    }

    pub fn tick(&mut self) {
        for x in 0..SIZE {
            for y in 0..SIZE {
                let idx = self.get_index(x, y);

                let cell = self.cells[idx];
                let count = self.get_live_neighbors_count(x, y);

                self.next_cells[idx] = match (cell, count) {
                    (true, 2) | (true, 3) => true,
                    (false, 3) => true,
                    _ => false
                };
            }
        }
    }

    pub fn get_changed_cells() {}
}

