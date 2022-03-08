/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// general EventListeners
document.addEventListener('dragover', allowDrop);
document.addEventListener('drop', drop );

var isCtrl = false;

document.onkeyup=function( e )
{
    if( e.keyCode == 17 ) isCtrl = false;
}
document.onkeydown=function(e)
{
    if( e.keyCode == 17 ) isCtrl = true;
    if( e.keyCode == 83 && isCtrl == true ) 
    {
        courseCreator.manager.saveActivePage();
        return false;
    }
}

Application.receiveMessage = function( msg )
{
    // Don't treat noisy messages that do not adhere to our spec
    if( !msg.command ) return;
    
    // Ah we got our message!
    if( msg.command == 'save' )
    {
        courseCreator.manager.saveActivePage();
    }

    if( msg.command == 'loadCourse' )
    {
        console.log('received message to load course', msg );
        courseCreator.load( msg.courseId );
    }
}

/* IO Classes / this will be section
*
*  Provides database interface for the elements
*/
class CourseCollection 
{
    constructor ( courseCreator ){
        this.courseCreator = courseCreator;
    }
}

// NB: Element class is in the element_base.js file

/*
* Course Class manages the
*
* sorts its sections. creates new section. 
*
* sort is a function on element with child/parent
* render is a function on element and children to propogate
*
*/
class CourseElement extends Element
{
    constructor(parent, displayId=0, dbId=0, name='')
    {
        super(parent, "course", displayId, dbId, name);
    }

    save = function(callBack)
    {
        let params = {
            table: this.classInfo.dbTable,
            ID: this.dbId == null ? 0 : this.dbId,
            Name: this.name == null ? '' : this.name,
            DisplayID: this.displayId == null ? 0 : this.displayId,
            CourseCollectionID: 1
        };
        
        console.log("Update table ", params);
        courseCreator.dbio.call(
            'updateTable',
            params,
            function ( code, data ) {
                if (callBack)
                    callBack( data );
            }
        );
    }

    createSection = function()
    {
        let cls = registeredElements.get("page").class;
        let s = new cls(this);
        s.save();
        courseCreator.manager.renderIndex();
        s.renderMain();
    }
}


// This element contains page elements
class SectionElement extends Element 
{
    constructor( parent, displayId=0, dbId=0, name='' ) 
    {    
        super(parent, "section", displayId, dbId, name); 
        this.linkDomContainer( courseCreator.mainView );
    }
    
    // Get the next displayId slot
    getNextDisplayId()
    {
    	let disp = 0;
    	for( let a in this.children )
    	{
    		if( this.children[a].displayId > disp )
    		{
    			disp = this.children[a].displayId;
    		}
    	}
    	return disp + 1;
    }

    save = function(callBack)
    {
        let params = {
            table: this.classInfo.dbTable,
            ID: this.dbId == null ? 0 : this.dbId,
            Name: this.name == null ? '' : this.name,
            DisplayID: this.displayId == null ? 0 : this.displayId,
            CourseID: this.parent.dbId == null ? 0 : this.parent.dbId,
            ElementTypeID: this.classInfo.elementTypeId
        };
        courseCreator.dbio.call(
            'updateTable',
            params,
            function ( code, data ) {
                if (callBack && typeof( callBack ) == 'function' )
                    callBack( data );
            }
        );
    }
}

// This element contains UI elements
class PageElement extends Element
{
    constructor(parent, displayId=0, dbId=0, name='')
    {
        super(parent, 'page', displayId, dbId, name);
        
        this.linkDomContainer();
        
        this.domContainer.hidden = true;
        
        // make the pages sortable        
        Sortable.create(
            this.domContainer, {
            handle: '.handle',
            animation: 300
        });
        
        this.domContainer.classList.add( 'list-group' );
    }

