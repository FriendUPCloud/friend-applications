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
        
        let hd  = document.createElement( 'h1' );
        hd.className = 'FUICourseviewerCanvasHeader';
        hd.innerHTML = '';
        this.canv.appendChild( hd );
        
        this.canvasHeader = hd;
        
        let cnt = document.createElement( 'div' );
        cnt.className = 'FUICourseviewerCanvasContent';
        this.canv.appendChild( cnt );
        
        this.canvasContent = cnt;
        
        // Add navigation panel
        this.navpanel = document.createElement( 'div' );
        this.navpanel.className = 'FUICourseviewerNavigation';
        this.domElement.appendChild( this.navpanel );
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
    			else if( self.activeSection == a )
    			{
    				d.classList.add( 'Emphasized' );
    			}
    			else
    			{
    				d.classList.remove( 'Emphasized' );
    			}
    			
    			( function( ind )
    			{
					d.onclick = function()
					{
						self.activeSection = ind;
						self.currentPage = 0;
						self.refreshStructure();
						self.renderElements();
					}
				} )( a );
    			
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
    		
    		self.renderElements();
    	} );
    }
    
    // Redraw the navigation panel
    redrawNavPanel()
    {
    	let self = this;
    	
    	let b = 0;
    	let sect = false;
    	for( let a in self.sections )
		{
			if( a == self.activeSection )
				sect = self.sections[ a ];
		}
		if( !sect ) return;
		
		// Make next prev
		if( !this.#navbarAdded )
		{
			this.#navbarAdded = true;
			let str = '';
			str += '<div class="Previous"><span>Previous</span></div><div class="Pages"></div><div class="Next"><span>Next</span></div>';
			this.navpanel.innerHTML = str;
		}
		
		this.navpanel.querySelector( '.Pages' ).innerHTML = '';
		
		let offset = 0;
		
		for( let a = 0; a < sect.pages.length; a++ )
		{
			let p = document.createElement( 'div' );
			p.className = 'PageElement';
			p.style.left = ( ( a * 40 ) - offset ) + 'px';
			if( self.currentPage == a )
			{
				p.classList.add( 'ActivePage' );
			}
			p.innerHTML = '<span>' + ( a + 1 ) + '</span>';
			( function( pag, num )
			{
				pag.onclick = function()
				{
					self.currentPage = num;
					self.renderElements();
				}
			} )( p, a );
			this.navpanel.querySelector( '.Pages' ).appendChild( p );
		}
    }
    
    // Render page and elements for that page
    renderElements()
    {
    	let self = this;
    	
    	// TODO: Handle no section?
    	if( !self.activeSection ) return;
    	
    	
    	if( self.renderingElements ) return;
    	self.renderingElements = true;
    	
    	if( !self.currentPage )
    	{
    		self.currentPage = 0;
    	}
    	
    	self.canvasContent.innerHTML = '';
    	
    	let act = false;
    	for( let a in self.sections )
    		if( a == self.activeSection )
    			act = self.sections[ a ];
    	
    	if( act && act.pages && act.pages[self.currentPage] )
    	{
    		// Ref the page
    		let page = act.pages[self.currentPage];
			// Load all elements for the page
			let m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e != 'ok' ) return;
				let els = JSON.parse( d );
				for( let a = 0; a < els.length; a++ )
				{
					self.addToCanvas( self.createElement( els[a].ElementType, els[a] ) );
				}
				FUI.initialize();
				self.renderingElements = false;
			}
			console.log( 'Checking elements on page: ' + page.ID );
			m.execute( 'appmodule', {
				appName: 'Courses',
				command: 'loadpageelements',
				pageId: page.ID
			} );
		}
		self.redrawNavPanel();
    }
    
    // Just add an element to the canvas
    addToCanvas( element )
    {
    	this.canvasContent.appendChild( element );
    }
    
    createElement( type, data )
    {
    	let props = JSON.parse( data.Properties );
    
	    console.log( 'Props: ', props );
    
    	switch( type )
    	{
    		case 'textBox':
    		{
    			let d = document.createElement( 'div' );
    			d.className = 'FUICourseTextbox';
    			
    			let txt = document.createElement( 'div' );
    			txt.className = 'FUICTextContent';
    			txt.innerHTML = props.textBox.content;
    			d.appendChild( txt );
    			
    			return d;
    		}
    		case 'checkBoxQuestion':
    		{
    			let d = document.createElement( 'div' );
    			d.className = 'FUICourseCheckbox';
    			
    			let bx = document.createElement( 'div' );
    			bx.className = 'FUICCBXContent';
    			bx.innerHTML = '<strong>' + props.question + '</strong>';
    			
    			let ul = document.createElement( 'div' );
    			ul.className = 'FUICBXUL';
    			
    			for( let b in props.checkBoxes )
    			{
    				let n = document.createElement( 'div' );
    				n.className = 'FUICBXLI';
    				let nam = md5( data.ID + '_' + b );
    				
    				let l = props.checkBoxes[b].label.split( /\<.*?\>/ ).join( '' );
    				
    				n.innerHTML = '<span>' + ( parseInt( b ) + 1 ) + '.</span><label for="ch_' + nam + '">' + l + '</label><span><input id="ch_' + nam + '" type="checkbox"/></span>';
    				ul.appendChild( n );
    			}
    			
    			bx.appendChild( ul );
    			
    			d.appendChild( bx );
    		
    			return d;
    		}
    		case 'image':
    		{
    			let d = document.createElement( 'div' );
    			d.className = 'FUICourseImage';
    			
    			let im = document.createElement( 'div' );
    			im.className = 'FUICCIMG';
    			
    			im.innerHTML = '<h2>' + props.image.title + '</h2>';
    			
    			let i = document.createElement( 'img' );
    			i.src = getImageUrl( props.image.friendSource );
    			im.appendChild( i );
    			
    			d.appendChild( im );
    		
    			return d;
    		}
    		default:
    			console.log( 'Unknown type ' + type );
    			break;
    	}
    }
    
    setCourse( courseStructure )
    {
    	this.course = courseStructure;
    	this.canvasHeader.innerHTML = this.course.Name;
    	this.structureUpdated = true;
    	this.refreshDom();
    }
    
    /* Private methods ------------------------------------------------------ */
    
    #navbarAdded = false
    
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

