/*=====================================================================
	v002/global.js
=====================================================================*/
/*=====================================================================
	Parent to all js files in project
=====================================================================*/
/*=============================================================
	HTML utility and general functions
=============================================================*/
export function addSubContainerToContainer(
	parentId='pos-boot', 
	childType='div', 
	childClass='boot-logo',
	innerText='YoYoYo',
	innerHTML='',
	){

	// 1. Grab the container using the # ID
	const mainContainer = document.getElementById(parentId);
	
	// 2. Create a new element (e.g., a div)
	const newBox = document.createElement(childType);
	
	// 3. Give it some content or a class
	newBox.className = childClass;
	
	//newBox.innerText = innerText;
	newBox.innerHTML = innerHTML;
	
	if (innerHTML){
		// 4. Add it to the main container
		mainContainer.appendChild(newBox);
	}
}

/*=============================================================
	ART
=============================================================*/

export function drawCanvas(rows=10, cols=40, fillChar='.'){
	let canvas = [];
	for (let row = 0; row < rows; row++) {
		let char = String(fillChar).slice(0,1) || 'x';
    	canvas.push(char.repeat(cols));
	}
	return canvas;
}

export function drawOnCanvas(drawLines = [], canvas = [], rowStart = 0, colStart = 0) {

    let canvasNew = [...canvas];

    for (let i = 0; i < drawLines.length; i++) {
        let targetRowIndex = i + rowStart;
        if (targetRowIndex >= 0 && targetRowIndex < canvasNew.length) {
            let canvasChars = canvasNew[targetRowIndex].split('');
            let drawLineChars = drawLines[i].split('');

            for (let j = 0; j < drawLineChars.length; j++) {
                let targetColIndex = colStart + j;
                if (targetColIndex >= 0 && targetColIndex < canvasChars.length) {
                    canvasChars[targetColIndex] = drawLineChars[j];
                }
            }
            canvasNew[targetRowIndex] = canvasChars.join('');
        }
    }
    return canvasNew;
}

export function getBoxLines(width=6, height=4, fillChar =' ', thickBorder=false){
	let lines = [];
	const centerSpcCt = Math.max(width-2, 0);
	const char = String(fillChar).slice(0,1) || 'x';
	const charBord = '-';
	if (thickBorder){ charBord = '='; }	
	const topBtmLine = '+' + charBord.repeat(centerSpcCt) + '+';
	const sideLine = '|' + char.repeat(centerSpcCt) + '|'; 
	lines.push(topBtmLine);
	for (let i=1; i<height-1; i++){ lines.push(sideLine); }
	lines.push(topBtmLine);
	return lines;
}