    /*    
        SortElements

        Sorts all elements on the page
        Give each element a new displayID depending
        on the order in the page/domContainer

    */    
    sortElements = function()
    {
        let self = this;
        let sortedElements = new Array();

        // Get all elements in domContainer
        let domElements = (
            this.domContainer.getElementsByClassName( 'element' )
        );

        // Loop over elements and set displayId
        Array.from(domElements).forEach( ( de, i ) => {
            de.elementRef.displayId = i;
            de.dataset.displayId = i;
            sortedElements.push(de.elementRef);
        });

        // Set children to the new sorteElements array
        self.children = sortedElements;
    }

    /*
        LoadElements

        Load elements from database to the page.

    */
    loadElements = function ( callBack ) 
    {
        let self = this;

        // Reset the domContainer
        self.domContainer.replaceChildren();

		//console.log( 'Loading elements. sectionId: ' + self.parent.dbId+ ', pageId: ' + self.dbId );

        // Get the elements on sectionId/pageId
        courseCreator.dbio.call(
            'getSectionData',
            {
                sectionId: self.parent.dbId,
                pageId: self.dbId
            },
            // CallBack to process the data returned
            function ( code, data ) 
            {
                if (code == "fail")
                {
                    console.log(data);
                    return false;
                }

                // process the data
                let elementRows = JSON.parse(data);
                
                // Loop and create new element objects
                elementRows.forEach( r => {
                    let cls = registeredElements.get(r.elementType).class;
                    new cls( 
                        self, 
                        r.elementDisplayID,
                        r.elementID,
                        r.elementName,
                        r.elementProperties,
                        r.sortOrder
                    );
                });

                // Callback 
                return callBack();
            }
        );
    }

    /*    
        Save 

        Save PageElement to database

    */
    save = function(callBack)
    {
        // save page page to database
        let params = {
            table: this.classInfo.dbTable,
            ID: this.dbId == null ? 0 : this.dbId,
            DisplayID: this.displayId == null ? 0 : this.displayId,
            Name: this.name == null ? '' : this.name,
            SectionID: this.parent.dbId == null ? 0 : this.parent.dbId,
            ElementTypeID: this.classInfo.elementTypeId
        };
        
        if( params.DisplayID == 0 && params.ID == 0 )
        {
        	params.DisplayID = this.parent.getNextDisplayId();
        	this.displayId = params.DisplayID;
        }

        //console.log("Update table ", params);
        courseCreator.dbio.call(
            'updateTable',
            params,
            function ( code, data ) {
                if (typeof( callBack ) == 'function' )
                    callBack( data );
                courseCreator.manager.fetchIndex();
            }
        );
    }

    /*
        Save Elements

        Save the elements on the page to database

    */
    saveElements = function ( callBack ) 
    {
        let self = this;

        if( self.children.length <= 0 ) return;
        
        // Loop through children and save elements
        let sortOrder = 0;
        // Get children by sortOrder
        let cont = false;
        for( let a = 0; a < self.children.length; a++ )
        {
        	if( self.children[a] && self.children[a].domContainer && self.children[a].domContainer.parentNode )
        	{
        		cont = self.children[a].domContainer.parentNode;
        	}
        }
        if( cont )
        {
		    for( let b = 0; b < cont.childNodes.length; b++ )
		    {
		    	if( !cont.childNodes[b].getAttribute( 'data-element-type' ) )
		    		continue;
		    	// Find elements and save them by sort order
		    	for( let a = 0; a < self.children.length; a++ )
		    	{
		    		let e = self.children[ a ];
					if( e.domContainer != cont.childNodes[b] )
						continue;
					e.sortOrder = sortOrder++;
				    e.save();
				};
		    }
		} 
    }

    /*
        Rendermain

        Overloads render main of Element
        Renders all elements on a page
    */
    renderMain = function()
    {
        let self = this;

        // Sort and set the displayId on elements
        self.sortElements();

        // Unhide self page 
        self.domContainer.hidden = false;

        // Get all page elements
        let pageElements = self.parent.domContainer.getElementsByClassName(
            'page'
        );

        // Hide all other page elements
        Array.from(pageElements).forEach( pEle => {
            if (pEle !== self.domContainer){
                pEle.hidden = true;
            }
        });

        // Get data from source every time
        self.loadElements(function (){
            self.children.forEach( e => {
                // Call renderMain on child elements
                e.renderMain();
            });
        });
        
        // Set header page and section selected
        document
            .querySelector('.CcPanelMain .ContentHeader h3')
            .innerHTML = self.parent.name + " / " + self.name;

        // Set the page to active on the section
        self.parent.activeChild = self;
    }

