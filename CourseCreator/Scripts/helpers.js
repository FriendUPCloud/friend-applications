/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/* 
  General functions
*/
// Create DOM Element abstraction
let ce = function(type,
                  {
                    "text": text = "",
                    "ckEditor": ckEditor = false,
                    "attributes": attributes = {},
                    "classes": classes =  [],
                    "listeners": listeners = []
                   }={}){

    let e = document.createElement(type);
    
    // Add attributes
    for ( let [k, v]  of Object.entries(attributes) ) {
        e.setAttribute(k, v);
    }
    
    // Add text
    e.innerHTML = text;
    
    // Add classes
    classes.forEach( c => {
        e.classList.add( c );
    });

    // Make CK Editor
    if (ckEditor == true){
        InlineEditor
            .create( e )
            .catch( error => {
                console.error( error );
                } 
            );
    }

    // Add event listeners
    listeners.forEach( l => {
        //console.logr(l);
        e.addEventListener(
            l.event,
            l.callBack,
            (l.options) ? l.options : null
        );
    });
    
    return e;
}


let removeDomChildren = function (domEle)
{
    while (domEle.firstChild) {
        domEle.firstChild.remove();
    }
}

let setDomChildren = function (domEle, domChildren)
{
    //removeDomChildren(domEle);
    domChildren.forEach( domChild => {
        domEle.appendChild(domChild);
    });
}

function allowDrop(ev)
{
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "copy";
}

function dragToolbox(ev)
{
    //console.log(ev);
    ev.dataTransfer.setData("text", ev.srcElement.dataset.elementType);
    ev.dataTransfer.setData("isNew", true);
    ev.dataTransfer.dropEffect = "copy";
}

function drop(ev)
{
    ev.preventDefault();
    console.log();

    if ( ev.dataTransfer.getData("isNew") ) {
        let elementType = ev.dataTransfer.getData("text");

        // drop in Page (only element that has a createNewElement function)
        let ele = ev.target.elementRef;
        if ( (typeof(ele) != "undefined") 
            && (typeof(ele.createNewElement) == "function") )
            ele.createNewElement(elementType, function() {
                    ele.sortElements();
            });
            
    }

}

function endDrag(ev)
{
    ev.preventDefault();
}
