/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/


// Course viewer element
class FUICourseviewer extends FUIElement
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
        
        this.domElement.classList.add( 'FUICourseviewer' );
        
        // Add side panel
        this.panel = document.createElement( 'div' );
        this.panel.className = 'FUICourseviewerPanel';
        this.domElement.appendChild( this.panel );
        
        // Add main canvas
        this.canv = document.createElement( 'div' );
        this.canv.className = 'FUICourseviewerCanvas';
        this.domElement.appendChild( this.canv );
    }
    
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        // if( domElement.getAttribute( 'someattribute' ) )
        //     do something
        
        
        //this.refreshDom();
    }
    refreshDom()
    {
        super.refreshDom();
        
        if( this.structureUpdated )
        {
        	this.structureUpdated = false;
        	this.refreshStructure();
        }
        
        // Do something with properties on dom
        /*
        if( this.property )
        {
            this.domElement.classList.add( 'FUIClassName' );
        }
        else
        {
            this.domElement.classList.remove( 'FUIClassName' );
        }*/
    }
    getMarkup( data )
    {
    	// Return meta-markup for class instantiation later
    	
    	/*let str = '<checkbox {options}/>';
    	let opts = [];
    	for( let a in data )
    	{
    		if( a == 'OnChange' )
    		{
    			opts.push( 'onchange="' + data[a] + '"' );
    		}
    		if( a == 'Value' && data[a] )
    		{
    			opts.push( 'checked="checked"' );
    		}
    	}
    	if( opts.length )
    	{
    		str = str.split( '{options}' ).join( opts.join( ' ' ) );
    	}
    	else
    	{
    		str = str.split( ' {options}' ).join( '' );
    	}
    	return str;*/
    }
    
    refreshStructure()
    {
    	let self = this;
    	
    	// Load course structure and make DOM elements
    	this.loadCourseStructure( function( data )
    	{
    		if( data )
	    		console.log( 'Here is the data: ', JSON.parse( data ) );
    	} );
    }
    
    setCourse( courseStructure )
    {
    	this.course = courseStructure;
    	this.structureUpdated = true;
    	this.refreshDom();
    }
    
    /* Private methods ------------------------------------------------------ */
    
    loadCourseStructure( cbk )
    {
    	let m = new Module( 'system' );
    	m.onExecuted = function( me, md )
    	{
    		if( me )
    		{
    			if( cbk ) return cbk( md );
    		}
    		if( cbk ) return cbk( false );
    		return;
    	}
    	m.execute( 'appmodule', {
    		moduleName: 'Courses',
    		command: 'loadcoursestructure',
    		courseId: this.course.ID
    	} );
    }
}
FUI.registerClass( 'courseviewer' );

