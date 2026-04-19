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
	newBox.innerText = innerText;
	newBox.innerHTML = innerHTML;
	
	if (innerHTML){
		// 4. Add it to the main container
		mainContainer.appendChild(newBox);
	}
	
	// 4. Add it to the main container
	//mainContainer.appendChild(newBox);
}
