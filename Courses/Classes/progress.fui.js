/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/


// Checkbox element
class FUITemplate extends FUIElement
{
    constructor( options )
    {
        super( options );
        // Do stuff
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        // Set stuff on this.domElement.innerHTML
        this.domElement.classList.add( 'FUIProgress' );
        
        let d = document.createElement( 'div' );
        d.className = 'FUIProgressGroove';
        this.domElement.appendChild( d );
        
        let b = document.createElement( 'div' );
        b.className = 'FUIProgressBar';
        d.appendChild( b );
        
        this.bar = b;
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let pct = domElement.getAttribute( 'progress' );
        if( pct )
        {
        	this.options.percent = pct;
        }
        
        this.refreshDom();
    }
    refreshDom()
    {
        super.refreshDom();
        
        // Do something with properties on dom
        
        this.bar.style.width = this.options.percent ? this.options.percent : '0%';
        
    }
    getMarkup( data )
    {
    	// Return meta-markup for class instantiation later
    	return '<progress progress="' + ( this.options.progress ? this.options.progress : '0%' ) + '"/>';
    }
}
FUI.registerClass( 'progress' );



