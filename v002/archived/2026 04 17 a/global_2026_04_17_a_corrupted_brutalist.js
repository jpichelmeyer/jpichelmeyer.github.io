/*=====================================================================
	v002/global.js
=====================================================================*/
/*=====================================================================
	Parent to all js files in project
=====================================================================*/
/*=============================================================
	HTML utility and general functions
=============================================================*/
/*=====================================================================
	v002/global.js - Streamlined
=====================================================================*/
export function addSubContainerToContainer(
	parentId = 'pos-boot', 
	childType = 'div', 
	childClass = 'boot-logo',
	innerHTML = ''
){
	const mainContainer = document.getElementById(parentId);
	if (!mainContainer || !innerHTML) return;

	const newBox = document.createElement(childType);
	newBox.className = childClass;
	newBox.innerHTML = innerHTML;
	
	mainContainer.appendChild(newBox);
}

export function drawCanvas(rows=20, cols=40){
	return Array(rows).fill(".".repeat(cols));
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
