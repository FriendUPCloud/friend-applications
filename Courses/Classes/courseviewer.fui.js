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
    	this.#loadCourseStructure( function( data )
    	{
    		if( !data ) return;
    		self.sections = {};
    		let list = JSON.parse( data );
    		for( let a = 0; a < list.length; a++ )
    		{
    			if( list[a].Type == 'Section' )
    			{
    				self.sections[ list[a].ID ] = list[a];
    			}
    			else if( list[a].Type == 'Page' )
    			{
    				let sect = list[a].SectionID;
    				if( self.sections[ sect ] )
    				{
    					if( !self.sections[ sect ].pages )
    					{
    						self.sections[ sect ].pages = [];
    					}
    					self.sections[ sect ].pages.push( list[a] );
    				}
    			}
    		}
    		
    		self.panel.innerHTML = '<h1 class="FUICourseviewerSectionHeader">Course navigation</h1>';
    		for( let a in self.sections )
    		{
    			let row = self.sections[a];
    			let d = document.createElement( 'div' );
    			d.className = 'FUICourseviewerSection';
    			d.innerHTML = '<div class="Name">' + row.Name + '</div><div class="Progress"><progressbar progress="0%"/></div><div class="Pages"></div>';
    			
    			if( !self.activeSection )
    			{
    				self.activeSection = a;
    				d.classList.add( 'Emphasized' );
    			}
    			
    			/*let pages = d.querySelector( '.FUICourseviewerPages' );
    			for( let b = 0; b < row.pages.length; b++ )
    			{
    				let p = document.createElement( 'div' );
    				p.className = 'FUICourseviewerPage';
    				p.innerHTML = row.pages[b].Name;
    				pages.appendChild( p );
    			}*/
    			self.panel.appendChild( d );
    		}
    		FUI.initialize();
    	} );
    }
    
    setCourse( courseStructure )
    {
    	this.course = courseStructure;
    	this.structureUpdated = true;
    	this.refreshDom();
    }
    
    /* Private methods ------------------------------------------------------ */
    
    #loadCourseStructure( cbk )
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
    		appName: 'Courses',
    		command: 'loadcoursestructure',
    		courseId: this.course.ID
    	} );
    }
}
FUI.registerClass( 'courseviewer' );

