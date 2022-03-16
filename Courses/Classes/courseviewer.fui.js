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
	/* Synopsis:
	constructor( options )
    attachDomElement()
    grabAttributes( domElement )
    refreshDom()
    getMarkup( data )
    refreshStructure()
    getCourseImage( elementId, callback )
    redrawNavPanel()
    renderElements()
    addToCanvas( element )
    registerElementValue( uniqueName, value )
    setCourse( courseStructure, courseSessionId )
    #loadCourseStructure( cbk )
    */

    constructor( options )
    {
        super( options );
        // Do stuff
    }
    
    // Some public vars
    completed = false
    storedActivePage = -1
    storedActiveSection = -1
    
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
    	let opts = '';
    	if( this.options.uniqueId )
    	{
    		opts += ' uniqueid="' + this.options.uniqueId + '"';
    	}
    	return '<courseviewer ' + opts + '/>';
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
    		
    		let csId = self.#courseSessionId;
    		
    		// First pass, check current section
    		if( !self.activeSection )
    		{
    			let b = 0;
				for( let a in self.sections )
				{
					if( self.sections[ a ].ID == self.storedActiveSection || ( self.storedActiveSection == -1 && b == 0 ) )
					{
						console.log( 'Found section ' + a + ' on ' + b + '.' );
						self.activeSection = a;
						break;
					}
					b++;
				}
			}
    		
    		// Render sections
    		for( let a in self.sections )
    		{
    			let row = self.sections[a];
    			let d = document.createElement( 'div' );
    			d.className = 'FUICourseviewerSection';
    			d.innerHTML = '<div class="Name">' + row.Name + '</div><div class="Progress"><progressbar progress="0%"/></div><div class="Pages"></div>';
    			
    			if( self.activeSection == a )
    			{
    				d.classList.add( 'Emphasized' );
    			}
    			else
    			{
    				d.classList.remove( 'Emphasized' );
    			}
    			
    			// Activate section on click
    			// Rules:
    			// A user can leave current section if:
    			// a) If the section is complete, and the user requests the next section
    			( function( ind )
    			{
					d.onclick = function()
					{
						if( self.completed ) return;
						
						if( self.currentPage < self.sections[ self.activeSection ].pages.length - 1 )
						{
							Alert( 'You cannot skip to the next section', 'You need to navigate to the last page of this section before skipping to the next one.' );
							return;
						}
						
						let s = new Module( 'system' );
						s.onExecuted = function( se, sd )
						{
							if( ind == parseInt( self.activeSection ) + 1 )
							{
								// If current section is done, 
								if( se == 'ok' || self.getCurrentSection().Navigation == '1' )
								{
									let currentSection = self.activeSection;
								
									self.activeSection = ind;
									self.currentPage = 0;
									self.refreshStructure();
									self.renderElements();
								}
								else
								{
									Alert( 'You can not change section', 'Please visit and examine all pages before leaving this current course section.' );
								}
							}
							else
							{
								Alert( 'You cannot go back to a previous section', 'You are attempting to select the previous section. This is not allowed.' );
							}
						}
						s.execute( 'appmodule', {
							appName: 'Courses',
							command: 'checksectiondone',
							sectionId: self.getCurrentSection().ID,
							courseSessionId: csId
						} );
					}
				} )( a );
				
				// Set active section
				let m = new Module( 'system' );
				m.execute( 'appmodule', {
					appName: 'Courses',
					command: 'setsessioninfo',
					currentSectionId: self.getCurrentSection().ID
				} );
				
    			self.panel.appendChild( d );
    		}
    		
    		self.renderElements();
    		
    		Application.sendMessage( { command: 'refreshcourses' } );
    	} );
    }
    
    // Get the image from the course module, based on elementId
    getCourseImage( elementId, callback )
    {
    	let self = this;
    	
    	let m = new Module( 'system' );
    	m.onExecuted = function( ee, dd )
    	{
    		if( ee == 'ok' )
    		{
    			if( callback )
    			{
    				let args = JSON.stringify( {
    					appName: 'Courses',
    					command: 'getcourseimage',
    					mode: 'data',
    					elementId: elementId,
    					courseId: self.course.ID
    				} );
    				let src = '/system.library/module/?module=system&command=appmodule&authid=' + Application.authId + '&args=' + args;
    				callback( { src: src } );
    				return;
    			}
    		}
    		if( callback ) callback( false );
    	}
    	m.execute( 'appmodule', {
    		appName: 'Courses',
    		command: 'getcourseimage',
    		mode: 'test',
    		elementId: elementId,
    		courseId: this.course.ID
    	} );
    }
    
    // Fetch current section
    getCurrentSection()
    {
    	let self = this;
    	
    	for( let a in self.sections )
		{
			if( a == self.activeSection )
				return self.sections[ a ];
		}
		return false;
    }
    
    // Fetch current page
    getCurrentPage()
    {
    	let self = this;
    	
    	let sect = this.getCurrentSection();
		if( sect && sect.pages )
		{
			for( let a = 0; a < sect.pages.length; a++ )
			{
				if( self.currentPage == a )
				{
					return sect.pages[a];
				}
			}
		}
		return false;
    }
    
    // Check if page has been completed
    pageCompleted()
    {
    	let self = this;
    	let pag = self.getCurrentPage();
    	
    	// Are the page elements solved?
    	let solved = true;
    	
    	// Get all elements
    	let eles = self.canvasContent.getElementsByTagName( '*' );
    	
    	for( let a = 0; a < eles.length; a++ )
    	{
    		// Checking element dummy
    		if( eles[a].dummy )
    		{
    			if( !eles[a].dummy.resolved )
    			{
    				solved = false;
    				break;
    			}
    		}
    	}
    	return solved;
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
		
		if( sect.pages )
		{
			// First pass, check active page
			if( !self.currentPage )
			{
				for( let a = 0; a < sect.pages.length; a++ )
				{
					if( sect.pages[a].ID == self.storedActivePage || ( self.storedActivePage == -1 && a == 0 ) )
					{
						self.currentPage = a;
						//console.log( 'Found current page ' + a + ' where stored is ' + self.storedActivePage + ' and this page is ' +  sect.pages[a].ID );
					}
				}
			}
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
					if( self.getCurrentSection().Navigation == '1' )
    				{
						pag.onclick = function()
						{
							if( self.completed ) return;
							self.currentPage = num;
							self.renderElements();
						}
					}
				} )( p, a );
				this.navpanel.querySelector( '.Pages' ).appendChild( p );
			}
			
			let pid = sect.pages[ self.currentPage ].ID;
			
			console.log( 'Setting current page: ', self.currentPage + ' ' + pid );
			
			// Set active page
			let csid = this.#courseSessionId;
			
			// Workaround on saving issue..
			setTimeout( function()
			{
				let mo = new Module( 'system' );
				mo.execute( 'appmodule', {
					appName: 'Courses',
					command: 'setsessioninfo',
					currentPageId: pid,
					courseSessionId: csid
				} );
			}, 250 );
		}
		
		// Set active section
		let m = new Module( 'system' );
		m.execute( 'appmodule', {
			appName: 'Courses',
			command: 'setsessioninfo',
			currentSectionId: self.getCurrentSection().ID,
			courseSessionId: this.#courseSessionId
		} );
		
		this.navpanel.querySelector( '.Previous' ).onclick = function()
		{
			if( self.completed ) return;
			if( self.getCurrentSection().Navigation == '1' )
			{
				self.currentPage--;
				if( self.currentPage < 0 ) 
				{
					self.currentPage = 0;
					return;
				}
				self.renderElements();
			}
		}
 		
		this.navpanel.querySelector( '.Next' ).onclick = function()
		{
			if( self.completed ) return;
			if( self.pageCompleted() )
			{
				self.currentPage++;
				if( self.currentPage >= self.sections[ self.activeSection ].pages.length )
				{
					// Check if there's a next section'
					let b = 0;
					let current = 0;
					for( let a in self.sections )
					{
						if( a == self.activeSection )
							current = b;
						// This is the next section
						if( b == current + 1 )
						{
							self.activeSection = a;
							self.currentPage = 0;
							self.refreshStructure();
							return;
						}
						b++;
					}
					self.currentPage--;
					return;
				}
				self.renderElements();
			}
			else
			{
				console.log( 'This page is not solved.' );
			
			}
		}
    }
    
    // Render page and elements for that page
    renderElements()
    {
    	let self = this;
    	
    	// TODO: Handle no section?
    	if( !self.activeSection ) return;
    	
    	if( self.renderingElements ) 
    	{
    		return;
    	}
    	
    	self.renderingElements = true;
    	
    	if( !self.currentPage )
    	{
    		self.currentPage = 0;
    	}
    	
    	self.canvasContent.innerHTML = '';
    	
	    self.canvasHeader.innerHTML = self.course.Name + 
	    	' <span class="IconSmall fa-chevron-right"></span> ' + 
	    	self.getCurrentSection().Name + 
	    	' <span class="IconSmall fa-chevron-right"></span> ' + 
	    	self.getCurrentPage().Name;
    	
    	let act = false;
    	for( let a in self.sections )
    		if( a == self.activeSection )
    			act = self.sections[ a ];
    	
    	let csId = self.#courseSessionId;
    	
    	if( act && act.pages && act.pages[self.currentPage] )
    	{
    		// Ref the page
    		let page = act.pages[self.currentPage];
			// Load all elements for the page
			let m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e != 'ok' ) 
				{
					self.renderingElements = false;
					return;
				}
				let els = JSON.parse( d );
				for( let a = 0; a < els.length; a++ )
				{
					console.log( 'Cool element: ', els[a] );
					/*// Convert from BASE64
					if( els[a].Properties.substr && els[a].Properties.substr( 0, 7 ) == 'BASE64:' )
					{
						console.log( 'This element has weird properties!', els[a].Properties );
						els[a].Properties = Base64.decode( els[a].Properties.substr( 7, els[a].Properties.length - 7 ) );
						els[a].Properties = JSON.parse( els[a].Properties );
					}
					else
					{
						console.log( 'This element has normal properties!', els[a].Properties );
					}*/
					
					let ele = self.createElement( els[a].ElementType, els[a] );
					self.addToCanvas( ele );
					if( ele.init )
						ele.init();
				}
				FUI.initialize();
				self.renderingElements = false;
				
				// Update page status (tick off the box)
				let p = new Module( 'system' );
				p.onExecuted = function( pc, pd )
				{
					// nothing
					console.log( 'What result of page status: ', pc, pd );
				}
				p.execute( 'appmodule', {
					appName: 'Courses',
					command: 'setpagestatus',
					pageId: page.ID,
					courseSessionId: csId
				} );
				
				self.redrawNavPanel();
			
				// Check which state the buttons are in
				self.checkNavButtons();
			}
			
			m.execute( 'appmodule', {
				appName: 'Courses',
				command: 'loadpageelements',
				pageId: page.ID
			} );
		}
		else
		{
			self.renderingElements = false;
		}
    }
    
    checkNavButtons()
    {
    	let self = this;
    	
    	if( self.getCurrentSection().Navigation != '1' )
		{
			this.navpanel.querySelector( '.Previous' ).classList.add( 'Disabled' );
		}
		else
		{
			this.navpanel.querySelector( '.Previous' ).classList.remove( 'Disabled' );
		}
		if( self.pageCompleted() )
		{
			this.navpanel.querySelector( '.Next' ).classList.remove( 'Disabled' );
			
			// Check if this is the last page, and that the course is completed
			let lastPage = false;
			let sect = this.getCurrentSection();
			if( sect && sect.pages )
			{
				for( let a = 0; a < sect.pages.length; a++ )
				{
					if( self.currentPage == a )
					{
						if( a == sect.pages.length - 1 )
						{
							lastPage = true;
						}
					}
				}
			}
			let lastSection = false;
			for( let a in self.sections )
			{
				lastSection = false;
				if( a == self.activeSection )
				{
					lastSection = true;
				}
			}
			
			let next = this.navpanel.querySelector( '.Next' );
			// This allows the user to complete the course
			if( lastSection && lastPage )
			{
				next.innerHTML = '<span>Finish</span>';
				if( !next.oldonclick )
					next.oldonclick = next.onclick;
				let csid = this.#courseSessionId;
				next.onclick = function( e )
				{
					let m = new Module( 'system' );
					m.onExecuted = function( me, md )
					{
						if( me == 'ok' )
						{
							self.showCompletedState();
						}
						else
						{
							Alert( 'Could not complete course', 'There\'s some issue with completing this course. Please ask your administrator.' );
						}
					}
					m.execute( 'appmodule', {
						appName: 'Courses',
						command: 'complete',
						courseSessionId: csid
					} );
				}
			}
			// Reset if possible
			else if( next.oldonclick )
			{
				next.onclick = next.oldonclick;
			}
		}
		else
		{
			this.navpanel.querySelector( '.Next' ).classList.add( 'Disabled' );
		}
    }
    
    // What happens when the course is completed
    showCompletedState()
    {
    	let self = this;
    	let f = new File( 'Progdir:Assets/completed.html' );
    	self.completed = true;
    	self.canvasContent.classList.add( 'Loading' );
    	f.onLoad = function( data )
    	{
    		self.canvasContent.innerHTML = data;
    		setTimeout( function(){
    			self.canvasContent.classList.remove( 'Loading' );
    		}, 250 );
    		Application.sendMessage( { command: 'refreshcourses' } );
    	}
    	f.load();
    }
    
    // Just add an element to the canvas
    addToCanvas( element )
    {
    	this.canvasContent.appendChild( element );
    }
    
    // Register the value of the element
    registerElementValue( uniqueName, value, elementId )
    {
    	let m = new Module( 'system' );
    	m.onExecuted = function( e, d ){}
    	m.execute( 'appmodule', {
    		appName: 'Courses',
    		command: 'regelementvalue',
    		uniqueName: uniqueName,
    		elementId: elementId,
    		value: value,
    		courseSessionId: this.#courseSessionId,
    		courseId: this.course.ID
    	} );
    	
    	this.checkNavButtons();
    }
    
    // Create an element for the course viewer canvas to add
    createElement( type, data )
    {
    	let self = this;
    	let props = JSON.parse( data.Properties );
    
    	// To store the state of the element
    	let dummyElement = {
    		type: type,
    		resolved: false
    	};
    
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
    		case 'radioBoxQuestion':
    		{
    			let initializers = [];
    			let d = document.createElement( 'form' );
    			d.name = 'random_' + Math.random();
    			d.className = 'FUICourseRadiobox';
    			
    			let bx = document.createElement( 'div' );
    			bx.className = 'FUIRADContent';
    			bx.innerHTML = '<strong>' + props.question + '</strong>';
    			
    			let ul = document.createElement( 'div' );
    			ul.className = 'FUIRADUL';
    			
    			for( let b in props.radioBoxes )
    			{
    				let n = document.createElement( 'div' );
    				n.className = 'FUIRADLI';
    				let nam = md5( data.ID + '_' + b );
    				
    				let l = props.radioBoxes[b].label.split( /\<.*?\>/ ).join( '' );
    				
    				n.innerHTML = '<span>' + ( parseInt( b ) + 1 ) + '.</span><label for="ch_' + nam + '">' + l + '</label><span><input id="ch_' + nam + '" elementid="' + data.ID + '" name="n" type="radio"/></span>';
    				ul.appendChild( n );
    				
    				let check = n.getElementsByTagName( 'input' )[0];
    				check.nam = nam;
    				check.onchange = function( e )
    				{
    					self.registerElementValue( this.nam, this.checked, this.getAttribute( 'elementid' ) );
    					
    					// Uncheck other elements in db
    					let els = ul.getElementsByTagName( 'input' );
    					for( let c = 0; c < els.length; c++ )
    					{
    						if( els[c] != this )
    							self.registerElementValue( els[c].id.substr( 3, els[c].id.length - 3 ), false, els[c].getAttribute( 'elementid' ) );
    					}
    					
    					// Check that at least one is checked
    					dummyElement.resolved = false;
    					let inps = n.getElementsByTagName( 'input' );
    					for( let a = 0; a < inps.length; a++ )
    					{
    						if( inps[ a ].checked )
    						{
    							dummyElement.resolved = true;
    						}
    					}
    					
    					dummyElement.resolved = true;
    					
    					self.pageCompleted();
    					self.checkNavButtons();
    				}
    				
    				// Restore value
    				initializers.push( {
    					name: nam,
    					func: function( n )
						{
							let chk = ge( 'ch_' + n );
							let m = new Module( 'system' );
							m.onExecuted = function( ee, dd )
							{
								if( ee == 'ok' )
								{
									let v = JSON.parse( dd );
									if( v.Value )
									{
										chk.checked = 'checked';
										dummyElement.resolved = true;
									}
									else
									{
										chk.checked = '';
									}
									self.checkNavButtons();
								}
							}
							m.execute( 'appmodule', {
								appName: 'Courses',
								command: 'getelementvalue',
								courseSessionId: self.#courseSessionId,
								courseId: self.course.ID,
								uniqueName: n
							} );
						}
					} );
    			}
    			
    			bx.appendChild( ul );
    			
    			d.appendChild( bx );
    			d.initializers = initializers;
    			d.init = function()
    			{
					for( let a = 0; a < this.initializers.length; a++ )
					{
						this.initializers[ a ].func( this.initializers[ a ].name );
					}
				}
				d.dummy = dummyElement;
    			
    			return d;
    		}
    		case 'checkBoxQuestion':
    		{
    			let initializers = [];
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
    				
    				n.innerHTML = '<span>' + ( parseInt( b ) + 1 ) + '.</span><label for="ch_' + nam + '">' + l + '</label><span><input id="ch_' + nam + '" elementid="' + data.ID + '" type="checkbox"/></span>';
    				ul.appendChild( n );
    				
    				let check = n.getElementsByTagName( 'input' )[0];
    				check.nam = nam;
    				check.onchange = function( e )
    				{
    					self.registerElementValue( this.nam, this.checked, this.getAttribute( 'elementid' ) );
    					
    					// Check that at least one is checked
    					let inps = n.getElementsByTagName( 'input' );
    					dummyElement.resolved = false;
    					for( let a = 0; a < inps.length; a++ )
    					{
    						if( inps[ a ].checked )
    						{
    							dummyElement.resolved = true;
    						}
    					}
    					
						self.pageCompleted();
						self.checkNavButtons();
    				}
    				
    				// Restore value
    				initializers.push( {
    					name: nam,
    					func: function( n )
						{
							let chk = ge( 'ch_' + n );
							let m = new Module( 'system' );
							m.onExecuted = function( ee, dd )
							{
								if( ee == 'ok' )
								{
									let v = JSON.parse( dd );
									if( v.Value )
									{
										chk.checked = 'checked';
										dummyElement.resolved = true;
									}
									else
									{
										chk.checked = '';
									}
								}
								self.checkNavButtons();
							}
							m.execute( 'appmodule', {
								appName: 'Courses',
								command: 'getelementvalue',
								courseSessionId: self.#courseSessionId,
								courseId: self.course.ID,
								uniqueName: n
							} );
						}
					} );
    			}
    			
    			bx.appendChild( ul );
    			
    			d.appendChild( bx );
    			
    			d.initializers = initializers;
    			d.init = function()
    			{
					for( let a = 0; a < this.initializers.length; a++ )
					{
						this.initializers[ a ].func( this.initializers[ a ].name );
					}
				}
				
				d.dummy = dummyElement;
    			
    			return d;
    		}
    		case 'image':
    		{
    			let d = document.createElement( 'div' );
    			d.className = 'FUICourseImage';
    			
    			let im = document.createElement( 'div' );
    			im.className = 'FUICCIMG';
    			
    			im.innerHTML = '<h2>' + props.image.title + '</h2>';
    			
    			// Get image from element id
    			let i = document.createElement( 'img' );
    			self.getCourseImage( data.ID, function( result )
    			{
    				if( result )
    				{
						i.src = result.src;
					}
					else
					{
						im.removeChild( i );
					}
    			} );
    			im.appendChild( i );
    			
    			d.appendChild( im );
    		
    			return d;
    		}
    		default:
    			console.log( 'Unknown type ' + type );
    			break;
    	}
    }
    
    // Set the active course object, and the active course session id
    setCourse( courseStructure, courseSessionId )
    {
    	// TODO: Verify course session id with module call
    	if( !courseSessionId ) return;
    	
    	let self = this;
    	
    	// Set this before anything
    	this.#courseSessionId = courseSessionId;
    	
    	// Read information before starting
    	let m = new Module( 'system' );
    	m.onExecuted = function( me, md )
    	{
    		if( me != 'ok' )
    		{
    			Alert( 'Can not load course session', 'Something is broken with your current course session.' );
    			return;
    		}
    		
    		let information = JSON.parse( md );
    		if( information && information.ID )
    		{
				self.course = courseStructure;
				self.structureUpdated = true;
				self.storedActivePage = information.CurrentPage;
				self.storedActiveSection = information.CurrentSection;
				
				// If it's zero, it's not set yet
				if( self.storedActivePage == 0 && self.storedActiveSection == 0 )
				{
					self.storedActivePage = -1;
					self.storedActiveSection = -1;
				}
				self.refreshDom();
			}
		}
		m.execute( 'appmodule', {
			appName: 'Courses',
			command: 'getsessioninfo',
			courseSessionId: courseSessionId
		} );
    }
    
    /* Private methods ------------------------------------------------------ */
    
    #navbarAdded = false
    #courseSessionId = 0
    
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

