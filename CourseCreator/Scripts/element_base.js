/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/* Composite classes
*
*  implements: renderHtml( context )
*/
//TODO: rewrite to capture indexing id vs index
class Element
{
    constructor( parent, elementType, displayId=0, dbId=0, name='') 
    {
        /*console.log(
            "in element construct", 
            "elementType", elementType, 
            "displayId", displayId, 
            "dbId", dbId, 
            "name", name
        );*/
        this.parent = parent;
        this.elementType = elementType;
        this.displayId = displayId;
        this.dbId = dbId;

        // Reference to element class information
        this.classInfo = registeredElements.get(elementType);

        // Set name
        this.name = name ? name : "Untitled " + this.classInfo.displayName;

        // Add child to parents children if exists
        if( !( typeof(this.parent.children) == 'undefined' ) )
        {
            //console.log("adding to parent");
            this.parent.children[ displayId ] = this;
        }

        // Initialize element properties
        this.domContainer = false;
        this.children = new Array();
        this.activeChild = false;
    }

    resetDomContainer = function()
    {
        // replaces all content except for delete button
        let buttons = this.domContainer.querySelector( '.buttons' );
        let handle = this.domContainer.querySelector( '.handle' );
        
        //console.log("nav items are ", buttons, handle);
        this.domContainer.replaceChildren(buttons, handle);
        if( this.contentContainer )
        	this.domContainer.appendChild( this.contentContainer );
    }

    linkDomContainer = function( domContainer = false )
    {
        let self = this;
        if (!domContainer)
            domContainer = self.createDomContainer(self.elementClass);
        self.domContainer = domContainer;
        self.domContainer.elementRef = self;
        if (self.parent.domContainer) 
            self.parent.domContainer.appendChild(self.domContainer);
    }

    setActive = function()
    {
        let self = this;
        self.parent.activeChild = self;
        if (typeof(self.parent.setActive) != "undefined")
            self.parent.setActive();
        // Check if we have active child
        let found = false;
        for( let a in self.children )
        {
        	if( self.children[ a ] == self.activeChild )
        	{
        		found = true;
        		break;
        	}
        }
        if( !found ) self.activeChild = self.children[0];
    }

    createDomContainer = function()
    {
        //TODO: need to add element db index plus index in doc
        let self = this; 
        let ele = ce(
            'div',
            {
                'attributes': {
                    'data-display-id': this.displayId,
                    'data-db-id': this.dbId,
                    'data-element-type': this.elementType,
                    'draggable': 'true'
                },
                'classes' : [
                    this.classInfo.cssClass
                ],
                'listeners': [
                            {
                                'event': 'dragend',
                                'callBack': function( e )
                                {
                                	courseCreator.manager.saveActivePage();
                                }
                            }
                        ]
            }
        );
        // add handle (float left for now)
        let handle = ce( 'div', { 'classes': [ 'handle', 'IconSmall', 'fa-arrows-v' ] } );
        ele.appendChild( handle );

        // create delete button
        let buttons = ce( 'div', { 'classes' : [ 'buttons', 'right', 'hoover' ] } );
        let inner = ce('div', 
            { 
                'classes' : [ 'IconSmall', 'fa-times' ],
                'listeners': [
                    {
                        'event': 'click',
                        'callBack': function ( event ){
                            self.delete();
                        }
                    }
                ]
            }
        );
        buttons.appendChild(inner);
        ele.appendChild(buttons);
        return ele;
    }

    /*
        CreateNewElement

        Creates a new child element (generic) for all element types

    */
    createNewElement = function(elementType='', callBack=false)
    {
        let self = this;

        // Set DisplayID
        let displayID = self.children.length;
        
        // Get elementType of child if not set
        if (!elementType)
            elementType = self.classInfo.childType;
        
        // Get the class of the child
        let cls = registeredElements.get(elementType).class;
        let ele = new cls(self, displayID);

        // Call save on the child element
        ele.save(function( data ){
            console.log('element save: why are we saving?', data )
            ele.dbId = data;
            ele.domContainer.dataset.dbId = ele.dbId;
            ele.renderMain();
            if (typeof(callBack) == "function"){
                callBack(ele);
            }
            return ele;
        });
    }

    // creates id on ID is given
    // updates / saves on ID if given
    // should be updated to be element sensitive.
    save = function(callBack)
    {
        let params = {
            table: this.classInfo.dbTable,
            ID: this.dbId == null ? 0 : this.dbId,
            DisplayID: this.displayId == null ? 0 : this.displayId,
            Name: this.name == null ? '' : this.name,
            Properties: JSON.stringify(this.properties),
            SortOrder: JSON.stringify( this.sortOrder ),
            PageID: this.parent.dbId == null ? 0 : this.parent.dbId,
            ElementTypeID: this.classInfo.elementTypeId == null ? 0 : this.classInfo.elementTypeId
        };
        console.log( 'Saving course with these params: ', params );
        courseCreator.dbio.call(
            'updateTable',
            params,
            function ( code, data ) {
                if (callBack)
                    callBack( data );
            }
        );
    }

    /*
        delete element

        Delete function for elements (page and section overload this)
    */
    delete = function ( cbk ) 
    {
        let self = this;

        // Confirm delete
        Confirm( "Warning - Permantly delete", "Do you really want to delete this item? This cannot be undone.", 
        function ( msg )
        {
            // if the user clicks ok then proceed
            if( !msg.data )
                return;

            //console.log( 'Test 1' );
            
            // Remove the element from the domContainer
            if ( self.elementType != 'section' )
            {
                self.parent.domContainer.removeChild( self.domContainer );
            }

            // Set active child to next item if it exists
            let dId = self.displayId;
            if( dId >= 1 )
            {
                self.parent.activeChild = self.parent.children[ dId - 1 ];
            }

            // Remove the element from parents children
            try
            {
            	self.parent.children = self.parent.children.filter( e => e !== self );
            }
            catch( e )
            {
		        //console.log( 'Test 3' );
            }
            

            // Delete from the database table
            console.log( 'About to delete element: ' + self.classInfo.dbTable + ' with id ' + self.dbId );
            courseCreator.dbio.call(
                'deleteRow',
                {
                    table: self.classInfo.dbTable,
                    ID: self.dbId
                },
                // all parent renderMain and render index afterwards
                function( code, data )
                {
                    if (typeof(self.parent.sortElements) == "function")
                    {
                        self.parent.sortElements();
                    }
                    if (self.elemenType == "page" || self.elementType == "section" )
                    {
                        courseCreator.manager.renderIndex();
                    }
                    if( cbk ) cbk();
                }
            );

        } );

    }

    renderMain = function ()
    {
        if (this.children.length == 0)
            return false
        if (this.activeChild == null)
            this.activeChild = this.children[0];
        if( this.activeChild )
	        this.activeChild.renderMain();
        this.parent.activeChild = this;
    }
}

