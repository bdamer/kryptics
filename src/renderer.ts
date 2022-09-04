import { BarCell, BarGrid } from './bargrid';
import { BlockCell, BlockGrid } from './blockgrid';
import { rgbToHex } from './util';

export abstract class Renderer<GridType> {

    readonly scale = 32;

    ctx : CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext("2d");
    }

	abstract render(grid:GridType) : void;
}

export class BlockGridRenderer extends Renderer<BlockGrid> {
	
	render(grid : BlockGrid) {

		grid.cells.forEach(c => this.renderCell(c));
    
		// render clue indices
		let clueIdx = 0;
		for (let i = 0; i < grid.cells.length; i++) {
			let cell = grid.cells[i];

			if (cell.block) continue;

			const cx = cell.x * this.scale;
			const cy = cell.y * this.scale;
	
			// Fill in clue index
			const horClue = cell.x == 0 || grid.cells[i - 1].block;
			const verClue = cell.y == 0 || grid.cells[i - grid.settings.size].block;
			if (horClue || verClue) {
				
				// skip clue index if this is a 1-space
				if (grid.settings.ignoreSingleSpace) {
					if (horClue && cell.hlen < 2)
						continue;
					if (verClue && cell.vlen < 2)
						continue;
				}

				clueIdx++;
				this.ctx.font = '8px Arial';
				this.ctx.fillStyle = "#222222";
				this.ctx.fillText("" + clueIdx, cx+2, cy + 10);
			}
		}	
	}

	renderCell(cell: BlockCell) {
		const cx = cell.x * this.scale;
		const cy = cell.y * this.scale;

		// Fill rect with solid color
		if (cell.block) {
			this.ctx.fillStyle = "#000000";
		} else {
			this.ctx.fillStyle = rgbToHex(255, (1.0 - cell.score) * 255, (1.0 - cell.score) * 255);
    	}	
	    this.ctx.fillRect(cx, cy, this.scale, this.scale);

		// Draw outline 
		this.ctx.strokeStyle = "#999999";
		this.ctx.lineWidth = 1;
		this.ctx.strokeRect(cx, cy, this.scale, this.scale);
		
		// Fill in text
		if (!cell.block && cell.letter !== null) {
			this.ctx.font = '24px Arial';
			this.ctx.fillStyle = "#000000";
			this.ctx.strokeStyle = "#000000";
			this.ctx.fillText(cell.letter, cx+6, cy + 24);
		}

		// Draw highlight rect
		if (cell.focus) {
			this.ctx.strokeStyle = "#0000ff";
			this.ctx.lineWidth = 1;
			this.ctx.strokeRect(cx + 1, cy + 1, this.scale - 2, this.scale - 2);
		}
	}
}

export class BarGridRenderer extends Renderer<BarGrid> {

	render(grid : BarGrid) {

		grid.cells.forEach(c => this.renderCell(c));
    
		// render clue indices
		let clueIdx = 0;
		for (let i = 0; i < grid.cells.length; i++) {
			let cell = grid.cells[i];

			const cx = cell.x * this.scale;
			const cy = cell.y * this.scale;
	
			// Fill in clue index
			const horClue = cell.x == 0 || grid.cells[i].bars[3];
			const verClue = cell.y == 0 || grid.cells[i].bars[0];
			if (horClue || verClue) {
				
				// skip clue index if this is a 1-space
				if (grid.settings.ignoreSingleSpace) {
					if (horClue && cell.hlen < 2)
						continue;
					if (verClue && cell.vlen < 2)
						continue;
				}

				clueIdx++;
				this.ctx.font = '8px Arial';
				this.ctx.fillStyle = "#222222";
				this.ctx.fillText("" + clueIdx, cx+2, cy + 10);
			}
		}
	}

	renderCell(cell: BarCell) {
		const cx = cell.x * this.scale;
		const cy = cell.y * this.scale;

		// Fill rect with solid color
		this.ctx.fillStyle = rgbToHex(255, (1.0 - cell.score) * 255, (1.0 - cell.score) * 255);
	    this.ctx.fillRect(cx, cy, this.scale, this.scale);

		// Draw outline 	
		const regular_width = 1;
		const regular_style = "#999999";
		const thick_width = 3;
		const thick_style = "#000000";

		// TOP
		this.ctx.beginPath();
		this.ctx.lineWidth = cell.bars[0] ? thick_width : regular_width;
		this.ctx.strokeStyle = cell.bars[0] ? thick_style : regular_style;
		this.ctx.moveTo(cx, cy);
		this.ctx.lineTo(cx + this.scale, cy);
		this.ctx.stroke(); 
		// RIGHT
		this.ctx.beginPath();
		this.ctx.lineWidth = cell.bars[1] ? thick_width : regular_width;
		this.ctx.strokeStyle = cell.bars[1] ? thick_style : regular_style;
		this.ctx.moveTo(cx + this.scale, cy);
		this.ctx.lineTo(cx + this.scale, cy + this.scale);
		this.ctx.stroke(); 
		// BOTTOM
		this.ctx.beginPath();
		this.ctx.lineWidth = cell.bars[2] ? thick_width : regular_width;
		this.ctx.strokeStyle = cell.bars[2] ? thick_style : regular_style;
		this.ctx.moveTo(cx + this.scale, cy + this.scale);
		this.ctx.lineTo(cx, cy + this.scale);
		this.ctx.stroke(); 
		// LEFT
		this.ctx.beginPath();
		this.ctx.lineWidth = cell.bars[3] ? thick_width : regular_width;
		this.ctx.strokeStyle = cell.bars[3] ? thick_style : regular_style;
		this.ctx.moveTo(cx, cy + this.scale);
		this.ctx.lineTo(cx, cy);
		this.ctx.stroke(); 

		// Fill in text
		if (cell.letter !== null) {
			this.ctx.font = '24px Arial';
			this.ctx.fillStyle = "#000000";
			this.ctx.strokeStyle = "#000000";
			this.ctx.fillText(cell.letter, cx+6, cy + 24);
		}

		// Draw highlight rect
		if (cell.focus) {
			this.ctx.strokeStyle = "#0000ff";
			this.ctx.lineWidth = 1;
			this.ctx.strokeRect(cx + 2, cy + 2, this.scale - 3, this.scale - 3);
		}
	}
}