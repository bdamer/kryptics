import { Grid, Cell } from './grid';
import { Direction, rgbToHex } from './util';

export class Renderer {

    readonly scale = 32;

    ctx : CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext("2d");
    }

    render(grid: Grid) {

		grid.cells.forEach(c => this.renderCell(c));
    
		// render clue indices
		let clueIdx = 0;
		for (let i = 0; i < grid.cells.length; i++) {
			let cell = grid.cells[i];

			if (cell.block) continue;

			const cx = cell.x * this.scale;
			const cy = cell.y * this.scale;
	
			// Fill in clue index
			if ( cell.y == 0 || cell.x == 0 || grid.cells[i - grid.size].block || grid.cells[i - 1].block) {
				clueIdx++;
				this.ctx.font = '8px Arial';
				this.ctx.fillStyle = "#222222";
				this.ctx.fillText("" + clueIdx, cx+2, cy + 10);
			}
		}	
	}
	
	renderCell(cell: Cell) {
		const cx = cell.x * this.scale;
		const cy = cell.y * this.scale;

		// Fill
		if (cell.block) {
			this.ctx.fillStyle = "#000000";
		} else {
			this.ctx.fillStyle = "#ffffff";
    	}	
	    this.ctx.fillRect(cx, cy, this.scale, this.scale);

		// Outline
		this.ctx.strokeStyle = "#999999";
		this.ctx.lineWidth = 1;
		this.ctx.strokeRect(cx, cy, this.scale, this.scale);
		
		if (!cell.block) {
			// Fill in text
			if (cell.letter != null) {
				this.ctx.font = '24px Arial';
				this.ctx.fillStyle = "#000000";
				this.ctx.strokeStyle = "#000000";
				this.ctx.fillText(cell.letter, cx+6, cy + 24);
			}
		}


		if (cell.focus) {
			this.ctx.strokeStyle = "#ff0000";
			this.ctx.lineWidth = 1;
			this.ctx.strokeRect(cx + 1, cy + 1, this.scale - 2, this.scale - 2);
		}
	}
}