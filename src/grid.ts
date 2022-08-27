import { minWordLength, maxWordLength, WordArray, Dict } from "./dictionary";

export class Cell {

    letter: string|null;
    block: boolean;
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
        this.block = false;
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

export class Grid {

    cells: Cell[];
    selected: Cell|null;
    dict: Dict;
    maxWords: number;
	maxWordCap: number;
    symmetrical: boolean;
    combineCount:boolean;
    ignoreSingleSpace: boolean;

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

    updateScoreInfo() {
		const hOptions = <HTMLSelectElement>document.getElementById("h_suggestions");
		const vOptions = <HTMLSelectElement>document.getElementById("v_suggestions");
		const cellPos = <HTMLInputElement>document.getElementById("cell_pos");
		const scoreLog = <HTMLTextAreaElement>document.getElementById("score_log");
		const hLabel = <HTMLLabelElement>document.getElementById("label_h_suggestions");
		const vLabel = <HTMLLabelElement>document.getElementById("label_v_suggestions");

		hLabel.innerHTML = "Across";
		vLabel.innerHTML = "Down";
		cellPos.value = "";
		scoreLog.value = "";
		this.updateSuggestions(hOptions, []);
		this.updateSuggestions(vOptions, []);				


        if (this.selected) {
			cellPos.value = this.selected.x + "," + this.selected.y;
            let info;
            if (this.selected.block) {
                info = "Block";
				this.updateSuggestions(hOptions, []);
				this.updateSuggestions(vOptions, []);				
            } else {
				hLabel.innerHTML = "Across " + this.selected.hword.letters.map(l => l == null ? "*" : l).join('') 
					+ " [" + this.selected.hlen + "]: " + this.selected.hcount;
				vLabel.innerHTML = "Down " + this.selected.vword.letters.map(l => l == null ? "*" : l).join('') 
					+ " [" + this.selected.vlen + "]: " + this.selected.vcount;
                info = this.selected.scoreLog;
				this.updateSuggestions(hOptions, this.selected.hoptions);
				this.updateSuggestions(vOptions, this.selected.voptions);
            }
			scoreLog.value = info;
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
		c.hoptions = this.dict.matchAll(c.hword);
        c.hcount = c.hoptions.length;
        c.voptions = this.dict.matchAll(c.vword);
        c.vcount = c.voptions.length;

        return c.hcount + c.vcount;
    }

    scoreCell(c:Cell) {
        if (c.block) {
            c.score = -1.0;
            return;
        }

        c.score = 0.0;
        c.scoreLog = "";

        if (this.ignoreSingleSpace) {
            var total : number;
            if (c.hlen == 1) {
                total = c.vcount;
            } else if (c.vlen == 1) {
                total = c.hcount;
            } else {
                total = this.combineCount ? (c.hcount + c.vcount) : Math.min(c.hcount, c.vcount);
            }
            const lMax = this.maxWordCap ? Math.min(this.maxWordCap, this.maxWords) : this.maxWords;
            const lTotal = this.maxWordCap ? Math.min(this.maxWordCap, total) : total;
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
                const total = this.combineCount ? (c.hcount + c.vcount) : Math.min(c.hcount, c.vcount);
                const lMax = this.maxWordCap ? Math.min(this.maxWordCap, this.maxWords) : this.maxWords;
                const lTotal = this.maxWordCap ? Math.min(this.maxWordCap, total) : total;
                const frac = 1.0 - (lTotal / lMax);
                c.score += frac;
                c.scoreLog += ("+" + frac.toPrecision(3) + " based on number of possible words [" + lTotal + " / " + lMax + "]\n");
            }
        }


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
                this.maxWords = Math.max(c.getWordCount(this.combineCount, this.ignoreSingleSpace), this.maxWords);
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
                this.maxWords = Math.max(c.getWordCount(this.combineCount, this.ignoreSingleSpace), this.maxWords);
            }
        });

        console.log("Max words: ", this.maxWords);
        this.cells.forEach(c => this.scoreCell(c));

        this.updateScoreInfo();
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