    /*
        delete (Page)

    */
    // delete = function () {
    //     let self = this;

    //     // Delete from index


    //     // Delete from parent dom element
    //     self.parent.domContainer.removeChild(self.domContainer);

    //     // Delete all children also (in database delete on cascade)



    // }
}

class DBIO
{
    constructor(moduleName, appName, type="appmodule")
    {
        this.moduleName = moduleName;
        this.appName = appName;
        this.type = type;
    }
    call = function(funcName, vars, callBack)
    {
    	for( let a in vars )
    	{
    		console.log( 'Calling DBIO with var: ' + a + ' vars[a]: ' + vars[a] );
    		if( vars[a] == null || typeof( vars[a] ) == 'undefined' )
    		{
    			vars[a] = false;
    		}
    	}
        let self = this;
        let m = new Module ( self.moduleName );
        m.onExecuted = function ( returnCode, returnData )
        {
            // add check for OK return code
            //console.log("in dbio ", returnCode, returnData);
            if (callBack)
                callBack( returnCode, returnData );
        }
        /*console.log( 'Let\'s query module: ', self.type, {
            appName: self.appName,
            command: funcName,
            vars: vars
        } );*/
        
        m.execute( self.type, {
            appName: self.appName,
            command: funcName,
            vars: vars
        });
    }
}

class ElementTypeIO 
{
    constructor(courseCreator) 
    {
        this.courseCreator = courseCreator;
        this.data = false;
        this.elementTypes = false;
        this.loadElementTypeData();
    }

    createElementTypeMap = function()
    {
        let self = this;
        self.elementTypes = new Map();
        self.data.forEach( et => {
            self.elementTypes.set(et.Name, et);
        });
    }

    loadElementTypeData= function()
    {
        let self = this;
        let types = self.courseCreator.dbio.call(
            'getTable',
            { table : "CC_ElementType" },
            function ( code, data ) {
                self.processElementTypeData( data );
            }
        );
    }

    processElementTypeData = function( data )
    {
        let self = this;
        try
        {
            let json = JSON.parse( data );
            //console.log(json);
            self.data = json;
            self.elementTypeMap = self.createElementTypeMap();
            self.courseCreator.loadStatus['finished'] += 1;
        }
        catch( e )
        {
            console.log( 'Bad error', e );
        }
        if( self.courseCreator.onReady )
            self.courseCreator.onReady( self.courseCreator.loadStatus );
    }
}

// This element contains section elements
class RootElement extends Element
{
    constructor(courseCreator)
    {
        super(courseCreator, "root");
        this.activePage = false;
    }

    loadData = function( courseId )
    {
        let self = this;
        courseCreator.dbio.call(
            'getCourseList',
            {
            	courseId: courseId
            },
            function ( code, data )
            {
            	if( data.substr( 0, 1 ) == '{' || data.substr( 0, 1 ) == '[' )
	                console.log( "this is the course table", JSON.parse(data) );
	            else console.log( 'response from call: ' + data );
                self.processData(data, courseId);
            }
        );
    }

    saveActivePage = function()
    {
        let self = this;
        
        let pageElements = (
            courseCreator
                .mainView
                .getElementsByClassName('page')
        );
        Array.from(pageElements).forEach( e => {
            if ( !e.hidden )
            {
                e.elementRef.saveElements();
            }
        });
        
        if( this.saveIndicator )
        {
        	let t = this.saveIndicator;
        	this.saveIndicator = false;
        }
        let t = document.createElement( 'span' );
        t.className = 'IconSmall fa-refresh Saving';
        t.innerHTML = '';
        this.saveIndicator = t;
        ge( 'pageSaveIndicator' ).appendChild( t );
        setTimeout( function()
        {
        	t.classList.add( 'Showing' );
        	setTimeout( function()
        	{
        		t.classList.remove( 'Showing' );
        	}, 500 );
        	setTimeout( function()
        	{
        		ge( 'pageSaveIndicator' ).removeChild( t );
        		if( self.saveIndicator == t )
	        		self.saveIndicator = false;
        	}, 750 );
        }, 5 );
    }

