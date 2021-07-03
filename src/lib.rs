extern crate js_sys;
extern crate wasm_bindgen;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: bool);
}

#[wasm_bindgen]
/// Represents the universe of the game, which contains the cells and handles the `tick`.
pub struct Universe {
    size: u32,
    cells: Vec<u8>,
    changed_cells: Vec<u32>,
}

impl Universe {
    /// Returns the index of a cell given the `x` and `y` coordinates, based on the `Universe`
    /// size.
    ///
    /// # Arguments
    /// * `x` - u32 representing the X position of a cell.
    /// * `y` - u32 representing the y position of a cell.
    ///
    /// # Examples
    /// ```
    /// let universe = Universe::new(4);
    /// let idx = universe.get_index(1, 1); // 5
    /// ```
    fn get_index(&self, x: u32, y: u32) -> usize {
        (x + (y * self.size)) as usize
    }

    /// Returns the live neighbors count of a cell given its coordinates.
    ///
    /// # Arguments
    /// * `x` - u32 representing the X position of a cell
    /// * `y` - u32 representing the y position of a cell
    ///
    /// # Examples
    /// ```
    /// let universe = Universe::new(4);
    /// let live_neighbors = universe.get_live_neighbors_count(1, 1);
    /// ```
    fn get_live_neighbors_count(&self, x: u32, y: u32) -> u8 {
        let mut count = 0;

        let north = if y == 0 { self.size - 1 } else { y - 1 };

        let east = if x == self.size - 1 { 0 } else { x + 1 };

        let south = if y == self.size - 1 { 0 } else { y + 1 };

        let west = if x == 0 { self.size - 1 } else { x - 1 };

        let nw = self.get_index(west, north);
        count += self.cells[nw];

        let n = self.get_index(x, north);
        count += self.cells[n];

        let ne = self.get_index(east, north);
        count += self.cells[ne];

        let w = self.get_index(west, y);
        count += self.cells[w];

        let e = self.get_index(east, y);
        count += self.cells[e];

        let sw = self.get_index(west, south);
        count += self.cells[sw];

        let s = self.get_index(x, south);
        count += self.cells[s];

        let se = self.get_index(east, south);
        count += self.cells[se];

        count
    }
}

#[wasm_bindgen]
impl Universe {
    /// Returns a new `Universe` of a given size.
    ///
    /// # Arguments
    /// * `size` - u32 that represents both the width and height of the
    /// `Universe`(`size`==width==height).
    pub fn new(size: u32) -> Universe {
        let cells: Vec<u8> = (0..size * size)
            .map(|x| (x % 3 == 0 || x % 7 == 0) as u8)
            .collect();

        let mut changed_cells: Vec<u32> = Vec::new();

        for row in 0..size {
            for col in 0..size {
                changed_cells.push(row);
                changed_cells.push(col);
            }
        }

        Universe {
            size,
            cells,
            changed_cells,
        }
    }

    /// Toggle a cell given its coordinates.
    ///
    /// # Arguments
    /// * `row` - row or Y position of a cell.
    /// * `col` - col or X position of a cell.
    ///
    /// # Examples
    /// ```
    /// let universe = Universe::new(3);
    /// unierse.toggle_cell(1, 1);
    /// ```
    pub fn toggle_cell(&mut self, row: u32, col: u32) {
        let idx = self.get_index(col, row);
        self.cells[idx] = if self.cells[idx] == 1 { 0 } else { 1 };

        if self.cells[idx] == 1 {
            self.changed_cells = Vec::new();

            self.changed_cells.push(row);
            self.changed_cells.push(col);
        }
    }

    /// Advances the `Universe` to the next generation.
    pub fn tick(&mut self) {
        let mut next = self.cells.clone();
        self.changed_cells = Vec::new();

        for x in 0..self.size {
            for y in 0..self.size {
                let idx = self.get_index(x, y);

                let cell = self.cells[idx];
                let count = self.get_live_neighbors_count(x, y);

                let next_cell = match (cell, count) {
                    (1, 2) | (1, 3) => 1,
                    (0, 3) => 1,
                    _ => 0,
                };

                if next_cell == 1 {
                    self.changed_cells.push(y);
                    self.changed_cells.push(x);
                }

                next[idx] = next_cell;
            }
        }

        self.cells = next;
    }

    /// Returns a `Vec<u32>` of the cells that changed from the last generation to the current.
    pub fn cells(&self) -> Vec<u32> {
        self.changed_cells.clone()
    }

    /// Returns the size of the `Universe`.
    pub fn size(&self) -> u32 {
        self.size
    }
}

#[cfg(test)]
mod tests {
    use crate::Universe;

    #[test]
    pub fn test_zero_live_neigbors_count() {
        let mut universe = Universe::new(3);
        
        universe.toggle_cell(1, 1); // Middle cell to true

        // Only the center cell is alive, so the live neighbors count
        // should be zero
        assert_eq!(universe.get_live_neighbors_count(1, 1), 0);
    }

    #[test]
    pub fn test_eight_live_neigbors_count() {
        let mut universe = Universe::new(3);

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
