import { minWordLength, maxWordLength, WordArray, Dict } from "./dictionary";

export class Cell {

    letter: string|null;
    block: boolean;
    focus: boolean;
    hword: WordArray;
    hlen: number; // horizontal word length
    hcount: number; // number of horizontal words
    vword: WordArray;
    vlen: number; // vertical word length
    vcount: number; // number of vertical words
    score: number;
    scoreLog: string;

    constructor(public x: number, public y: number) { 
        this.letter = null;
        this.block = false;
        this.hlen
        this.score = 0.0;
        this.scoreLog = "";
    }
}

export class Grid {

    cells: Cell[];
    selected: Cell|null;
    dict: Dict;
    maxWords: number;
    symmetrical: boolean;
    combineCount:boolean;

    constructor(public size: number, dict:Dict) {
        this.cells = new Array(size * size);
        this.dict = dict;
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
            this.updateScoreInfo();
        }
    }

    updateScoreInfo() {
        const el = <HTMLSpanElement>document.getElementById("score_log");
        if (el && this.selected) {
            el.innerHTML = this.selected.scoreLog;
        }
    }

    toggleBlock(x: number, y: number) {
        const cell = this.cellAt(x, y);
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

    horizontalWordArray(c:Cell) : WordArray {
        var lx = c.x;
        while (lx > 0) {
            const cur = this.cellAt(lx - 1, c.y);
            if (cur.block)
                break;
            lx--;
        }

        var rx = c.x;
        while (rx < this.size - 1) {
            const cur = this.cellAt(rx + 1, c.y);
            if (cur.block)
                break;
            rx++;
        }

        const letters = [];
        for (var i = lx; i <= rx; i++) {
            const ci = this.cellAt(i, c.y);
            letters.push(ci.letter);
        }
        return new WordArray(lx, rx, letters);
    }

    horizonalWordLength(c:Cell) : number { 
        var lx = c.x;
        while (lx > 0) {
            const cur = this.cellAt(lx - 1, c.y);
            if (cur.block)
                break;
            lx--;
        }

        var rx = c.x;
        while (rx < this.size - 1) {
            const cur = this.cellAt(rx + 1, c.y);
            if (cur.block)
                break;
            rx++;
        }
        return 1 + rx - lx;
    }

    verticalWordArray(c:Cell) : WordArray {
        var ty = c.y;
        while (ty > 0) {
            const cur = this.cellAt(c.x, ty - 1);
            if (cur.block)
                break;
            ty--;
        }
        var by = c.y;
        while (by < this.size - 1) {
            const cur = this.cellAt(c.x, by + 1);
            if (cur.block)
                break;
            by++;
        }

        const letters = [];
        for (var i = ty; i <= by; i++) {
            const ci = this.cellAt(c.x, i);
            letters.push(ci.letter);
        }
        return new WordArray(ty, by, letters);
    }

    verticalWordLength(c:Cell) : number { 
        var ty = c.y;
        while (ty > 0) {
            const cur = this.cellAt(c.x, ty - 1);
            if (cur.block)
                break;
            ty--;
        }
        var by = c.y;
        while (by < this.size - 1) {
            const cur = this.cellAt(c.x, by + 1);
            if (cur.block)
                break;
            by++;
        }
        return 1 + by - ty;
    }

    determineWordCount(c:Cell) : number {
        if (c.block) {
            return 0;
        }

        c.hword = this.horizontalWordArray(c);
        c.hlen = 1 + c.hword.to - c.hword.from ;
        c.vword = this.verticalWordArray(c);
        c.vlen = 1 + c.vword.to - c.vword.from ;

        // determine number of words that for each dimension
        c.hcount = this.dict.matchCount(c.hword);
        c.vcount = this.dict.matchCount(c.vword);

        return c.hcount + c.vcount;
    }

    scoreCell(c:Cell) {
        if (c.block) {
            c.score = -1.0;
            return;
        }

        c.score = 0.0;
        c.scoreLog = "Cell: [" + c.x + " / " + c.y + "]<br/>" +
            "Horizontal words " + c.hword.letters.map(l => l == null ? "*" : l).join('') + " [" + c.hlen + "]: " + c.hcount + "<br />" +
            "Vertical words " + c.vword.letters.map(l => l == null ? "*" : l).join('') + " [" + c.vlen + "]: " + c.vcount + "<br />";

        if (c.hcount == 0) {
            c.score += 1.0;
            c.scoreLog += "+1.0 no possible words on horizontal<br />";
        }

        if (c.vcount == 0) {
            c.score += 1.0;
            c.scoreLog += "+1.0 no possible words on vertical<br />";
        }

    
        const total = this.combineCount ? (c.hcount + c.vcount) : Math.min(c.hcount, c.vcount);
        const frac = 1.0 - (total / this.maxWords);
        c.score += frac;
        c.scoreLog += ("+" + frac.toPrecision(3) + " based on number of available words [" + total + " / " + this.maxWords + "]<br />");

        c.score *= c.score;        
        c.score = Math.min(1.0, c.score);

        c.scoreLog += "Final score: " + c.score.toPrecision(3);
    }

    rescore() {
        this.maxWords = 0;

        // Determine number of available words for each cell
        this.cells.forEach(c => {
            this.determineWordCount(c);

            if (!c.block) {
                if (this.combineCount) {
                    this.maxWords = Math.max(c.hcount + c.vcount, this.maxWords);
                } else {
                    this.maxWords = Math.max(Math.min(c.hcount, c.vcount), this.maxWords);
                }
            }
        });

        console.log("Max words: ", this.maxWords);
        this.cells.forEach(c => this.scoreCell(c));

        this.updateScoreInfo();
    }

    rescoreIntersection(x: number, y: number) {

        for (var i = 0; i < this.size; i++) {
            const hc = this.cellAt(i, y);
            this.determineWordCount(hc);
            if (i != y) {
                const vc = this.cellAt(x, i);
                this.determineWordCount(vc);
            }
        }

        this.maxWords = 0;
        this.cells.forEach(c => {
            if (!c.block) {
                if (this.combineCount) {
                    this.maxWords = Math.max(c.hcount + c.vcount, this.maxWords);
                } else {
                    this.maxWords = Math.max(Math.min(c.hcount, c.vcount), this.maxWords);
                }
            }
        });

        console.log("Max words: ", this.maxWords);
        this.cells.forEach(c => this.scoreCell(c));

        this.updateScoreInfo();
    }
}