    processData = function( data, courseId )
    {
        //TODO: also add pages here
        let self = this;
        
        // Set project name
        let parsedData = JSON.parse( data );
        ge( 'ProjectName' ).innerHTML = parsedData[0].courseName;
        courseCreator.publishState = parsedData[0].courseStatus;
        
        //console.log( 'Checking data for processing (courseId: ' + courseId + ')', data, '--', self.children );
        try
        {	        
            let pageRows = JSON.parse(data);
            pageRows.forEach( r => 
            {
                if( r.courseID == courseId )
                {
                	// Course
		            let c = self.children[r.courseDisplayID];
		            if ( typeof( c ) == 'undefined' )
		            {
		                //console.log("created new course", r);
		                c = new CourseElement(
		                    self,
		                    r.courseDisplayID,
		                    r.courseID,
		                    r.courseName
		                );
		                self.children[r.courseDisplayID] = c;
		            }
		            
		            // Section
		            let s = c.children[r.sectionDisplayID];
		            if( typeof( s ) == 'undefined' )
		            {
		                s = new SectionElement(
		                    c, 
		                    r.sectionDisplayID, 
		                    r.sectionID,
		                    r.sectionName 
		                );
		                c.children[r.sectionDisplayID] = s;
		            }
				}
            } );
            courseCreator.loadStatus.finished += 1;
        }
        catch( e )
        {
            console.log( 'Bad error', e );
        }
        if( courseCreator.onReady )
        {
            courseCreator.onReady( courseCreator.loadStatus );
        }
    }
	
	getElementTypeIcon = function( type )
    {
    	console.log( 'What is the type: ' + type );
    	switch( type )
    	{
			case 'image':
				return 'image';
			case 'checkBoxQuestion':
				return 'check';
			case 'textBox':
				return 'align-left';
    	}
    	return 'warning';
    }
    
    // Render of toolbox menu is the same for all elements
    renderToolbox = function()
    {
        let self = this;
        
        removeDomChildren(courseCreator.toolboxView);
        registeredElements.forEach( ( v, k ) => {
            if( v.group == 'element' )
            {
                courseCreator.toolboxView.appendChild(ce(
                    'div',
                    {
                        'attributes': {
                            'data-element-type': v.elementType,
                            'draggable': 'true'
                        },
                        'text': '&nbsp;' + v.displayName,
                        'classes': [ 'elementType', 'IconSmall', 'fa-' + this.getElementTypeIcon( v.elementType )],
                        'listeners': [
                            {
                                'event': 'dragstart',
                                'callBack': dragToolbox
                            }
                        ]
                    }
                ) );
            }
        });
    }

	// Loads index anew!
	fetchIndex = function( cbk )
	{
		let self = this;
		console.log( 'Here: ', this.children );
		// Courses
		if( !this.children.length )
		{
			return cbk( false );
		}
		for( let a = 0; a < this.children.length; a++ )
		{
			// Sections
			let loadCount = this.children[a].children.length;
			for( let b = 0; b < this.children[a].children.length; b++ )
			{
				// Repopulate children
				( function( sect )
				{
					// Reload pages
					let m = new Module( 'system' );
					m.onExecuted = function( ee, d )
					{
						if( ee == 'ok' )
						{
							let pags = JSON.parse( d );
							sect.children = {};
							for( let a2 = 0; a2 < pags.length; a2++ )
							{
								sect.children[ pags[a2].DisplayID ] = new PageElement(
					                sect,
					                pags[a2].DisplayID,
					                pags[a2].ID,
					                pags[a2].Name
					            );
							}
							console.log( 'Fetch - What is our children: ', sect.children );
							//console.log( 'Section loaded: ', sect.children, pags );
							// When all is done
							if( --loadCount == 0 )
							{
								self.renderIndex();
								if( cbk ) cbk( true );
							}
						}
					}
					m.execute( 'appmodule', {
						appName: 'CourseCreator',
						command: 'fetchpagesfromsection',
						vars: {
							sectionId: sect.dbId
						}
					} );
				} )( this.children[a].children[b] );
			}
		}
	}

