extern crate wasm_bindgen;

use wasm_bindgen::prelude::*;

const SIZE: usize = 40; // SIZE == widht == height

#[wasm_bindgen]
pub struct Universe {
    size: usize,
    previous_cells: [bool; SIZE * SIZE],
    cells: [bool; SIZE * SIZE],
}

impl Universe {
    fn set_size(&mut self, size: usize) {
        self.size = size;
    }

    fn toggle_cell(&mut self, x: usize, y: usize) {
        let idx = self.get_index(x, y);

        self.cells[idx] = !self.cells[idx];
    }
}

impl Universe {
    fn get_index(&self, x: usize, y: usize) -> usize {
        x + (y * self.size)
    }

    fn get_live_neighbors_count(&self, x: usize, y: usize) -> u8 {
        let mut count = 0;

        let north = if y == 0 { self.size - 1 } else { y - 1 };

        let east = if x == self.size - 1 { 0 } else { x + 1 };

        let south = if y == self.size - 1 { 0 } else { y + 1 };

        let west = if x == 0 { self.size - 1 } else { x - 1 };

        let nw = self.get_index(west, north);
        count += self.previous_cells[nw] as u8;

        let n = self.get_index(x, north);
        count += self.previous_cells[n] as u8;

        let ne = self.get_index(east, north);
        count += self.previous_cells[ne] as u8;

        let w = self.get_index(west, y);
        count += self.previous_cells[w] as u8;

        let e = self.get_index(east, y);
        count += self.previous_cells[e] as u8;

        let sw = self.get_index(west, south);
        count += self.previous_cells[sw] as u8;

        let s = self.get_index(x, south);
        count += self.previous_cells[s] as u8;

        let se = self.get_index(east, south);
        count += self.previous_cells[se] as u8;

        count
    }
}

#[wasm_bindgen]
impl Universe {
    pub fn new() -> Universe {
        Universe {
            size: SIZE,
            previous_cells: [false; SIZE * SIZE],
            cells: [false; SIZE * SIZE],
        }
    }

    pub fn tick(&mut self) {
        for x in 0..self.size {
            for y in 0..self.size {
                let idx = self.get_index(x, y);

                self.previous_cells[idx] = self.cells[idx];
                let cell = self.previous_cells[idx];
                let count = self.get_live_neighbors_count(x, y);

                self.cells[idx] = match (cell, count) {
                    (true, 2) | (true, 3) => true,
                    (false, 3) => true,
                    _ => false,
                };
            }
        }
    }

    pub fn get_cells(&self) -> *const bool {
        self.cells.as_ptr()
    }
}

#[cfg(test)]
mod tests {
    use crate::Universe;

    #[test]
    pub fn test_zero_live_neigbors_count() {
        let mut universe = Universe::new();

        universe.set_size(3); // 3 x 3 universe
        universe.toggle_cell(1, 1); // Middle cell to true

        // Only the center cell is alive, so the live neighbors count
        // should be zero
        assert_eq!(universe.get_live_neighbors_count(1, 1), 0);
    }

    #[test]
    pub fn test_eight_live_neigbors_count() {
        let mut universe = Universe::new();

        universe.set_size(3); // 3 x 3 universe

        // Set all cells to true
        for x in 0..3 {
            for y in 0..3 {
                universe.toggle_cell(x, y);
            }
        }

        // All cels are alive, so the live neighbors count
        // should be 8 for every cell, even when the cells is
        // in the 'wall' of the universe
        for x in 0..3 {
            for y in 0..3 {
                assert_eq!(universe.get_live_neighbors_count(x, y), 0);
            }
        }
    }
}
