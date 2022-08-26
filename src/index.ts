import { Dict } from "./dictionary";
import { Grid, Cell } from "./grid";
import { Renderer } from "./renderer"; 
import { clickPos } from "./util";
import wordlist from './wordlist.txt';

const canvas = <HTMLCanvasElement>document.getElementById('grid');
const renderer = new Renderer(canvas);
let grid : Grid = null;
let gen : Generator = null;
let dict : Dict = new Dict(wordlist);

function createGrid() {

    const size = parseInt((<HTMLInputElement>document.getElementById("grid_size")).value);
    if (Number.isNaN(size) || size < 3 || size > 20) {
        alert("Invalid size - please provide a value between 3 and 20.");
        return;
    }

    const symmetry = (<HTMLInputElement>document.getElementById("grid_symmetry")).checked;
    grid = new Grid(size, symmetry);
	
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

function updateGridSymmetry() {
    grid.symmetrical = (<HTMLInputElement>document.getElementById("grid_symmetry")).checked;
    console.log("Symmetrical: ", grid.symmetrical);
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
                grid.selected.letter = ""; // BACKSPACE / DEL
                break;

            case 32:
                grid.toggleBlock(grid.selected.x, grid.selected.y);
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
(<HTMLInputElement>document.getElementById("grid_symmetry")).addEventListener('change', (e:Event) => updateGridSymmetry());
(<HTMLInputElement>document.getElementById("grid")).addEventListener('click', (e:MouseEvent) => onClickGrid(e));
(<HTMLInputElement>document.getElementById("grid")).addEventListener('contextmenu', (e:MouseEvent) => onRightClickGrid(e));
(<HTMLInputElement>document.getElementById("grid")).addEventListener('dblclick', (e:MouseEvent) => onDoubleClickGrid(e));
(document).addEventListener('keydown', (e:KeyboardEvent) => onKeyDown(e));

// Startup
createGrid();