	// Just refreshes index
    renderIndex = function ( redraw )
    {	
        let self = this;

        let setActiveClass = function (domEle)
        {
            // remove all .Active classes
            let actives = courseCreator.indexView.querySelectorAll( '.Active' );
                Array.from(actives).forEach( e => {
                    e.classList.remove('Active');
                });
                domEle.classList.add('Active');
        }

        // make Li Element
        let makeLiElement = function( ele, type )
        {
        	if( !type ) type = '';
            let li = ce( 'li' );           
            // element index text
            let div = ce( 'div' );
            let icon = type == 'page' ? 'fa-file-text-o' : ( type == 'section' ? 'fa-bookmark-o' : '' );
            let num = ( parseInt( ele.displayId ) + 1 ) + '';
            if( num.length < 2 )
            	num = '0' + num;
            let text = ce(
                'span',
                { 
                    'text': '<span class="IconSmall fa-remove FloatRight Remove MousePointer MarginLeft"></span>' +
                    		'<span class="IconSmall fa-edit FloatRight Edit MousePointer"></span>' +
                    		( icon ? '&nbsp;' : '' ) + num + '. ' + ele.name,
                    'classes': [ 'IconSmall', icon ],
                    'listeners': [
                        {
                            'event': 'click',
                            'callBack': function ( event ){
                                event.stopPropagation();
                                ele.setActive();
                                ele.renderMain();
                                courseCreator.setActivePanel( 'SectionsPanel' );
                                setActiveClass(
                                    event
                                        .target
                                        .parentNode
                                        .parentNode
                                );
                            }
                        }
                    ]
                }
            );
            div.appendChild(text);
            li.appendChild(div);
            
            // Remove page button
            let r = text.querySelector( '.Remove' );
            if( r )
            {
            	r.onclick = function( event )
            	{
            		event.stopPropagation();
            		ele.setActive();
            		if( ele.delete )
                    {
                        ele.delete( function()
                        	{
			                    self.renderIndex();
			                    self.renderMain();
	                        }
                        );
                    }
            	}
            }
            let ee = text.querySelector( '.Edit' );
            if( ee )
            {
            	ee.onclick = function( event )
            	{
            		event.stopPropagation();
            		ele.setActive();
            		showEditProperties( ele, div, self );
            	}
            }
            
            return li;
        }

        // add to dom
        removeDomChildren( courseCreator.indexView );

        // Add Indexes
        let ul = ce( 'ul' );
        
        // Courses
        self.children.forEach( c => {
            // Sections
            c.children.forEach( s => 
            {
            	//console.log( 'Adding new section: ' + s.name );
            	// Section list
                let sLi = makeLiElement(s, 'section' );
                sLi.classList.add( 'SectionIndex' );
                sLi.element = s;
                
                // Container
                let pUl = ce( 'ul' );
                
                // Pages
                for( let k in s.children )
                {
                	let p = s.children[k];
                	//console.log( 'Adding page ' + p.name );
                    let pLi = makeLiElement( p, 'page' );
                    if (pLi)
                    {
                        pLi.classList.add( 'PageIndex' );
                        pLi.element = p;
                        pUl.appendChild( pLi );
                    }
                };
                sLi.appendChild( pUl );

                // Add new page in a section
                let div = ce( 'div' );
                let buttons = ce( 'div', { 'classes': [ 'buttons' ] } );
                div.appendChild( buttons );
                buttons.appendChild( ce(
                    "span",
                    {
                        'classes': ['IconSmall', 'fa-plus-circle'],
                        'listeners': [
                            {
                                'event': 'click',
                                'callBack': function( event )
                                {
                                    s.createNewElement(
                                        null,
                                        function( newPage )
                                        {
                                            newPage.setActive();
                                            let sLi = event
                                                        .target
                                                        .parentNode
                                                        .parentNode;
                                            let pUl = sLi.querySelector('ul');
                                            let pLi = makeLiElement(newPage);
                                            if( pLi )
                                            {
                                                courseCreator.manager.saveActivePage();
                                                pLi.classList.add('PageIndex');
                                                pLi.element = newPage;
                                                pUl.appendChild(pLi);
                                                setActiveClass(pLi);
                                                showEditProperties( newPage, pLi, self )
                                            }
                                        }
                                    );
                                }
                            }
                        ]
                    }
                ) );
                sLi.appendChild(buttons);
                buttons.setAttribute( 'draggable', true );
                ul.appendChild(sLi);
            } );
        } );
        courseCreator.indexView.appendChild( ul );

         // add new section
        let div = ce('div', { 'classes' : ["SectionButton"]});
        let buttons = ce('div', { 'classes' : ["buttons","Active"] });
        let span = ce(
            "span",
            {
                "classes": ['IconSmall', 'fa-plus-circle'],
                "listeners": [
                    {
                        "event": "click",
                        "callBack": function ( event ) {
                            self.children[0].createNewElement(null, function ( newEle )
                            {
                                newEle.setActive();
                                self.renderIndex();
                                let ss = courseCreator.indexView.querySelectorAll(
                                    '.SectionIndex'
                                );
                                let lastSection = ss[ss.length - 1];
                                console.log('last section', lastSection);
                                setActiveClass(lastSection);
                            } );
                        }
                    }
                ]
            }
        );
        span.innerHTML = '&nbsp;New section';
        buttons.appendChild( span );
        div.appendChild(buttons);
        
        /* Dragging of pages */
        function dragIndicator( evt )
        {
        	let targ = evt.target;
        	let els = ul.getElementsByClassName( 'PageIndex' );
        	for( let a = 0; a < els.length; a++ )
        	{
        		let t = targ;
        		while( t != document.body && t != els[a] )
        			t = t.parentNode;
        		
        		if( t == els[a] )
        		{
        			let py = GetElementTop( els[a] );
        			let ph = GetElementHeight( els[a] );
        			
        			if( evt.y <= py + ( ph / 2 ) )
        			{
        				els[a].classList.remove( 'HoveringBelow' );
        				els[a].classList.add( 'HoveringAbove' );
        			}
        			else
        			{
        				els[a].classList.add( 'HoveringBelow' );
        				els[a].classList.remove( 'HoveringAbove' );
        			}
        		}
        		else
        		{
        			els[a].classList.remove( 'HoveringAbove' );
        			els[a].classList.remove( 'HoveringBelow' );
        		}
        	}
        }
        function clearIndicator( evt )
        {
        	let els = ul.getElementsByClassName( 'PageIndex' );
        	for( let a = 0; a < els.length; a++ )
        	{
        		els[a].classList.remove( 'HoveringAbove' );
    			els[a].classList.remove( 'HoveringBelow' );
        	}
        }
        function repositionPage( evt )
        {
        	let dragger = evt.target;
        	let page = dragger.element;
        	
        	function checkSection( ele )
        	{
        		while( ele.classList != 'SectionIndex' && ele != document.body )
        		{
        			ele = ele.parentNode;
        		}
        		
        		// Set page to section
        		let order = [];
        		let pages = ele.getElementsByClassName( 'PageIndex' );
        		for( let a = 0; a < pages.length; a++ )
        		{
        			order.push( pages[a].element.dbId );
        		}
        		let m = new Module( 'system' );
        		m.onExecuted = function( re, co )
        		{
        			// DONE!
        			self.fetchIndex();
        		}
        		m.execute( 'appmodule', {
        			appName: 'CourseCreator',
        			command: 'setpagesection',
        			vars: {
		    			pageId: page.dbId,
		    			pageOrder: order,
		    			sectionId: ele.element.dbId
		    		}
        		} );
        	}
        	
        	// Reorder
        	let els = ul.getElementsByClassName( 'PageIndex' );
        	for( let a = 0; a < els.length; a++ )
        	{
        		if( els[a].classList.contains( 'HoveringAbove' ) )
        		{
        			els[a].parentNode.insertBefore( dragger, els[a] );
        			checkSection( els[a] );
        		}
        		else if( els[a].classList.contains( 'HoveringBelow' ) )
        		{
        			if( a < els[a].parentNode.childNodes.length - 2 )
        			{
        				els[a].parentNode.insertBefore( dragger, els[a+1] );
        			}
        			else
        			{
        				els[a].parentNode.appendChild( dragger );
        			}
    				checkSection( els[a] );
        		}
        	}
        	clearIndicator();
        }
        let eles = ul.getElementsByClassName( 'PageIndex' );
        for( let a = 0; a < eles.length; a++ )
        {
        	eles[a].setAttribute( 'draggable', true );
        	eles[a].addEventListener( 'dragend', function( evt )
        	{
        		evt.stopPropagation();
        		repositionPage( evt );
        	} );
        	eles[a].addEventListener( 'dragover', function( evt )
        	{
        		dragIndicator( evt );
        	} );
        }
        /* End dragging of pages */
        
        courseCreator.indexView.appendChild(div);
    }

}


