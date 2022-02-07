/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUITabPages extends FUIElement
{
	constructor( options )
	{
		super( options );
		
	}
	// Sets options on gui element
    setOptions( options )
    {
    	
    }
    
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        this.domElement.classList.add( 'FUI', 'FUITabPages' );
        
        this.refreshDom();
    }
    
    grabAttributes( domElement )
    {
        let self = this;
        
        this.domElement.innerHTML = '';
        
    }
    
    // Refreshes gui's own dom element
    refreshDom()
    {
    }
}


FUI.registerClass( 'tabpages' );

