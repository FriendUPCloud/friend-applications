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
    	if( c )
	        e.classList.add( c );
    });

    // Make CK Editor
    if (ckEditor == true){
        InlineEditor
            .create( e, {
            	//removePlugins: [ 'ImageInline' ]
            	toolbar: [ 'heading', 'bold', 'italic', 'bulletedList', 'numberedList', 'outdent', 'indent', 'blockQuote' , 'insertTable', 'link', 'mediaEmbed', 'undo', 'redo' ]
            } )
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
	domEle.innerHTML = '';
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

    if ( ev.dataTransfer.getData("isNew") ) {
        let elementType = ev.dataTransfer.getData("text");

        // drop in Page (only element that has a createNewElement function)
        let ele = ev.target.elementRef;
        if( 
        	(typeof(ele) != "undefined") &&
            (typeof(ele.createNewElement) == "function") 
        )
        {
            ele.createNewElement(elementType, function()
            {
            	if( ele.sortElements )
                    ele.sortElements();
            } );
        }   
    }

}

function endDrag(ev)
{
    ev.preventDefault();
}

/* Properties --------------------------------------------------------------- */

let propsCont = false;

// Edit Element, domnode and coursecreator
function showEditProperties( element, domNode, ctx )
{
	if( propsCont )
	{
		document.body.removeChild( propsCont );
		propsCont = false;
	}
	
	let l = GetElementLeft( domNode );
	let t = GetElementTop( domNode ) - document.querySelector( '.CcPanelSide' ).scrollTop;
	let h = GetElementHeight( domNode );
	let w = GetElementWidth( domNode );
	
	let d = document.createElement( 'div' );
	d.onclick = function( e )
	{
		e.stopPropagation( e );
	}
	d.style.left = l + 'px';
	d.style.top = ( t + h ) + 'px';
	d.style.width = w + 'px';
	d.className = 'ElementProperties';
	document.body.appendChild( d );
	propsCont = d;
	
	let propFile = 'Progdir:Templates/editor_properties.html';
	
	if( element.type == 'project' )
	{
		propFile = 'Progdir:Templates/editor_project_properties.html';
		d.classList.add( 'Project' );
		
		FUI.addCallback( 'project_publish_change', function( ch )
		{
			courseCreator.publishState = ch ? 1 : 0;
			
			let m = new Module( 'system' );
			m.execute( 'appmodule', {
				appName: 'CourseCreator',
				command: 'submodule',
				vars: {
					method: 'publishcourse',
				    submodule: 'courses',
				    published: ch,
				    courseId: courseCreator.manager.children[0].dbId
				}
			} );
		} );
	}
	// In sections you can change free navigation flag
	else if( element.elementType == 'section' )
	{
		propFile = 'Progdir:Templates/editor_section_properties.html';
		d.classList.add( 'Section' );
		
		FUI.addCallback( 'project_section_nav_change', function( ch )
		{
			element.sectionFreeNavigation = ch ? 1 : 0;
			
			let m = new Module( 'system' );
			m.execute( 'appmodule', {
				appName: 'CourseCreator',
				command: 'submodule',
				vars: {
					method: 'setsectionnavigation',
				    submodule: 'courses',
				    freeNavigation: ch,
				    elementId: element.dbId
				}
			} );
		} );
	}
	
	let f = new File( propFile );
	f.onLoad = function( data )
	{
		d.innerHTML = data;
		
		FUI.initialize();
		
		//console.log( 'Lets look at element: ', element );
		
		if( element.type == 'project' )
		{
			let ch = FUI.getElementByUniqueId( 'project_publish_checkbox' );
			ch.checked = courseCreator.publishState == 1 ? true : false;
			ch.refreshDom();
		}
		else if( element.elementType == 'section' )
		{
			let ch = FUI.getElementByUniqueId( 'project_section_nav_change' );
			ch.checked = element.sectionFreeNavigation == 1 ? true : false;
			ch.refreshDom();
		}
		
		let flick = document.createElement( 'div' );
		flick.className = 'Flick';
		d.appendChild( flick );
		
		let inp = d.getElementsByTagName( 'input' )[0];
		inp.value = element.name ? element.name : 'No name';
		
		d.classList.add( 'Showing' );
		
		inp.onchange = function( e )
		{
			element.name = inp.value;
            element.save( inp.value );
            if( ctx )
	            ctx.renderIndex();
            removeEditProperties();
		}
		
		let b = d.getElementsByTagName( 'button' );
		b[0].onclick = function( e )
		{
            element.name = inp.value ? inp.value : 'No name';
            element.save( inp.value );
            if( ctx )
	            ctx.renderIndex();
            removeEditProperties();
		}
		
		inp.focus();
		inp.select();
		
	}
	f.load();
}

function removeEditProperties()
{
	if( propsCont )
	{
		let p = propsCont;
		p.classList.remove( 'Showing' );
		propsCont = false;
		setTimeout( function()
		{
			document.body.removeChild( p );
		}, 150 );
	}
}

document.body.addEventListener( 'click', function( e )
{
	removeEditProperties();
} ); 

/* Done Properties ---------------------------------------------------------- */

function editProject( e )
{
	e.stopPropagation();
	showEditProperties( { 
		name: ge( 'ProjectName' ).innerText, 
		type: 'project',
		save: function( newName ){
			let m = new Module( 'system' );
			m.execute( 'appmodule', {
				appName: 'CourseCreator',
				command: 'submodule',
				vars: {
				    method: 'setcoursename',
				    submodule: 'courses',
				    coursename: newName,
				    courseId: courseCreator.manager.children[0].dbId
				}
			} );
			ge( 'ProjectName' ).innerHTML = newName;
		} 
	}, ge( 'ProjectName' ).parentNode, false );
}