// This element contains Root element
class CourseCreator
{
    constructor() 
    {
		// Define views
        this.mainView = ge('main');
        this.indexView = ge('index');
        this.toolboxView = ge('toolbox');
        
        // IO class
        this.dbio = new DBIO('system', 'CourseCreator');
        
        // Element manager
        this.manager = new RootElement(this);
        
        this.setActivePanel( 'SectionsPanel' )
    }

	// Loads a source
    load( courseId )
    {
        this.loadStatus = {
            "jobs": 1,
            "finished": 0
        };
        this.manager.loadData( courseId );
    }

	// Renders all GUI components in the course
    render()
    {
        // render index
        this.manager.renderIndex();
    
        // render toolbox
        this.manager.renderToolbox();
        
        // render main
        this.manager.renderMain();

    }

	// Initializes the course
    initialize()
    {
    	let self = this;
    	console.log( 'We are initializing.' );
    	self.manager.fetchIndex( function()
    	{
    		console.log( 'All done here.' );
		    self.render();

		    // set active to first child
		    let firstPage = self.indexView.querySelector( '.PageIndex' );
		    if( firstPage )
		    {
		        firstPage.classList.add( 'Active' );
		    }

		    // set view button event handler
		    ge('viewButton').addEventListener(
		        'click',
		        function( event ){
		            let v = new View({
		                title: 'Courseviewer',
		                width: 1000,
		                height: 700
		            });
		            let f = new File( 'Progdir:Templates/viewer.html' );
		            f.onLoad = function( data ){
		                v.setContent( data, function(){         
		                    v.sendMessage(
		                        { 
		                            command: 'loadCourse',
		                            courseId: courseCreator.manager.activeChild.dbId
		                        }
		                    );
		                });
		            }
		            f.load();
		        }
		    );
		    
		    // Set up properties functionality
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
			let ch = FUI.getElementByUniqueId( 'project_publish_checkbox' );
			ch.checked = courseCreator.publishState == 1 ? true : false;
			ch.refreshDom();
			let inp = ge( 'PropertiesPanel' ).getElementsByTagName( 'input' )[0];
			inp.value = courseCreator.manager.children[0].name;
			ge( 'saveProps' ).onclick = function()
			{
				courseCreator.manager.children[0].name = inp.value;
				courseCreator.manager.children[0].save();
			}
			// Done properties
		} );
    }
    
