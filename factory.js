'use strict';

///
/// Math functions
///
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function randomDigit() {
  return DIGITS[Math.floor(DIGITS.length * Math.random())];
}

function possibleDigits(rowP, colP) {
  return DIGITS.filter(x => (rowP % x == 0 && colP % x == 0));
}

function refineCandidates(candidateLists, target) {
  let tuples = [[]];
  for (let list of candidateLists) {
    let nextTuples = [];
    for (let t of tuples) {
      for (let c of list) {
        let u = t.map(x => x);
        u.push(c);
        nextTuples.push(u);
      }
    }
    tuples = nextTuples;
  }

  let sets = candidateLists.map(() => { return {}; });
  tuples.filter(t => t.reduce((a,b) => a*b) == target)
        .forEach(t => t.map((x, i) => { sets[i][x] = true; }));

  return sets.map(s => Object.keys(s));
}

///
/// States of the game
///

/*

At each step, the state of the puzzle comprises:

* A set of row products
* A set of column products
* For each cell, either
  * A fixed value or
  * A set of candidates

The puzzle is solved if all values are fixed and all row/column products are 1
The puzzle is inconsistent if a non-fixed cell has empty candidates

To move from the state:
* Choose a non-fixed cell
* Fix its value 
* Divide that value out of its row and column products
* Recompute the candidates for non-fixed cells

The moves from a state are the combination of cell/value pairs

*/
class State {
  constructor(rowProd, colProd) { 
    this.rowProd = rowProd.map(x => x);
    this.colProd = colProd.map(x => x);
    this.fixed = rowProd.map(() => colProd.map(() => null));
    this.candidates = rowProd.map(() => colProd.map(() => []));
    this.refineToDivisors();
  }

  clone() {
    let next = new State(this.rowProd, this.colProd);
    for (let i in this.rowProd) {
      for (let j in this.colProd) {
        next.fixed[i][j] = this.fixed[i][j];
        next.candidates[i][j] = this.candidates[i][j].map(x => x);
      }
    }
    return next;
  }

  solved() { 
    return this.fixed.every(r => r.every(x => x != null));
  }

  markFixed() {
    for (let i in this.rowProd) {
      for (let j in this.colProd) {
        if (this.candidates[i][j].length > 1) {
          continue;
        }

        this.fixed[i][j] = this.candidates[i][j][0];
      }
    }
  }

  refineToDivisors() {
    for (let i in this.rowProd) {
      for (let j in this.colProd) {
        if (this.fixed[i][j]) {
          this.candidates[i][j] = [ this.fixed[i][j] ];
          continue;
        }

        this.candidates[i][j] = possibleDigits(this.rowProd[i], this.colProd[j]);
      }
    }

    this.markFixed();
  }

  refineRows() {
    for (let i in this.rowProd) {
      let candidateLists = this.candidates[i];
      refineCandidates(candidateLists, this.rowProd[i])
        .forEach((candidates, j) => { this.candidates[i][j] = candidates});
    }

    this.markFixed();
  }

  refineCols() {
    for (let j in this.colProd) {
      let candidateLists = this.candidates.map(r => r[j]);
      refineCandidates(candidateLists, this.colProd[j])
        .forEach((candidates, i) => { this.candidates[i][j] = candidates});
    }

    this.markFixed();
  }
}

///
/// The game itself
///
const FACTORS_CLASS = "factors";
const ROW_PROD_CLASS = "rowProd";
const COL_PROD_CLASS = "colProd";

class Cell {
  constructor() {
    this.elem = document.createElement('td');
    this.valueElem = document.createElement('span');
    this.factorsElem = document.createElement('span');
    this.factorsElem.className = FACTORS_CLASS;

    this.elem.appendChild(this.valueElem);
    this.elem.appendChild(document.createElement('br'));
    this.elem.appendChild(this.factorsElem);
  }

  reset() {
    this.valueElem.innerText = "";
    this.factorsElem.innerText = "";
  }

  set value(val) {
    this.valueElem.innerText = val;
  }

  get value() {
    return parseInt(this.valueElem.innerText);
  }

