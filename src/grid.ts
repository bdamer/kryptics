import { WordArray, Dict } from "./dictionary";
import { Vector2 } from "./util";

export type RedrawHandler = () => void;

export class Cell {

    letter: string|null;
    focus: boolean;
    hword: WordArray;
	hoptions: string[];
    hlen: number; // horizontal word length
    hcount: number; // number of horizontal words
    vword: WordArray;
	voptions: string[];
    vlen: number; // vertical word length
    vcount: number; // number of vertical words
    score: number;
    scoreLog: string;

    constructor(public x: number, public y: number) { 
        this.letter = null;
        this.hlen
        this.score = 0.0;
        this.scoreLog = "";
    }

    getWordCount(combineCount:boolean, ignoreSingleSpace:boolean) : number {
        if (combineCount) {
            return this.hcount + this.vcount;
        } else {
            if (ignoreSingleSpace) {
                if (this.hlen == 1) {
                    return this.vcount;
                } else if (this.vlen == 1) {
                    return this.hcount;
                }
            }
            return Math.min(this.hcount, this.vcount);
        }
    }
}

export class GridSettings {
    style: number;
    size: number;
	maxWordCap: number;
    symmetrical: boolean;
    combineCount:boolean;
    ignoreSingleSpace: boolean;
}

export abstract class Grid<CellType extends Cell> {

    dict: Dict;
    redrawHandler: RedrawHandler;
    selected: CellType|null;
    cells: CellType[];
    maxWords: number;

    constructor(public settings: GridSettings, public scale: number, dict:Dict, redrawHandler: RedrawHandler) {
        this.dict = dict;
        this.redrawHandler = redrawHandler;
        console.log("Creating new grid of size: ", settings.size);
        this.cells = new Array(settings.size * settings.size);
    }

    // Handler functions
    onLeftClick(coord:Vector2) { 
        const gx = Math.floor(coord.x / this.scale);
        const gy = Math.floor(coord.y / this.scale);
        this.select(gx, gy);
        this.redrawHandler();
    }

    // Called when cell is right-clicked
    abstract onRightClick(coord:Vector2) : void;
    // Toggles state of currently selected cell.
    abstract toggleCell() : void;
    // Updates score info for selected cell
    abstract updateScoreInfo() : void;
    // Computes word count for a given cell
    abstract determineWordCount(c:CellType) : number;
    // Serializes grid to string representation
    abstract serialize() : string;

    // Returns cell at grid coordinates.
    cellAt(x: number, y: number) : CellType|null {
        if (x < 0 || x >= this.settings.size || y < 0 || y >= this.settings.size)
            return null;
        return this.cells[y * this.settings.size + x];
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


	updateSuggestions(el:HTMLSelectElement, words:string[]) {
		while (el.options.length > 0) {
			el.remove(0);
		}

		for (var i = 0; i < words.length && i < 1000; i++) {
			const option = document.createElement("option") as HTMLOptionElement;
            option.value = words[i];
            option.text = words[i];
            el.options.add(option);
		}
	}

    moveToNext() {
        // TODO: handle vertical and horizontal movement
        let cx = this.selected.x + 1;
        let cy = this.selected.y;
        if (cx >= this.settings.size) {
            cx = 0;
            cy++;
            if (cy >= this.settings.size) {
                cy = 0;
            }
        }
        this.select(cx, cy);
    }

    rescore() {
        this.maxWords = 0;

        // Determine number of available words for each cell
        this.cells.forEach(c => {
            this.determineWordCount(c);
            this.maxWords = Math.max(c.getWordCount(this.settings.combineCount, this.settings.ignoreSingleSpace), this.maxWords);
        });

        console.log("Max words: ", this.maxWords);
        this.cells.forEach(c => this.scoreCell(c));

        this.updateScoreInfo();
    }

    rescoreIntersection(x: number, y: number) {

        for (var i = 0; i < this.settings.size; i++) {
            const hc = this.cellAt(i, y);
            this.determineWordCount(hc);
            if (i != y) {
                const vc = this.cellAt(x, i);
                this.determineWordCount(vc);
            }
        }

        this.maxWords = 0;
        this.cells.forEach(c => {
            this.maxWords = Math.max(c.getWordCount(this.settings.combineCount, this.settings.ignoreSingleSpace), this.maxWords);
        });

        console.log("Max words: ", this.maxWords);
        this.cells.forEach(c => this.scoreCell(c));

        this.updateScoreInfo();
    }

    // Computes score for a given cell
    scoreCell(c:CellType) {
        
        c.score = 0.0;
        c.scoreLog = "";

        if (this.settings.ignoreSingleSpace) {
            var total : number;
            if (c.hlen == 1) {
                total = c.vcount;
            } else if (c.vlen == 1) {
                total = c.hcount;
            } else {
                total = this.settings.combineCount ? (c.hcount + c.vcount) : Math.min(c.hcount, c.vcount);
            }
            const lMax = this.settings.maxWordCap ? Math.min(this.settings.maxWordCap, this.maxWords) : this.maxWords;
            const lTotal = this.settings.maxWordCap ? Math.min(this.settings.maxWordCap, total) : total;
            const frac = 1.0 - (lTotal / lMax);
            c.score += frac;
            c.scoreLog += ("+" + frac.toPrecision(3) + " based on number of possible words [" + lTotal + " / " + lMax + "]\n");
        } else {
            if (c.hcount == 0) {
                c.score += 1.0;
                c.scoreLog += "+1.0 no possible words on horizontal\n";
            } else if (c.vcount == 0) {
                c.score += 1.0;
                c.scoreLog += "+1.0 no possible words on vertical\n";
            } else {
                const total = this.settings.combineCount ? (c.hcount + c.vcount) : Math.min(c.hcount, c.vcount);
                const lMax = this.settings.maxWordCap ? Math.min(this.settings.maxWordCap, this.maxWords) : this.maxWords;
                const lTotal = this.settings.maxWordCap ? Math.min(this.settings.maxWordCap, total) : total;
                const frac = 1.0 - (lTotal / lMax);
                c.score += frac;
                c.scoreLog += ("+" + frac.toPrecision(3) + " based on number of possible words [" + lTotal + " / " + lMax + "]\n");
            }
        }


        c.score *= c.score;        
        c.score = Math.min(1.0, c.score);

        c.scoreLog += "Final score: " + c.score.toPrecision(3);
    }

	fillHorizontal(value:string) { 
		if (!this.selected) return;
		for (var i = 0; i < value.length; i++) {
			this.cellAt(this.selected.hword.from + i, this.selected.y).letter = value.charAt(i);
		}
	}
	
	fillVertical(value:string) {
		if (!this.selected) return;
		for (var i = 0; i < value.length; i++) {
			this.cellAt(this.selected.x, this.selected.vword.from + i).letter = value.charAt(i);
		}
	}
}

