/*
=====================================================================
	v002/global.js
=====================================================================
*/

/*
=====================================================================
	Parent to all js files in project
	
	
=====================================================================
*/


/*
=============================================================

	HTML utility
	
=============================================================
*/
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



/*
=============================================================
	ART
=============================================================
*/

export function drawCanvas(rows=20, cols=40){
	let canvas = [];
	for (let row = 0; row < rows; row++) {
    	canvas.push(".".repeat(cols));
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