  set sub(vals) {
    this.factorsElem.innerText = vals.map(x => "" + x).join(" ");
  }
}

class Factory {
  constructor(id, rows, cols) {
    this.id = id;
    this.rows = rows;
    this.cols = cols;
    this.cells = [];
    this.rowProd = [];
    this.colProd = [];
    this.install();
    this.generate();
  }

  install() {
    let table = document.getElementById(this.id);
    for (let i = 0; i < this.rows; i++) {
      let row = [];

      // Row cells
      let tr = document.createElement('tr');
      for (let j = 0; j < this.cols; j++) {
        let cell = new Cell();
        row.push(cell);
        tr.appendChild(cell.elem);
      }

      // Row product
      let cell = new Cell();
      cell.elem.className = ROW_PROD_CLASS;
      this.rowProd.push(cell);
      tr.appendChild(cell.elem);

      this.cells.push(row);
      table.appendChild(tr);
    }

    // Column products, including a plug <td> to make the borders right
    let tr = document.createElement('tr');
    tr.className = COL_PROD_CLASS;
    for (let j = 0; j < this.cols; j++) {
      let cell = new Cell();
      this.colProd.push(cell);
      tr.appendChild(cell.elem);
    }
    let plug = document.createElement('td');
    plug.className = ROW_PROD_CLASS;
    tr.appendChild(plug);
    table.appendChild(tr);
  }

  reset() {
    this.cells.map(r => r.map(c => c.reset()));
    this.rowProd.map(c => c.reset());
    this.colProd.map(c => c.reset());
  }

  riddler() {
    this.reset();

    const ROW_PROD = [294, 216, 135, 98, 112, 84, 245, 40];
    const COL_PROD = [8890560, 156800, 55566];

    this.rowProd.map((x, i) => { x.value = ROW_PROD[i] });
    this.colProd.map((x, i) => { x.value = COL_PROD[i] });
    this.setState();
    this.render();
  }

  generate() {
    this.reset();

    for (let i in this.rowProd) {
      this.rowProd[i].value = 1;
    }

    for (let j in this.colProd) {
      this.colProd[j].value = 1;
    }

    for (let i in this.cells) {
      for (let j in this.cells[i]) {
        let digit = randomDigit();
        this.rowProd[i].value *= digit;
        this.colProd[j].value *= digit;
      }
    }

    this.setState();
    this.render();
  }

  setState() {
    let rowProd = this.rowProd.map(c => c.value);
    let colProd = this.colProd.map(c => c.value);
    this.state = new State(rowProd, colProd);
  }

  render() {
    this.state.rowProd.forEach((x, i) => { this.rowProd[i].sub = [x] });
    this.state.colProd.forEach((x, i) => { this.colProd[i].sub = [x] });
    for (let i in this.state.rowProd) {
      for (let j in this.state.colProd) {
        if (this.state.fixed[i][j] != null) {
          this.cells[i][j].value = this.state.fixed[i][j];
          this.cells[i][j].sub = [];
        } else {
          this.cells[i][j].value = "";
          this.cells[i][j].sub = this.state.candidates[i][j];
        }
      }
    }
  }

  refineRows() {
    this.state.refineRows();
    this.render();
  }

  refineCols() {
    this.state.refineCols();
    this.render();
  }
}

///
/// Page setup
///

window.addEventListener("load", () => {
  const TABLE = "game";
  const ROWS = 8;
  const COLS = 3;
  window.factory = new Factory(TABLE, ROWS, COLS);
  window.factory.riddler();

  let riddler = document.getElementById("riddler");
  riddler.addEventListener("click", (e) => {
    e.preventDefault();
    factory.riddler();
  });

  let generate = document.getElementById("generate");
  generate.addEventListener("click", (e) => {
    e.preventDefault();
    factory.generate();
  });

  let refineRows = document.getElementById("refineRows");
  refineRows.addEventListener("click", (e) => {
    e.preventDefault();
    factory.refineRows();
  });

  let refineCols = document.getElementById("refineCols");
  refineCols.addEventListener("click", (e) => {
    e.preventDefault();
    factory.refineCols();
  });
})
