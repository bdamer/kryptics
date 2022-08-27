import { Dict } from "./dictionary";
import { Grid, Cell } from "./grid";
import { Renderer } from "./renderer"; 
import { clickPos } from "./util";

const canvas = <HTMLCanvasElement>document.getElementById('grid');
const renderer = new Renderer(canvas);
let grid : Grid = null;
let gen : Generator = null;
let dict : Dict = new Dict();

function createGrid() {

    const size = parseInt((<HTMLInputElement>document.getElementById("grid_size")).value);
    if (Number.isNaN(size) || size < 3 || size > 20) {
        alert("Invalid size - please provide a value between 3 and 20.");
        return;
    }

    grid = new Grid(size, dict);
    grid.symmetrical = (<HTMLInputElement>document.getElementById("grid_symmetry")).checked;
    grid.combineCount = (<HTMLInputElement>document.getElementById("combine_axis_count")).checked;
    grid.ignoreSingleSpace = (<HTMLInputElement>document.getElementById("ignore_single_space")).checked;
    grid.limitMaxWords = (<HTMLInputElement>document.getElementById("limit_max_words")).checked;
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

function onClickGrid(e:MouseEvent) {
    e.preventDefault();

    const coord = clickPos(e, canvas);
    const gx = Math.floor(coord.x / renderer.scale);
    const gy = Math.floor(coord.y / renderer.scale);

    grid.select(gx, gy);

    renderer.render(grid);
}

function onRightClickGrid(e:MouseEvent) {
    e.preventDefault();
    const coord = clickPos(e, canvas);
    const gx = Math.floor(coord.x / renderer.scale);
    const gy = Math.floor(coord.y / renderer.scale);
    grid.toggleBlock(gx, gy);
    grid.rescore();
    renderer.render(grid);
}

function onDoubleClickGrid(e:MouseEvent) {
    e.preventDefault();
    // not used
}

function onKeyDown(e:KeyboardEvent) {
    // console.log(e);

    // only if canvas has focus and we've selected an element
    if (document.body != document.activeElement || grid.selected == null) {
        return;
    }

    if (e.keyCode >= 65 && e.keyCode <= 90) { // character key
        grid.selected.letter = e.key.toUpperCase();
        grid.rescoreIntersection(grid.selected.x, grid.selected.y);

        if ((<HTMLInputElement>document.getElementById("auto_move")).checked) {
            let cx = grid.selected.x + 1;
            let cy = grid.selected.y;
            if (cx >= grid.size) {
                cx = 0;
                cy++;
                if (cy >= grid.size) {
                    cy = 0;
                }
            }
            grid.select(cx, cy);
        }
    } else {

        switch (e.keyCode) {
            case 8:
            case 46:
                grid.selected.letter = null; // BACKSPACE / DEL
                grid.rescoreIntersection(grid.selected.x, grid.selected.y);
                break;

            case 32:
                grid.toggleBlock(grid.selected.x, grid.selected.y);
                grid.rescore();
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
}

// Init event handlers
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
(<HTMLInputElement>document.getElementById("limit_max_words")).addEventListener('change', (e:Event) => {
    grid.limitMaxWords = (<HTMLInputElement>document.getElementById("limit_max_words")).checked;
    grid.rescore();
    renderer.render(grid);
});
(<HTMLInputElement>document.getElementById("grid")).addEventListener('click', (e:MouseEvent) => onClickGrid(e));
(<HTMLInputElement>document.getElementById("grid")).addEventListener('contextmenu', (e:MouseEvent) => onRightClickGrid(e));
(<HTMLInputElement>document.getElementById("grid")).addEventListener('dblclick', (e:MouseEvent) => onDoubleClickGrid(e));
(document).addEventListener('keydown', (e:KeyboardEvent) => onKeyDown(e));

// Startup
createGrid();

