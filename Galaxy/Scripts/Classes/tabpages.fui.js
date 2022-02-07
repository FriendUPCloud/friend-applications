/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUITabpages extends FUIElement
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
        
        // Tab page containers
        let pagecontainer = domElement.getElementsByTagName( 'pages' );
        let pages = false;
        if( pagecontainer.length )
        {
            pagecontainer = pagecontainer[0];
            
            let container = document.createElement( 'div' );
            container.className = 'FUITabPageContainer';
            
            this.setPageAttributes( pagecontainer );
            
            pages = pagecontainer.getElementsByTagName( 'page' );
            for( let a = 0; a < pages.length; a++ )
            {
                if( pages[a].parentNode != pagecontainer )
                    continue;
                let d = document.createElement( 'div' );
                d.className = 'FUIPage' + ( a == 0 ? ' Active' : '' );
                
                let children = pages[a].getElementsByTagName( '*' );
                for( let b = 0; b < children.length; b++ )
                {
                    if( children[b].parentNode != pages[a] )
                        continue;
                    d.appendChild( children[b] );
                }
                container.appendChild( d );
            }
            this.domElement.appendChild( container );
        }
        
        // Tab containers
        let tabcontainer = domElement.getElementsByTagName( 'tabs' );
        if( tabcontainer.length )
        {
            tabcontainer = tabcontainer[0];
            
            let container = document.createElement( 'div' );
            container.className = 'FUITabContainer';
            
            this.setTabAttributes( tabcontainer );
            
            let tabs = tabcontainer.getElementsByTagName( 'tab' );
            for( let a = 0; a < tabs.length; a++ )
            {
                if( tabs[a].parentNode != tabcontainer )
                    continue;
                let d = document.createElement( 'div' );
                d.className = 'FUITab' + ( a == 0 ? ' Active' : '' );
                ( function( ele, index )
                {
                	if( pages )
                	{
				        d.onclick = function()
				        {
				        	for( let a = 0; a < tabs.length; a++ )
				        	{
				        		if( a == index )
				        		{
				        			console.log( 'Found it on ' + a + ' on ' + tabs.length );
				        			tabs[a].classList.add( 'Active' );
				        			pages[a].classList.add( 'Active' );
				        		}
				        		else
				        		{
				        			tabs[a].classList.remove( 'Active' );
				        			pages[a].classList.remove( 'Active' );
				        		}
				        	}
				        }
				    }
		        } )( d, a );
                
                let children = tabs[a].getElementsByTagName( '*' );
                for( let b = 0; b < children.length; b++ )
                {
                    if( children[b].parentNode != tabs[a] )
                        continue;
                    d.appendChild( children[b] );
                }
                container.appendChild( d );
            }
            this.domElement.appendChild( container );
        }
    }
    
    // Set attribute for the tabs container
    setTabAttributes( tabs )
    {
    }
    
    setPageAttributes( pages )
    {
    }
    
    // Refreshes gui's own dom element
    refreshDom()
    {
    }
}


FUI.registerClass( 'tabpages' );

