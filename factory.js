'use strict';

const ROWS = 8;
const COLS = 3;

///
/// Math functions
///
function randomDigit() {
  return Math.floor(9 * Math.random()) + 1;
}

///
/// The game itself
///
class Cell {
  constructor() {
    this.elem = document.createElement('td');
  }

  set value(val) {
    this.elem.innerText = val
  }

  get value() {
    return parseInt(this.elem.innerText);
  }
}

const ROW_PROD_CLASS = "rowProd";
const COL_PROD_CLASS = "colProd";

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

    // Column products
    let tr = document.createElement('tr');
    tr.className = COL_PROD_CLASS;
    for (let j = 0; j < this.cols; j++) {
      let cell = new Cell();
      this.colProd.push(cell);
      tr.appendChild(cell.elem);
    }
    table.appendChild(tr);
  }

  generate() {
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
  }
}

window.addEventListener("load", () => {
  const TABLE = "game";
  const ROWS = 8;
  const COLS = 3;
  let factory = new Factory(TABLE, ROWS, COLS);
})