    setActivePanel( panel )
    {
    	let panels = [ 'SectionsPanel', 'ToolboxPanel', 'LibraryPanel' ];
    	for( let a in panels )
    	{
    		if( panels[ a ] == panel )
    		{
    			ge( panels[ a ] ).classList.add( 'Active' );
    		}
    		else
    		{
    			ge( panels[ a ] ).classList.remove( 'Active' );
    		}
    	}
    }
}

// singletons
const registeredElements = new Map([
            [
                'root', {}
            ],
            [
                'course', { 
                    class: CourseElement,
                    elementType: "courseElement",
                    displayName: "Course",
                    dbTable: "CC_Course",
                    group: "course",
                    cssClass: "course",
                    childType: "section"
                }
            ],
            [
                'section', {
                    class: SectionElement,
                    elementType: "sectionElement",
                    displayName: "Section",
                    dbTable: "CC_Section",
                    group: "section",
                    cssClass: "section",
                    childType: "page"
                }
            ],
            [
                'page', { 
                    class: PageElement,
                    elementType: "pageElement",
                    displayName: "Page",
                    dbTable: "CC_Page",
                    group: "page",
                    cssClass: "page",
                    childType: "element"
                }
            ],
            [
                'checkBoxQuestion', { 
                    class: CheckBoxQuestionElement,
                    elementTypeId: 1,
                    elementType: "checkBoxQuestion",
                    displayName: "Checkbox Question",
                    dbTable: "CC_Element",
                    group: "element",
                    cssClass: "element"
                }
            ],
            [
                'textBox', { 
                    class: TextBoxElement,
                    elementTypeId: 2,
                    elementType: "textBox",
                    displayName: "TextBox",
                    dbTable: "CC_Element",
                    group: "element",
                    cssClass: "element"
                }
            ],
            [
                'image', { 
                    class: ImageElement,
                    elementTypeId: 3,
                    elementType: "image",
                    displayName: "Image",
                    dbTable: "CC_Element",
                    group: "element",
                    cssClass: "element"
                }
            ]
]);

