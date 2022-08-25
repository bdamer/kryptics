

export class Cell {

    letter: string|null;
    block: boolean;
    focus: boolean;

    constructor(public x: number, public y: number) { 
        this.letter = null;
        this.block = false;
    }
}

export class Grid {

    cells: Cell[];
    selected: Cell|null;

    constructor(public size: number, public symmetrical: boolean) {
        this.cells = new Array(size * size);
        for (var i = 0; i < this.cells.length; i++) {
            this.cells[i] = new Cell(i % size, Math.floor(i / size));
        }
    }

    // Returns cell at grid coordinates.
    cellAt(x: number, y: number) : Cell|null {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size)
            throw new Error('Invalid grid coordinate.');
        return this.cells[y * this.size + x];
    }

    select(x: number, y: number) {
        const cell = this.cellAt(x, y);
        if (cell != null) {
            
            if (this.selected != null) {
                this.selected.focus = false;
            }
    
            cell.focus = true;
            this.selected = cell;
        }
    }

    toggleBlock(x: number, y: number) {
        const cell = this.cellAt(x, x);
        if (cell != null) {
            cell.block = !cell.block;
        }
        if (this.symmetrical) {
            const opposite = this.cellAt(this.size - 1 - x, this.size - 1 - y);
            if (opposite != null) {
                opposite.block = cell.block;
            }
        }
    }

}