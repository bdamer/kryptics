import { Cell, Grid, RedrawHandler } from "./grid";
import { Vector2 } from "./util";
import { Dict, WordArray } from "./dictionary";

export class BlockCell extends Cell {
    block: boolean;

    constructor(x: number, y: number) { 
        super(x, y);
        this.block = false;
    }
}

export class BlockGrid extends Grid<BlockCell> {

    constructor(size: number, public scale: number, dict:Dict, redrawHandler: RedrawHandler) {
        super(size, scale, dict, redrawHandler);
        for (var i = 0; i < this.cells.length; i++) {
            this.cells[i] = new BlockCell(i % size, Math.floor(i / size));
        }
    }

    onRightClick(coord:Vector2) {
        const gx = Math.floor(coord.x / this.scale);
        const gy = Math.floor(coord.y / this.scale);
        this.toggleBlock(gx, gy);
        this.rescore();
        this.redrawHandler();
    }

    toggleCell() {
        this.toggleBlock(this.selected.x, this.selected.y);
        this.rescore();
        this.redrawHandler();
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

    horizontalWordArray(c:BlockCell) : WordArray {
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

    horizonalWordLength(c:BlockCell) : number { 
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

    verticalWordArray(c:BlockCell) : WordArray {
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

    verticalWordLength(c:BlockCell) : number { 
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

    determineWordCount(c:BlockCell) : number {
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

    scoreCell(c:BlockCell) {
        if (c.block) {
            c.score = -1.0;
        } else {
            super.scoreCell(c);
        }
    }
}