// Create course creator object and load data
courseCreator = new CourseCreator();
// load (courseId)
// courseCreator.load();
// Datas has been loaded, and triggers callback
courseCreator.onReady = function ( loadStatus )
{
    // Initialize course creator based on data
    if ( loadStatus.finished == loadStatus.jobs ){
        console.log("in initialize");
        courseCreator.initialize();
    }
}


/*

TODO:

done
x 1. read in (coursecollection can wait) and (can wait course list) in course
x 2. choose a course and instatiate
x 3. then load data structure in section 
x.4  update render function on main, section
x. Update create new element function (including setting css class)
x. Implement sort elements on element
x. Implement indexing (order) to keep track of id and order on section
x 1. implement rendertoolbox
x 2. re-implement create new elements
x 3. re-test sort elements
x 2. create an element manager as the top element so
x 
x 5. Implement save function / ie what should the elements have registered on them
x 5. Bug in index
x 5. Save all
x 9. Implement section side with links to page
x 6. Activate all the elements

x 6. implement the CSS from the design and the layout
x Save textBox element


ElementTypes:

DONE 1. Correct DB instructions / templates are they bothered?
DONE 2. CSS for the CheckBox Element
DONE 3. button for new check box


Course list

DONE 1. Course of out list of index
DONE 2. load course on ID
DONE 3. new section button

DONE 4. new section functionality
DONE 3. isActive class on the active section/page with visible span for new element
DONE 3. New page button
DONE 2. space below divs in main
DONE BUG: adding double product when first adding a checkbox


DONE 4. Recreate the logic on edit with classes (could do this first)
DONE 5. Use CK Editor fields on text areas (could do this first)


Delete elements
DONE corner checkbox and individual checkbox on hover 
DONE all elements? generic function for elements

Property Pane
DONE 1. for Page and Section
DONE 2. Edit name and see details
DONE 3. Save and Delete


DONE 1. Sortable enable main view


DONE. Create view button
Done. create the function to open a new window
copy the files:
DONE new html, css, js, split it into panes as the other one
DONE. in the. create a new courseViewer object
DONE with a root class, course, section, page
DONE create a render view function
DONE delete button for checkbox question

DONE BUG with delete element (all are gone)



TODO:





ON Cascade delete Page, Section, Element



DONE 1. Edit course name?
3. CK Editor Image
4. Sortable enable for index view
5. Sortable enable for toolbox drop in
6. off line for the sortable



















remember        



*/
