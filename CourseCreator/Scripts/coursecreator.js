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
document.onkeyup=function(e)
{
    if(e.keyCode == 17) isCtrl=false;
}
document.onkeydown=function(e)
{
    if(e.keyCode == 17) isCtrl=true;
    if(e.keyCode == 83 && isCtrl == true) {
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
        console.log('received message', msg );
        courseCreator.load( msg.courseId );
    }

    if( msg.command == 'loadNewCourse' )
    {
        courseCreator.manager.createNewCourse( msg.displayId,
            function ( data ) {
                console.log( "return from the save ", data );
                courseCreator.load( data );
            }
        );
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



/* Composite classes
*
*  implements: renderHtml( context )
*/
//TODO: rewrite to capture indexing id vs index
class Element
{
    constructor( parent, elementType, displayId=0, dbId=0, name='') 
    {
        console.log(
            "in element construct", 
            "elementType", elementType, 
            "displayId", displayId, 
            "dbId", dbId, 
            "name", name
        );
        this.parent = parent;
        this.elementType = elementType;
        this.displayId = displayId;
        this.dbId = dbId;

        // Reference to element class information
        this.classInfo = registeredElements.get(elementType);

        // Set name
        this.name = name ? name : "Untitled " + this.classInfo.displayName;

        // Add child to parents children if exists
        if (! ( typeof(this.parent.children) == "undefined") ) {
            console.log("adding to parent");
            this.parent.children.push(this);
        }

        // Initialize element properties
        this.domContainer = false;
        this.children = new Array();
        this.activeChild = false;
        console.log("this is self ",this);
    }

    resetDomContainer = function()
    {
        // replaces all content except for delete button
        let buttons = this.domContainer.querySelector(".buttons");
        let handle = this.domContainer.querySelector(".handle");
        console.log("nav items are ", buttons, handle);
        this.domContainer.replaceChildren(buttons, handle);
    }

    linkDomContainer = function(domContainer=false)
    {
        let self = this;
        if (!domContainer)
            domContainer = self.createDomContainer(self.elementClass);
        self.domContainer = domContainer;
        self.domContainer.elementRef = self;
        console.log("self parent dom", self.parent.domContainer);
        console.log("self dom", self.domContainer);
        if (self.parent.domContainer) 
            self.parent.domContainer.appendChild(self.domContainer);
    }

    setActive = function()
    {
        let self = this;
        self.parent.activeChild = self;
        if (typeof(self.parent.setActive) != "undefined")
            self.parent.setActive();
        if (!self.children.includes(self.activeChild))
            self.activeChild = self.children[0];
    }

    createDomContainer = function()
    {
        //TODO: need to add element db index plus index in doc
        let self = this; 
        let ele = ce(
            'div',
            {
                "attributes": {
                    "data-display-id": this.displayId,
                    "data-db-id": this.dbId,
                    "data-element-type": this.elementType,
                    "draggable": "true"
                },
                "classes" : [
                    this.classInfo.cssClass
                ],
                "listeners": [
                            {
                                "event": "dragend",
                                "callBack": function( e )
                                {
                                	courseCreator.manager.saveActivePage();
                                }
                            }
                        ]
            }
        );
         // add handle (float left for now)
        let handle = ce('div',{"classes": [ "handle", "IconSmall", "fa-bars"]});
        ele.appendChild(handle);

        // create delete button
        let buttons = ce('div', { "classes" : ['buttons','right','hoover']});
        let inner = ce('div', 
            { 
                "classes" : [ 'IconSmall', 'fa-times'],
                "listeners": [
                    {
                        "event": "click",
                        "callBack": function ( event ) {
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
            console.log('')
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
    delete = function () 
    {
        let self = this;

        // Confirm delete
        Confirm("Warning - Permantly delete", "Proceed?", function ( msg ){
            
            // if the user clicks ok then proceed
            if (msg.data == false)
                return;

            // Remove the element from the domContainer
            if ( self.elementType != "section")
                self.parent.domContainer.removeChild(self.domContainer);

            // Set active child to next item if it exists
            let dId = self.displayId;
            if (dId >= 1)
            {
                self.parent.activeChild = self.parent.children[dId - 1]
            }

            // Remove the element from parents children
            self.parent.children = self.parent.children.filter( e => e !== self );

            // Delete from the database table
            courseCreator.dbio.call(
                'deleteRow',
                {
                    table: this.classInfo.dbTable,
                    ID: this.dbId
                },
                // all parent renderMain and render index afterwards
                function ( code, data ) {
                    if (typeof(self.parent.sortElements) == "function")
                        self.parent.sortElements();
                    if (self.elemenType == "page" || self.elementType == "section" )
                        courseCreator.manager.renderIndex();
                }
            );

        });

    }

    renderMain = function ()
    {
        if (this.children.length == 0)
            return false
        if (this.activeChild == null)
            this.activeChild = this.children[0];
        this.activeChild.renderMain();
        this.parent.activeChild = this;
    }
}



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


class SectionElement extends Element 
{
    constructor( parent, displayId=0, dbId=0, name='' ) 
    {    
        super(parent, "section", displayId, dbId, name); 
        this.linkDomContainer(courseCreator.mainView);
    }

    save = function(callBack)
    {
        let params = {
            table: this.classInfo.dbTable,
            ID: this.dbId == null ? 0 : this.name,
            Name: this.name == null ? '' : this.name,
            DisplayID: this.displayId == null ? 0 : this.displayId,
            CourseID: this.parent.dbId == null ? 0 : this.dbId,
            ElementTypeID: this.classInfo.elementTypeId
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
}

class PageElement extends Element
{
    constructor(parent, displayId=0, dbId=0, name='')
    {
        super(parent, "page", displayId, dbId, name);
        this.linkDomContainer();
        this.domContainer.hidden = true;
        // make the pages sortable        
        Sortable.create(
            this.domContainer, {
            handle: '.handle',
            animation: 300
        });
        this.domContainer.classList.add('list-group');
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
            this.domContainer.getElementsByClassName('element')
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
                
                if (code == "fail"){
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
            ID: this.dbId == null ? 0 : this.displayId,
            DisplayID: this.displayId == null ? 0 : this.displayId,
            Name: this.name == null ? '' : this.name,
            SectionID: this.parent.dbId == null ? 0 : this.parent.dbId,
            ElementTypeID: this.classInfo.elementTypeId
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

class CheckBoxQuestionElement extends Element 
{
    constructor( parent, displayId, dbId=0, name='', properties='' ) 
    {
        super(parent, "checkBoxQuestion", displayId, dbId, name);
        if( !properties )
        {
            properties = {
                question: "question",
                checkBoxes: [
                    {
                        label: "alternative 0",
                        isAnswer: true
                    },
                    {
                        label: "alternative 1",
                        isAnswer: false
                    }
                ]
            };
        }
        this.properties = properties;
        this.linkDomContainer();
        this.resetDomContainer();
        this.domContainer.classList.add("element");
        this.domContainer.classList.add("list-group-item");
    }

    renderMain = function()
    {

        //console.logr("in render main");
        let self = this;

        this.resetDomContainer();
       
        // DOM Elements:
        
        // Question:
        let question = ce(
            "span",
            { 
                "ckEditor": true,
                "text": this.properties.question,
                "classes": ["checkBoxQuestion"],
                "listeners": [
                    {
                        event: "blur",
                        callBack: function( event ) {
                            self.properties.question = event.target.innerHTML;
                        } 
                    }
                ]
            }
        );
        this.domContainer.appendChild(question);
        
        // Checkboxes
        let cbxContainer = ce('div');
        cbxContainer.classList.add( 'checkboxContainer' );
        this.properties.checkBoxes.forEach( ( cbx , i ) => {
            console.log('check box', cbx, "element", this);
            let cbxRow = ce('span', { "classes": ['checkBoxRow']});
            // Checkbox input
            let cbxInput = ce( 
                "input",
                {
                    "attributes": {
                        "type":"checkBox"
                    },
                    "classes": ['checkBoxTick'],
                    "listeners": [
                        {
                            "event": "change",
                            "callBack": function ( event ) {
                                cbx.isAnswer = event.target.checked;
                                if (cbx.isAnswer){
                                    cbxRow.classList.add('isAnswer');
                                }
                                else {
                                    cbxRow.classList.remove('isAnswer');
                                }
                            }
                        }
                    ]
                }
            );
            if (cbx.isAnswer)
                cbxInput.checked = true;

            // Checkbox label
            let cbxLabel = ce(
                "span",
                { 
                    "ckEditor": true,
                    "text": cbx.label,
                    "classes": ["checkBoxLabel"],
                    "listeners": [
                        {
                            "event": "blur",
                            "callBack": function ( event ) {
                                cbx.label = event.target.innerHTML;
                            }
                        }
                    ]
                }
            );

            // delete button
            let cbxDelete = ce("span", { "classes": ["delete"] });
            let cbxDeleteIcon  = ce("span",
                { 
                    "classes" : [ "IconSmall", "fa-times"],
                    "listeners" : [{
                        "event": "click",
                        "callBack": function (event){
                            self.properties.checkBoxes = (
                                self.properties.checkBoxes.filter(
                                    c => c !== cbx
                                )
                            );
                            self.renderMain();
                        }
                    }]
                }
            );
            cbxDelete.appendChild(cbxDeleteIcon);

            cbxRow.appendChild(cbxInput);
            cbxRow.appendChild(cbxLabel);
            cbxRow.appendChild(cbxDelete);
            cbxContainer.appendChild(cbxRow);
        });
        this.domContainer.appendChild(cbxContainer);
        
        // add "new checkbox" button
        let button = ce('div', { "classes" : ['buttons']});
        let inner = ce('div', 
            { 
                "classes" : [ 'IconSmall', 'fa-plus-circle'],
                "listeners": [
                    {
                        "event": "click",
                        "callBack": function ( event ) {
                            self.addCheckBox()
                        }
                    }
                ]
            }
        );
        button.appendChild(inner);
        this.domContainer.appendChild(button);
    }

    
    addCheckBox = function () 
    {
        let self = this;
        this.properties.checkBoxes.push(
            {
                "label": "",
                "isCorrect": false
            }
        );
        this.renderMain();
    }
}



class TextBoxElement extends Element 
{
    constructor( parent, displayId, dbId=0, name='', properties='' ) 
    {
        super(parent, "textBox", displayId, dbId, name);
        if (!properties){
            properties = {
                "textBox": {
                    "content": "Start writing something"
                }
            };
        }
        this.properties = properties;
        this.linkDomContainer();
        this.domContainer.classList.add("element");
        this.domContainer.classList.add("list-group-item");
    }

    renderMain = function () 
    {
        let self = this;

        self.resetDomContainer();
       
        if (!self.domContainer.classList.contains("ck"))
        {
            let div = ce('div');
            InlineEditor
                .create( div )
                .catch( error => {
                    console.error( error );
                } 
            );
            div.innerHTML = this.properties.textBox.content;
            self.domContainer.appendChild(div);
            console.log(" domcontainer ", self.domContainer);
            self.domContainer.addEventListener(
                'blur' , 
                function ( event ){
                    console.log('in blur in text box');
                    // save the content to the data file
                    self.properties.textBox.content = event.target.innerHTML;
            }, true);
        }
        
    }

    renderEdit = function() 
    {
        let self = this;
    }
}




class ImageElement extends Element 
{
    constructor( parent, displayId = 0, dbId=0, name='', properties='' ) 
    {
        super(parent, "image", displayId, dbId, name);
        if (!properties){
            properties = {
                "image": {
                    "title": "this is a title",
                    "friendSource": ""
                }
            };
        }
        this.properties = properties;
        this.linkDomContainer();
        this.domContainer.classList.add("element");
        this.domContainer.classList.add("list-group-item");
    }

    renderMain = function () 
    {
        let self = this;
        this.domContainer.innerHTML = "";

        self.domContainer.addEventListener(
            "click",
            function _clickRenderEdit ( event ) {
                self.renderEdit();
                self.domContainer.removeEventListener(
                    "click",
                    _clickRenderEdit
                );
            }
        );

        let cdn = new Array();

        cdn.push(ce(
            'div',
            {
                "text" : self.properties.image.title
            }
        ));
        
        // image
        cdn.push(ce(
            'img',
            {
                "attributes" : {
                    "src": getImageUrl(self.properties.image.friendSource),
                    "data-friend-source": self.properties.image.friendSource
                }
            }
        ));
        setDomChildren(this.domContainer, cdn);
    }

    renderEdit = function() 
    {
        let self = this;
        this.domContainer.className = "element";
        this.domContainer.classList.add("elementEdit");
        this.domContainer.innerHTML = "";

        let cdn = new Array();

        cdn.push(ce(
            'span',
            {
                "text": "Edit image:"
            }
        ));
                
        // title
        cdn.push(ce(
            'input',
            {
                "attributes" : {
                    "type": "text",
                    "value": self.properties.image.title
                },
                "classes": [
                    'imageTitle'
                ]
            }
        ));

        cdn.push(ce(
            'input',
            {
                "attributes" : {
                    "type": "input",
                    "value": self.properties.image.friendSource
                },
                "classes": [
                    'imageSrc'
                ],
                "listeners": [{
                    "event": "click",
                    "callBack": function ( event ) {
                        let d = new Filedialog({
                            triggerFunction: function( items )
                            {
                                event.target.value = items[0].Path;
                            },
                            path: "Mountlist:",
                            type: "load",
                            title: "My file dialog",
                            filename: ""
                        });
                    }
                }]
            }
        ));
        cdn.push(ce(
            'button',
            {
                "text": "Save",
                "listeners": [
                    {
                        "event": "click",
                        "callBack": function ( event ) {
                            self.saveEditElement();
                        }
                    }
                ]
            }
        ));
        setDomChildren(this.domContainer, cdn);
    }

    saveEditElement = function() 
    {
        let self = this;
        
        // image title
        let imageTitle = self.domContainer.querySelector('.imageTitle');
        self.properties.image.title = imageTitle.value;

        // image source
        let imageSource = self.domContainer.querySelector('.imageSrc');
        self.properties.image.friendSource = imageSource.value;

        // render main after data is changed
        setTimeout( function(){
            self.renderMain()
        }, 1);
    }
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
            console.log("in dbio ", returnCode, returnData);
            if (callBack)
                callBack( returnCode, returnData );
        }
        console.log( 'Let\'s query module: ', self.type, {
            appName: self.appName,
            command: funcName,
            vars: vars
        } );
        
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
            {},
            function ( code, data ) {
            	if( data.substr( 0, 1 ) == '{' || data.substr( 0, 1 ) == '[' )
	                console.log("this is the course table", JSON.parse(data));
	            else console.log( 'response from call: ' + data );
                self.processData(data, courseId);
            }
        );
    }

    // Creates a new course in the database
    createNewCourse = function ( displayId = 0, callBack )
    {
        let self = this;
        // Creates a new course that can be saved
        let course = new CourseElement(self);
        // Creates a new section element that can be saved
        let section = new SectionElement(course);
        // Creates a new page element that can be saved
        let page = new PageElement(section);
        // Save course into the database
        course.save( function( data1 ){
            course.dbId = data1;
            course.displayId = displayId;
            // Save the section in the database
            section.save( function ( data2 ){
                section.dbId = data2; 
                section.displayId = 0;
                // Save the page in the database
                page.save( function ( data3 ){
                    page.dbId = data3;
                    page.displayId = 0;
                    if ( typeof(callBack) == "function" ) {
                        console.log('after all the callbacks');
                        callBack();
                    }
                });
            });
        })
        return course;
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
        console.log(" in the beginning ", self.children);
        try
        {
            let pageRows = JSON.parse(data);
            pageRows.forEach( r => {
                if (r.courseID != courseId)
                    return;
                console.log("r is", r);
                console.log("in the beginning what is children", self.children);
                
                // Set project name
                if( self.children && self.children.length && self.children[0].name )
                {
                	ge( 'ProjectName' ).innerHTML = self.children[0].name;
                }
                else
                {
                	ge( 'ProjectName' ).innerHTML = 'Unnamed project';
                }
                
                // Course
                let c = self.children[r.courseDisplayID];
                console.log(" root children ", self.children);
                console.log(" c", c);
                if ( typeof(c) == "undefined" ){
                    console.log("created new course", r);
                    c = new CourseElement(
                            self,
                            r.courseDisplayID,
                            r.courseID,
                            r.courseName
                        );
                }
                // Section
                let s = c.children[r.sectionDisplayID];
                if ( typeof(s) == "undefined" && r.sectionID != null ){
                    console.log(r);
                    s = new SectionElement(
                            c, 
                            r.sectionDisplayID, 
                            r.sectionID,
                            r.sectionName 
                        );
                }
                // Page
                let p = s.children[r.pageDisplayID];
                if ( typeof(p) == "undefined" && r.pageID != null ){
                    p = new PageElement(
                            s,
                            r.pageDisplayID,
                            r.pageID,
                            r.pageName
                        );
                }
            });
            courseCreator.loadStatus.finished += 1;
        }
        catch( e )
        {
            console.log( 'Bad error', e );
        }
        if( courseCreator.onReady )
            courseCreator.onReady( courseCreator.loadStatus );
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
            if (v.group == "element") {
                courseCreator.toolboxView.appendChild(ce(
                    "div",
                    {
                        "attributes": {
                            "data-element-type": v.elementType,
                            "draggable": "true"
                        },
                        "text": '&nbsp;' + v.displayName,
                        "classes": ["elementType", "IconSmall", "fa-" + this.getElementTypeIcon( v.elementType )],
                        "listeners": [
                            {
                                "event": "dragstart",
                                "callBack": dragToolbox
                            }
                        ]
                    }
                ));
            }
        });
    }

    renderProperties = function()
    {
        let self = this;

        // create HTML
        let div = ce('div', { "classes": ["properties"]});
        
        // Type of element
        let typeDiv = ce('div');
        let typeLabel = ce('label',
            { 
                "text": "Type:",
                "attributes": {
                    "for": "elementType"
                }
            }
        );
        let typeField = ce('input',
            {
                "attributes": {
                    "type": "text",
                    "name": "elementType",
                    "readonly": "readonly"
                }
            }
        );
        typeDiv.appendChild(typeLabel);
        typeDiv.appendChild(typeField);
        div.appendChild(typeDiv);

        // Name form
        let nameDiv = ce('div');
        let nameLabel = ce('label',
            {
                "text": "Name:",
                "attributes": {
                    "for": "propertyName"
                }
            }
        );
        let nameInput = ce('input',
            {
                "attributes": {
                    "type": "text",
                    "name": "propertyName"
                }
            }
        );
        nameDiv.appendChild(nameLabel);
        nameDiv.appendChild(nameInput);
        div.appendChild(nameDiv);

        // buttons
        let outerDiv = ce('div', { "classes": ["right"]});
        let buttonDiv = ce('div',{ "classes": ["buttons"]});
        let buttons = ce('span');
        let deleteButton = ce('button',
            {
                "text": "Delete",
                "attributes": {
                    "name": "deleteButton"
                },
                "classes": [ "IconSmall", "fa-remove" ],
                "listeners": [{
                    "event": "click",
                    "callBack": function (event)
                    {
                        //TODO: does not fall back on a particular section
                        if (event.target.eleRef)
                        {
                            event.target.eleRef.delete();
                            self.renderIndex();
                            self.renderMain();
                        }
                    }
                }]
            }
        );
        let saveButton = ce('button',
            {
                "text": "Save",
                "attributes": {
                    "name": "saveButton"
                },
                "classes": [ "IconSmall", "fa-save" ],
                "listeners": [{
                    "event": "click",
                    "callBack": function (event) {
                        console.log("what is event", event.target);
                        // does not remember the highlighted
                        if (event.target.eleRef)
                        {
                            let name = courseCreator.propertiesView
                                            .querySelector(
                                                '[name="propertyName"]'
                                            ).value;
                            event.target.eleRef.name = name;
                            event.target.eleRef.save();
                            self.renderIndex();
                        }
                    }
                }]
            }
        );
        buttons.appendChild(deleteButton);
        buttons.appendChild(saveButton);
        buttonDiv.appendChild(buttons);
        outerDiv.appendChild(buttonDiv)
        div.appendChild(outerDiv);

        self.parent.propertiesView.replaceChildren();
        self.parent.propertiesView.appendChild(div);

    }


    renderIndex = function ()
    {
        let self = this;

        let setActiveClass = function (domEle)
        {
            // remove all .Active classes
            let actives = courseCreator.indexView.querySelectorAll('.Active');
                Array.from(actives).forEach( e => {
                    e.classList.remove('Active');
                });
                domEle.classList.add('Active');
        }
        
        let setProperties = function ( ele )
        {
            let elementType = self.parent.propertiesView.querySelector(
            	'[name="elementType"]'
            );
            elementType.value = ele.classInfo.displayName;

            let propertyName = self.parent.propertiesView.querySelector(
                '[name="propertyName"]'
            );
            propertyName.value = ele.name;

            // set the event listener
            let deleteButton = self.parent.propertiesView.querySelector(
                '[name="deleteButton"]'
            );
            deleteButton.eleRef = ele;

            let saveButton = self.parent.propertiesView.querySelector(
                '[name="saveButton"]'  
            );
            saveButton.eleRef = ele;
        }

        // make Li Element
        let makeLiElement = function( ele, type )
        {
        	if( !type ) type = '';
            let li = ce("li");           
            // element index text
            let div = ce("div");
            let icon = type == 'page' ? 'fa-file-text-o' : ( type == 'section' ? 'fa-bookmark-o' : '' );
            let num = ( parseInt( ele.displayId ) + 1 ) + '';
            if( num.length < 2 )
            	num = '0' + num;
            let text = ce(
                "span",
                { 
                    "text": ( icon ? '&nbsp;' : '' ) + num + ". " + ele.name,
                    "classes": [ 'IconSmall', icon ],
                    "listeners": [
                        {
                            "event": "click",
                            "callBack": function ( event ){
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
                                setProperties(ele);
                            }
                        }
                    ]
                }
            );
            div.appendChild(text);
            li.appendChild(div);
            return li;
        }

        // add to dom
        removeDomChildren(courseCreator.indexView);

        // Add Indexes
        let ul = ce("ul");
        // Courses
        self.children.forEach( c => {
            // Sections
            c.children.forEach( s => {
                let sLi = makeLiElement(s, 'section' );
                sLi.classList.add('SectionIndex');
                let pUl = ce('ul');
                // Pages
                s.children.forEach( p => {
                    let pLi = makeLiElement(p, 'page' );
                    if (pLi)
                    {
                        pLi.classList.add('PageIndex');
                        pUl.appendChild(pLi);
                    }
                });
                sLi.appendChild(pUl);

                // add new page in a section
                let div = ce('div');
                let buttons = ce('div', { 'classes' : ["buttons"] });
                div.appendChild(buttons);
                buttons.appendChild(ce(
                    "span",
                    {
                        "classes": ['IconSmall', 'fa-plus-circle'],
                        "listeners": [
                            {
                                "event": "click",
                                "callBack": function ( event )
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
                                                pUl.appendChild(pLi);
                                                setActiveClass(pLi);
                                            }
                                        }
                                    );
                                }
                            }
                        ]
                    }
                ));
                sLi.appendChild(buttons);
                ul.appendChild(sLi);
            });
        });
        courseCreator.indexView.appendChild(ul);

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
                            self.children[0].createNewElement(null, function ( newEle ){
                                newEle.setActive();
                                self.renderIndex();
                                let ss = courseCreator.indexView.querySelectorAll(
                                    '.SectionIndex'
                                );
                                let lastSection = ss[ss.length - 1];
                                console.log('last section', lastSection);
                                setActiveClass(lastSection);
                            });
                        }
                    }
                ]
            }
        );
        span.innerHTML = '&nbsp;New section';
        buttons.appendChild( span );
        div.appendChild(buttons);
        courseCreator.indexView.appendChild(div);
    }

}


class CourseCreator
{
    constructor() 
    {
		// Define views
        this.mainView = ge('main');
        this.indexView = ge('index');
        this.toolboxView = ge('toolbox');
        this.propertiesView = ge('properties');

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
    
        // render main
        this.manager.renderMain();

        // render toolbox
        this.manager.renderToolbox()

        // render properties
        this.manager.renderProperties();

    }

	// Initializes the course
    initialize()
    {
        this.render();

        // set active to first child
        let firstPage = this.indexView.querySelector( '.PageIndex' );
        if( firstPage )
        {
            firstPage.classList.add("Active");
        }

        // set view button event handler
        ge('viewButton').addEventListener(
            "click",
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

    }
    
    setActivePanel( panel )
    {
    	let panels = [ 'SectionsPanel', 'ToolboxPanel', 'PropertiesPanel', 'LibraryPanel' ];
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
