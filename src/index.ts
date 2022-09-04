import { Dict } from "./dictionary";
import { BarGrid } from "./bargrid";
import { BlockGrid } from "./blockgrid";
import { BarGridRenderer, BlockGridRenderer, Renderer } from "./renderer"; 
import { clickPos } from "./util";

const canvas = <HTMLCanvasElement>document.getElementById('grid');
let renderer : any = null;
let grid : any = null;
let gen : Generator = null;
let dict : Dict = new Dict();

function createGrid() {

    const size = parseInt((<HTMLInputElement>document.getElementById("grid_size")).value);
    if (Number.isNaN(size) || size < 3 || size > 20) {
        alert("Invalid size - please provide a value between 3 and 20.");
        return;
    }

    const style = (<HTMLSelectElement>document.getElementById("grid_style")).selectedIndex;

    if (style == 0) {
        renderer = new BlockGridRenderer(canvas);
        grid = new BlockGrid(size, renderer.scale, dict, () => renderer.render(grid));
    } else {
        renderer = new BarGridRenderer(canvas);
        grid = new BarGrid(size, renderer.scale, dict, () => renderer.render(grid));
    }
    grid.symmetrical = (<HTMLInputElement>document.getElementById("grid_symmetry")).checked;
    grid.combineCount = (<HTMLInputElement>document.getElementById("combine_axis_count")).checked;
    grid.ignoreSingleSpace = (<HTMLInputElement>document.getElementById("ignore_single_space")).checked;
    grid.maxWordCap = parseInt((<HTMLInputElement>document.getElementById("max_word_cap")).value);
    grid.rescore();

    // Rendering

    // resize canvas if needed
    if (canvas.width != renderer.scale * size) {
        canvas.width = renderer.scale * size;
    }
    if (canvas.height != renderer.scale * size) {
        canvas.height = renderer.scale * size;
    }
    renderer.render(grid);
}

// Event handlers
(<HTMLInputElement>document.getElementById("reset")).addEventListener('click', (e:MouseEvent) => createGrid());
(<HTMLInputElement>document.getElementById("rescore")).addEventListener('click', (e:MouseEvent) => grid.rescore());
(<HTMLInputElement>document.getElementById("grid_symmetry")).addEventListener('change', (e:Event) => {
    grid.symmetrical = (<HTMLInputElement>document.getElementById("grid_symmetry")).checked;
});
(<HTMLInputElement>document.getElementById("combine_axis_count")).addEventListener('change', (e:Event) => {
    grid.combineCount = (<HTMLInputElement>document.getElementById("combine_axis_count")).checked;
    grid.rescore();
    renderer.render(grid);
});
(<HTMLInputElement>document.getElementById("ignore_single_space")).addEventListener('change', (e:Event) => {
    grid.ignoreSingleSpace = (<HTMLInputElement>document.getElementById("ignore_single_space")).checked;
    grid.rescore();
    renderer.render(grid);
});
(<HTMLInputElement>document.getElementById("max_word_cap")).addEventListener('change', (e:Event) => {
    grid.maxWordCap = parseInt((<HTMLInputElement>document.getElementById("max_word_cap")).value);
    grid.rescore();
    renderer.render(grid);
});
(<HTMLInputElement>document.getElementById("grid")).addEventListener('click', (e:MouseEvent) => {
    e.preventDefault();
    grid.onLeftClick(clickPos(e, canvas));
});

(<HTMLInputElement>document.getElementById("grid")).addEventListener('contextmenu', (e:MouseEvent) => {
    e.preventDefault();
    grid.onRightClick(clickPos(e, canvas));
});
(<HTMLInputElement>document.getElementById("grid")).addEventListener('dblclick', (e:MouseEvent) => {
    e.preventDefault();
    // not used
});
(document).addEventListener('keydown', (e:KeyboardEvent) => {

    // console.log(e);

    // only if canvas has focus and we've selected an element
    if (document.body != document.activeElement || grid.selected == null) {
        return;
    }

    if (e.keyCode >= 65 && e.keyCode <= 90) { // character key
        grid.selected.letter = e.key.toUpperCase();
        grid.rescoreIntersection(grid.selected.x, grid.selected.y);
        if ((<HTMLInputElement>document.getElementById("auto_move")).checked) {
            grid.moveToNext();
        }
    } else {

        switch (e.keyCode) {
            case 8:
            case 46:
                grid.selected.letter = null; // BACKSPACE / DEL
                grid.rescoreIntersection(grid.selected.x, grid.selected.y);
                break;

            case 32:
                grid.toggleCell();
                break;

            case 37: // left arrow
                if (grid.selected.x > 0)
                    grid.select(grid.selected.x - 1, grid.selected.y);
                break;
            case 38: // up arrow
                if (grid.selected.y > 0)
                    grid.select(grid.selected.x, grid.selected.y - 1);
                break;
            case 39: // right arrow
                if (grid.selected.x < grid.size - 1)
                    grid.select(grid.selected.x + 1, grid.selected.y);
                break;
            case 40: // down arrow
                if (grid.selected.x < grid.size - 1)
                    grid.select(grid.selected.x, grid.selected.y + 1);
                break;
            default:
                return; // invalid key
        }

	    e.preventDefault();
    }

    renderer.render(grid);

});

(<HTMLInputElement>document.getElementById("h_suggestions")).addEventListener('dblclick', (e:MouseEvent) => {
	if (grid.selected == null) {
		return;
	}
	const hOptions = <HTMLSelectElement>document.getElementById("h_suggestions");
	const selected = hOptions.options[hOptions.selectedIndex];
	if (selected) {
		grid.fillHorizontal(selected.value);
		grid.rescore();
		renderer.render(grid);
	}
});

(<HTMLInputElement>document.getElementById("v_suggestions")).addEventListener('dblclick', (e:MouseEvent) => {
	if (grid.selected == null) {
		return;
	}
	const vOptions = <HTMLSelectElement>document.getElementById("v_suggestions");
	const selected = vOptions.options[vOptions.selectedIndex];
	if (selected) {
		grid.fillVertical(selected.value);
		grid.rescore();
		
		renderer.render(grid);
	}
});

// Startup
createGrid();
