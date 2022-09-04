import { Grid, GridSettings, Cell, RedrawHandler } from "./grid";
import { Vector2 } from "./util";
import { Dict, WordArray } from "./dictionary";

enum Direction {
    Up = 0,
    Right = 1,
    Down = 2,
    Left = 3,
}

function inv_dir(dir : Direction) : Direction {
    switch (dir) {
        case Direction.Up:
            return Direction.Down;
        case Direction.Right:
            return Direction.Left;
        case Direction.Down:
            return Direction.Up;
        case Direction.Left:
        default:
            return Direction.Right
    }
}

export class BarCell extends Cell {
    bars : boolean[] = [ false, false, false, false ]; // 0 UP, 1 RIGHT, 2 DOWN, 3 LEFT
}

export class BarGrid extends Grid<BarCell> {

    constructor(settings: GridSettings, state: string|null, public scale: number, dict:Dict, redrawHandler: RedrawHandler) {
        super(settings, scale, dict, redrawHandler);
        for (var i = 0; i < this.cells.length; i++) {
            this.cells[i] = new BarCell(i % settings.size, Math.floor(i / settings.size));

            if (state) {
                const c = state.charAt(i * 2);
                if (c != " ") 
                    this.cells[i].letter = c;
                const f = parseInt(state.charAt(i * 2 + 1), 16);
                this.cells[i].bars[0] = (f & 1) == 1;
                this.cells[i].bars[1] = (f & 2) == 2;
                this.cells[i].bars[2] = (f & 4) == 4;
                this.cells[i].bars[3] = (f & 8) == 8;
            }
        }
    }

    onRightClick(coord:Vector2) {
        const gx = Math.floor(coord.x / this.scale);
        const gy = Math.floor(coord.y / this.scale);

        const dx = coord.x - gx * this.scale - 0.5 * this.scale;
        const dy = coord.y - gy * this.scale - 0.5 * this.scale;

        let direction = 0;
        if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx < 0 ? 3 : 1;
        } else {
            direction = dy < 0 ? 0 : 2;
        }

        const cell = this.cellAt(gx, gy);

        let neighbor = null;
        switch (direction) {
            case Direction.Up:
                neighbor = this.cellAt(gx, gy - 1);
                break;
            case Direction.Right:
                neighbor = this.cellAt(gx + 1, gy);
                break;
            case Direction.Down:
                neighbor = this.cellAt(gx, gy + 1);
                break;
            case Direction.Left:
                neighbor = this.cellAt(gx - 1, gy);
                break;
        }

        if (cell == null || neighbor == null)
            return;

        cell.bars[direction] = !cell.bars[direction];
        neighbor.bars[inv_dir(direction)] = !neighbor.bars[inv_dir(direction)];

        this.rescore();
        this.redrawHandler();
    }

    toggleCell() { 
        // TODO: implement
    }

    horizontalWordArray(c:BarCell) : WordArray {
        var lx = c.x;
        while (lx > 0) {
            const cur = this.cellAt(lx, c.y);
            if (cur.bars[3])
                break;
            lx--;
        }

        var rx = c.x;
        while (rx < this.settings.size - 1) {
            const cur = this.cellAt(rx, c.y);
            if (cur.bars[1])
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

    verticalWordArray(c:BarCell) : WordArray {
        var ty = c.y;
        while (ty > 0) {
            const cur = this.cellAt(c.x, ty);
            if (cur.bars[0])
                break;
            ty--;
        }
        var by = c.y;
        while (by < this.settings.size - 1) {
            const cur = this.cellAt(c.x, by);
            if (cur.bars[2])
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


    determineWordCount(c:BarCell) : number {
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

    updateScoreInfo() : void {
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
            hLabel.innerHTML = "Across " + this.selected.hword.letters.map(l => l == null ? "*" : l).join('') 
                + " [" + this.selected.hlen + "]: " + this.selected.hcount;
            vLabel.innerHTML = "Down " + this.selected.vword.letters.map(l => l == null ? "*" : l).join('') 
                + " [" + this.selected.vlen + "]: " + this.selected.vcount;
            info = this.selected.scoreLog;
            this.updateSuggestions(hOptions, this.selected.hoptions);
            this.updateSuggestions(vOptions, this.selected.voptions);
			scoreLog.value = info;
    	}
    }

    serialize() : string {
        // convert cells into format suitable for serialization
        var list = [];
        for (var i in this.cells) {
            var cell = this.cells[i];
            if (cell.letter) {
                list.push(cell.letter);
            } else {
                list.push(' ');
            }
            let flags = 0;
            if (cell.bars[0]) flags |= 1;
            if (cell.bars[1]) flags |= 2;
            if (cell.bars[2]) flags |= 4;
            if (cell.bars[3]) flags |= 8;
            list.push(flags.toString(16));
        }
        return list.join('');
    }
}
