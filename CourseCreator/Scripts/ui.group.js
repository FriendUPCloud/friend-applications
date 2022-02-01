/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class ccGroup extends ccGUIElement
{
    constructor( options )
    {
    	super( options );
    }
    
    // Sets options on gui element
    setOptions( options )
    {
        super( options );
        if( options.value )
            this.value = options.value;
        if( options.elements )
            this.elements = options.elements;
    }
    // Attaches GUI to dom element if specified
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        this.domElement.classList.add( 'ccGUI', 'ccGroup' );
        
        this.refreshDom();
    }
    
    // Grabs attributes from the dom element if they are supported
    grabAttributes( domElement )
    {
        
    }
    // Refreshes gui's own dom element
    refreshDom()
    {
    }
}


