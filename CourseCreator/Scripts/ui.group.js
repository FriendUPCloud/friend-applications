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
        let self = this;
        
        this.domElement.innerHTML = '';
        
        // Group containers with rows cannot have columns
        let rowcontainer = domElement.getElementsByTagName( 'rows' );
        if( rowcontainer.length )
        {
            rowcontainer = rowcontainer[0];
            
            this.setGroupAttributes( rowcontainer );
            
            let rows = rowcontainer.getElementsByTagName( 'row' );
            for( let a = 0; a < rows.length; a++ )
            {
                if( rows[a].parentNode != rowcontainer )
                    continue;
                let d = document.createElement( 'div' );
                d.className = 'ccRow';
                
                // Is column scrollable?
                let scrollable = rows[a].getAttribute( 'scrollable' );
                if( scrollable )
                {
                    d.style.overflow = 'auto';
                    d.style.scrollBehavior = '';
                    if( scrollable == 'smooth' )
                    {
                        d.style.scrollBehavior = 'smooth';
                    }
                }
                
                let children = rows[a].getElementsByTagName( '*' );
                for( let b = 0; b < children.length; b++ )
                {
                    if( children[b].parentNode != rows[a] )
                        continue;
                    d.appendChild( children[b] );
                }
                this.domElement.appendChild( d );
            }
            this.domElement.classList.remove( 'ccColumns' );
            this.domElement.classList.add( 'ccRows' );
            return;
        }  
        
        // Group containers with columns cannot have rows
        let colcontainer = domElement.getElementsByTagName( 'columns' );
        if( colcontainer.length )
        {
            colcontainer = colcontainer[0];
            
            this.setGroupAttributes( colcontainer );
            
            let columns = colcontainer.getElementsByTagName( 'column' );
            for( let a = 0; a < columns.length; a++ )
            {
                if( columns[a].parentNode != colcontainer )
                    continue;
                let d = document.createElement( 'div' );
                d.className = 'ccColumn';
                
                // Is column scrollable?
                let scrollable = columns[a].getAttribute( 'scrollable' );
                if( scrollable )
                {
                    d.style.overflow = 'auto';
                    d.style.scrollBehavior = '';
                    if( scrollable == 'smooth' )
                    {
                        d.style.scrollBehavior = 'smooth';
                    }
                }
                
                if( columns[a].getAttribute( 'id' ) )
                {
                    d.id = columns[a].getAttribute( 'id' );
                }
                let children = columns[a].getElementsByTagName( '*' );
                for( let b = 0; b < children.length; b++ )
                {
                    if( children[b].parentNode != columns[a] )
                        continue;
                    d.appendChild( children[b] );
                }
                this.domElement.appendChild( d );
            }
            this.domElement.classList.remove( 'ccRows' );
            this.domElement.classList.add( 'ccColumns' );
            return;
        }
    }
    
    setGroupAttributes( domElement )
    {
        // Use gap for flex box
        let gap = domElement.getAttribute( 'gap' );
        if( gap )
        {
            this.domElement.style.gap = gap;
        }
        
        // Set height based on parent
        let height = domElement.getAttribute( 'height' );
        if( height )
        {
            this.domElement.style.height = height;
        }
    }
    // Refreshes gui's own dom element
    refreshDom()
    {
    }
}
ccFactory.registerClass( 'group' );
