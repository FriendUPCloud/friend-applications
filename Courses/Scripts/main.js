/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg )
{
    // if msg.classroomId
    // loadClassroom(msgclassroomdi)
    refreshGroups();
    refreshClassrooms();

    // take away: for now load in course automatically 1
    setTimeout( function () {
            ge('MainContainer').classList.add('CourseMode');
            ge('MainContainer').classList.remove('WelcomeMode');
            
            // Assume userClassroomId, classroomId and courseId 
            // are read into the on click function in the 
            // classroom list
            // loadUserClassrom( userClassroomId, classroomId, courseId)
            // TODO: can clean up but works 

            loadUserClassroom(1, 1, 1); 
        }, 1000 
    );
}

function refreshGroups()
{
    let m = new Module( 'system' );
    m.onExecuted = function( e, d )
    {
        ge( 'WGroups' ).innerHTML = 'You are not member of any groups.';
    }
    m.execute('');
}

function refreshClassrooms()
{
    let m = new Module( 'system' );
    m.onExecuted = function( e, d )
    {
        // if e is empty
        console.log("return from module ", e, d);
        ge( 'WCourses' ).innerHTML = d;
    }
    m.execute( 'appmodule' ,{
        appName: "CourseCreator",
        command: "getClassroomList",
        vars: { nothing: "nothing" }
    } );
}


/****
*
*  Copy below and keep in sync with apps/CourseCreator/Scripts/courseviewer.js
*/


// Load the viewer.html into the Course div
// and load a course into the course viewer
function loadUserClassroom( userClassroomId, classroomId, courseId) {
    
    // load html into the Course panel    
    let f = new File("Progdir:Assets/viewer.html");
    f.onLoad = function( data ){

        // set the course html on the Course div
        ge('Course').innerHTML = data;
        
        // set the views now that we have the viewer html loaded
        courseViewer.indexView = ge('index');
        courseViewer.mainView = ge('main');

        // set the ids for the userClassroom and classroom
        courseViewer.userClassroomId = userClassroomId;
        courseViewer.classroomId = classroomId;
        courseViewer.courseId = courseId;

        // load the course into the viewer html
        courseViewer.loadCourse( courseId );
    };
    f.load();
}


// Create DOM Element abstraction
let ce = function(type,
                  {
                    "text": text = "",
                    "ckEditor": ckEditor = false,
                    "attributes": attributes = {},
                    "classes": classes =  [],
                    "listeners": listeners = []
                   }={}){

    let e = document.createElement(type);
    
    // Add attributes
    for ( let [k, v]  of Object.entries(attributes) ) {
        e.setAttribute(k, v);
    }
    
    // Add text
    e.innerHTML = text;
    
    // Add classes
    classes.forEach( c => {
        e.classList.add( c );
    });

    // Make CK Editor
    if (ckEditor == true){
        InlineEditor
            .create( e )
            .catch( error => {
                console.error( error );
                } 
            );
    }

    // Add event listeners
    listeners.forEach( l => {
        //console.logr(l);
        e.addEventListener(
            l.event,
            l.callBack,
            (l.options) ? l.options : null
        );
    });
    
    return e;
}


let removeDomChildren = function (domEle) {
    while (domEle.firstChild) {
        domEle.firstChild.remove();
    }
}

let setDomChildren = function (domEle, domChildren) {
    //removeDomChildren(domEle);
    domChildren.forEach( domChild => {
        domEle.appendChild(domChild);
    });
}

function allowDrop(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "copy";
}

function dragToolbox(ev) {
    //console.log(ev);
    ev.dataTransfer.setData("text", ev.srcElement.dataset.elementType);
    ev.dataTransfer.setData("isNew", true);
    ev.dataTransfer.dropEffect = "copy";
}

function drop(ev) {
    ev.preventDefault();
    console.log();

    if ( ev.dataTransfer.getData("isNew") ) {
        let elementType = ev.dataTransfer.getData("text");

        // drop in Page (only element that has a createNewElement function)
        let ele = ev.target.elementRef;
        if ( (typeof(ele) != "undefined") 
            && (typeof(ele.createNewElement) == "function") )
            ele.createNewElement(elementType, function() {
                    ele.sortElements();
            });
            
    }

}

function endDrag(ev){
    ev.preventDefault();
}

// general EventListeners
document.addEventListener('dragover', allowDrop);
document.addEventListener('drop', drop );



Application.receiveMessage = function( msg )
{
    // Don't treat noisy messages that do not adhere to our spec
    if( !msg.command ) return;
    
    // Ah we got our message!
    if( msg.command == 'save' )
    {
        courseViewer.manager.saveActivePage();
    }

    if( msg.command == 'loadCourse' )
    {
        console.log('received message ', msg );
        courseViewer.loadCourse( msg.courseId );
    }

    if( msg.command == 'loadClassroom' )
    {
        console.log('received message ', msg );
        courseViewer.loadClassroom( msg.classroomId );
    }
}

/* IO Classes / this will be section
*
*  Provides database interface for the elements
*/
class CourseCollection {
    constructor ( courseViewer ){
        this.courseViewer = courseViewer;
    }
}


/* Composite classes
*
*  implements: renderHtml( context )
*/
//TODO: rewrite to capture indexing id vs index
class Element{
    constructor( parent, elementType, displayId=null, dbId=null, name="untitled") {
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
        this.name = name;

        // Reference to element class information
        this.classInfo = registeredElements.get(elementType);

        // Add child to parents children if exists
        if (! ( typeof(this.parent.children) == "undefined") ) {
            console.log("adding to parent");
            this.parent.children.push(this);
        }

        // Initialize element properties
        this.domContainer = null;
        this.children = new Array();
        this.activeChild = null;

        // Is complete flag
        this.isComplete = false;

        console.log("this is self ",this);
    }

    resetDomContainer = function(){
        this.domContainer.replaceChildren();
    }

    linkDomContainer = function(domContainer=null){
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

    setActive = function(){
        let self = this;
        self.parent.activeChild = self;
        if (typeof(self.parent.setActive) != "undefined")
            self.parent.setActive();
        if (!self.children.includes(self.activeChild))
            self.activeChild = self.children[0];
    }

    checkComplete = function(){
        return true;
    }

    createDomContainer = function(){
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
                ]
            }
        );
        return ele;
    }

    createNewElement = function(elementType=null, callBack=null){
        let self = this;
        let displayID = self.children.length;
        if (!elementType)
            elementType = self.classInfo.childType;
        console.log(' in the create new element', displayID, elementType);
        let cls = registeredElements.get(elementType).class;
        let ele = new cls(self, displayID);
        ele.save(function( data ){
            console.log(" in the save function call back ", data);
            console.log(" this is ele ", ele);
            ele.dbId = data;
            ele.renderMain();
            if (typeof(callBack) == "function"){
                callBack(ele);
            }
            return ele;
        });
    }

    // Save progress on elements in a class room
    saveState = function ( callBack ){
        console.log("Nothing to save on normal fields");
    }

    // creates id on ID is given
    // updates / saves on ID if given
    // should be updated to be element sensitive.
    save = function(callBack){
        let params = {
            table: this.classInfo.dbTable,
            ID: this.dbId,
            DisplayID: this.displayId,
            Name: this.name,
            Properties: JSON.stringify(this.properties),
            PageID: this.parent.dbId,
            ElementTypeID: this.classInfo.elementTypeId
        };
        console.log("Update table ", params);
        courseViewer.dbio.call(
            'updateTable',
            params,
            function ( code, data ) {
                if (callBack)
                    callBack( data );
            }
        );
    }

    delete = function () {
        let self = this;
        let params = {
            table: this.classInfo.dbTable,
            ID: this.dbId
        };
        console.log("Delete table ", params);
        if (!Confirm("Warning - Permantly delete", "Proceed?"))
            return

        let dId = self.displayId;
        if (dId >= 1)
        {
            self.parent.activeChild = self.parent.children[dId - 1]
        }
        self.parent.children = self.parent.children.filter( e => e !== self );
        if (self.parent.domContainer)
            self.parent.domContainer.remove(
                self.domContainer
        );
        courseViewer.dbio.call(
            'deleteRow',
            params,
            function ( code, data ) {
                self.parent.renderMain();
                courseViewer.manager.renderIndex();
            }
        );
    }

    renderMain = function (){
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
class CourseElement extends Element {
    constructor(parent, displayId, dbId, name){
        super(parent, "course", displayId, dbId, name);
    }

    createSection = function(){
        let cls = registeredElements.get("page").class;
        let s = new cls(this);
        s.save();
        courseViewer.manager.renderIndex();
        s.renderMain();
    }
}


class SectionElement extends Element {
    constructor( parent, displayId=null, dbId=null, name="untitled") {    
        super(parent, "section", displayId, dbId, name); 
        this.linkDomContainer(courseViewer.mainView);
    }

    save = function(callBack){
        let params = {
            table: this.classInfo.dbTable,
            ID: this.dbId,
            Name: this.name,
            DisplayID: this.displayId,
            CourseID: this.parent.dbId,
            ElementTypeID: this.classInfo.elementTypeId
        };
        console.log("Update table ", params);
        courseViewer.dbio.call(
            'updateTable',
            params,
            function ( code, data ) {
                if (callBack)
                    callBack( data );
            }
        );
    }
}

class PageElement extends Element{
    constructor(parent, displayId, dbId, name){
        super(parent, "page", displayId, dbId, name);
        this.linkDomContainer();
        this.domContainer.hidden = true;
    }

    /*
    *   Adds an already existing element to a page
    *
    */
    sortElements = function(){
        let self = this;
        let sortedElements = new Array();
        let domElements = this.domContainer.getElementsByClassName('element');
        Array.from(domElements).forEach( ( de, i ) => {
            de.elementRef.displayId = i;
            de.dataset.displayId = i;
            sortedElements.push(de.elementRef);
        });
        self.children = sortedElements;
    }

    loadElementState = function () {
        for (let c of this.children){
            if( typeof(c.loadState) == "function"){
                c.loadState();
            }
        }
    }

    loadElements = function ( callBack ) {
        let self = this;
        courseViewer.dbio.call(
            'getSectionData',
            {
                sectionId: self.parent.dbId,
                pageId: self.dbId
            },
            function ( code, data ) {
                if ( code == "fail" ){
                    console.log("In fail callback");
                    if (callBack)
                        callBack();
                }
                let elementRows = JSON.parse(data);
                console.log("this is element rows ", elementRows);
                elementRows.forEach( r => {
                    let cls = registeredElements.get(r.elementType).class;
                    new cls(
                        self,
                        r.elementDisplayID,
                        r.elementID,
                        r.elementName,
                        r.elementProperties
                    );
                });
                callBack();
            }
        );
    }






    save = function(callBack){
        let params = {
            table: this.classInfo.dbTable,
            ID: this.dbId,
            DisplayID: this.displayId,
            Name: this.name,
            SectionID: this.parent.dbId,
            ElementTypeID: this.classInfo.elementTypeId
        };
        console.log("Update table ", params);
        courseViewer.dbio.call(
            'updateTable',
            params,
            function ( code, data ) {
                if (callBack)
                    callBack( data );
            }
        );
    }

    saveElements = function ( callBack ) {
        let self = this;
        console.log("in page", self.displayId);
        self.children.forEach( e => {
            console.log("Saving element ", e.displayId);
            e.save();
        });
    }

    // overloads rendermain
    renderMain = function(){
        let self = this;
        self.domContainer.hidden = false;
        let pageElements = self.parent.domContainer.getElementsByClassName(
            'page'
        );
        Array.from(pageElements).forEach( pEle => {
            if (pEle !== self.domContainer){
                console.log("not self ", pEle.elementRef.elementType, pEle.elementRef.displayId);
                pEle.hidden = true;
            }
        });

        // empty all elements from page 
        self.domContainer.replaceChildren();
        
        // load new elements
        self.loadElements(function (){
            self.children.forEach( e => {
                e.renderMain();
            });
            // add in buttons
            let np = createNextPrevious();
            self.domContainer.appendChild(np);

            // load state
            if (courseViewer.userClassroomId){
                console.log("loading state")
                self.loadElementState();
            }
        });
            
        let createNextPrevious = function (){
            // create next and back button
            let div = ce('div', { "classes" : ["buttons"]});
            let divPrevious = ce('div',
                { 
                    "text": "Back",
                    "listeners": [
                        {
                            "event": "click",
                            "callBack": function () {
                                let idx = self.parent.children.indexOf(self);
                                
                                if (idx > 0){
                                    self.parent.activeChild = self.parent.children[idx - 1];
                                    self.parent.renderMain();
                                }
                                console.log("in previous page");
                            }
                        }
                    ]
                }
            );
            let divNext = ce('div',
                { 
                    "text": "Submit",
                    "listeners": [
                        {
                            "event": "click",
                            "callBack": function ( event ) {
                                for (let e of self.children){

                                    console.log(' element ', e.dbId);

                                    // Check if the element is complete
                                    if ( e.checkComplete() == false ) {
                                        Alert(
                                            'Cannot progress to next page',
                                            'Please complete all the questions'
                                        );
                                        console.log('Exit not all elements done');
                                        return false;
                                    }
                                }

                                console.log("All filled in so lets save");
                                // Only reach this is all elements are passed
                                // Ie. no save progress if not all elements done
                                // lets tweak later
                                for (let e of self.children){
                                    e.saveState();
                                }

                                // Go to next page is there is one
                                let idx = self.parent.children.indexOf(self);
                                if (idx < self.parent.children.length - 1){
                                    self.parent.activeChild = self.parent.children[idx + 1];
                                    self.parent.renderMain();
                                }
                            }
                        }
                    ]
                }
            );
            div.appendChild(divPrevious);
            div.appendChild(divNext);
            return div;
        }

        // create save state
        self.sortElements();
        self.parent.activeChild = self;

    }
}

class CheckBoxQuestionElement extends Element {
    constructor( parent, displayId, dbId=null, name=null, properties=null ) {
        super(parent, "checkBoxQuestion", displayId, dbId, name);
        if (!properties){
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

        // Keep track of state of elements
        this.points = 0;
        this.pointsPossible = 0;
    }

    // Checks if element is complete
    // and registers if the answer is correct
    checkComplete = function(){
        let self = this;
        
        // set flags
        let isComplete = false;
        let points = 0;
        let pointsPossible = 0;

        // get all the checkboxes
        let checkBoxes = this.domContainer.querySelectorAll('.checkBoxRow');
        
        // loop over all the checkboxes in the properties
        for ( let [i, cbx] of checkBoxes.entries() ) {

            // find the tick and label
            let tick = cbx.querySelector('.checkBoxTick');
            let label = cbx.querySelector('.checkBoxLabel');

            // check that we have a tick and a label
            if (!tick || !label){
                console.log("Could not locate tick or label skip");
                continue;
            }

            // check if at least one check is checked
            if (tick.checked){
                isComplete = true;
            }

            // for each right option
            if (self.properties.checkBoxes[i].isAnswer){
                pointsPossible += 1;
                // increment the point if the box is ticked
                if (tick.checked == true)
                    points += 1;
            }
            // for each wrong option
            else{
                // do nothing currently
                // no minus points 
            }

        }

        // set the flags on the element object
        self.points = points;
        self.pointsPossible = pointsPossible;
        self.isComplete = isComplete;

        // return the isComplete flag
        return isComplete;
    }

    // Save the state of the checkBox
    saveState = function( callBack ){
        let self = this;

        // define the answer state json to store question answer blob
        let answer = {
            question: "",
            checkBoxes: []
        };

        // get the question
        let question = self.domContainer
                            .querySelector('.checkBoxQuestion' )
                            .textContent;
        answer.question = question;


        // get the check box row
        let checkBoxes = this.domContainer.querySelectorAll('.checkBoxRow');

        // loop through the checkboxes 
        for ( let cbx of checkBoxes){

            // find the tick and label of each check box in DOM
            //TODO: save the question also!!!!!
            
            let tick = cbx.querySelector('.checkBoxTick');
            let label = cbx.querySelector('.checkBoxLabel');

            // if for some reason they are not found then skip
            if (!tick || !label){
                console.log('Error could not find a tick and label');
                continue;
            }
            // push the values to the answer array
            answer.checkBoxes.push({
                "isChecked": tick.checked,
                "label": label.textContent
            });
        }

        // make a state variable combining the question and the answer
        // TODO: support changing the order of questions
        let state = {
            properties: self.properties,
            answer : answer
        };


        // save the state to disk
        // TODO: does not support saving to disk unfinished pages
        let params = {
            table: "CC_UserClassroomElement",
            UserClassroomID: courseViewer.userClassroomId,
            ElementID: this.dbId,
            State: JSON.stringify(state),
            Points: self.points,
            PointsPossible: self.pointsPossible,
            IsComplete: self.isComplete ? "1" : "0"
        }
        courseViewer.dbio.call(
            'updateLoadTable',
            params,
            function (code, data ){
                if (callBack)
                    callBack( data );
            }
        )
    }

    // loop through elements in view and set state
    // if state is in CC_UserClassroomElements
    loadState = function (){
        let self = this;

        // get state from database
        courseViewer.dbio.call(
            'getTable',
            { 
                table: "CC_UserClassroomElement",
                ElementID: this.dbId,
                UserClassroomID: courseViewer.userClassroomId
            },
            function( code, data ){
                console.log('in callback', data);
                self.renderState( JSON.parse(data));
            }
        );
    }

    // render the state to the element
    renderState = function( data ) {
        // parse state
        let state = JSON.parse(data.State);

        // get the domElement and checkBoxes
        let ticks = this.domContainer.querySelectorAll('.checkBoxTick');
        
        // here we rely on matching checkboxes
        // by order in the arrays and the dom list.
        // TODO: improve with an ID on the checkBoxes
        Array.from(ticks).forEach( (c, i) => {
            if (typeof(state.answer.checkBoxes[i].isChecked) == "boolean"){
                c.checked = state.answer.checkBoxes[i].isChecked;
            }
        });
    }

    renderMain = function(){

        //console.logr("in render main");
        let self = this;

        this.resetDomContainer();
       
        // Question:
        let question = ce(
            "span",
            { 
                "text": this.properties.question,
                "classes": ["checkBoxQuestion"]
            }
        );
        this.domContainer.appendChild(question);
        
        // Checkboxes
        let cbxContainer = ce('div');
        this.properties.checkBoxes.forEach( cbx => {
            console.log('check box', cbx, "element", this);
            let cbxRow = ce('span', { "classes": ['checkBoxRow']});
            
            // Checkbox input
            let cbxInput = ce( 
                "input",
                {
                    "attributes": {
                        "type":"checkBox"
                    },
                    "classes": ['checkBoxTick']
                }
            );
        
            // Checkbox label
            let cbxLabel = ce(
                "span",
                { 
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
            cbxRow.appendChild(cbxInput);
            cbxRow.appendChild(cbxLabel);
            cbxContainer.appendChild(cbxRow);
        });
        this.domContainer.appendChild(cbxContainer);
    }

    addCheckBox = function () {
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



class TextBoxElement extends Element {
    constructor( parent, displayId, dbId=null, name=null, properties=null ) {
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
    }

    renderMain = function () {
        let self = this;

        self.resetDomContainer();
       
        if (!self.domContainer.classList.contains("ck")){
            let div = ce('div');
            div.innerHTML = self.properties.textBox.content;
            self.domContainer.appendChild(div);
        }
        
    }

    renderEdit = function() {
        let self = this;
    }
}




class ImageElement extends Element {
    constructor( parent, displayId, dbId=null, name=null, properties=null ) {
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

    renderMain = function () {
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

    renderEdit = function() {
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

    saveEditElement = function() {
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

class DBIO{
    constructor(moduleName, appName, type="appmodule"){
        this.moduleName = moduleName;
        this.appName = appName;
        this.type = type;
    }
    call = function(funcName, vars, callBack){
        let self = this;
        let m = new Module ( self.moduleName );
        m.onExecuted = function ( returnCode, returnData )
        {
            // add check for OK return code
            console.log("in dbio ", returnCode, returnData);
            if (callBack)
                callBack( returnCode, returnData );
        }
        m.execute( self.type, {
            appName: self.appName,
            command: funcName,
            vars: vars
        });
    }
}

class ElementTypeIO {
    constructor(courseViewer) {
        this.courseViewer = courseViewer;
        this.data = null;
        this.elementTypes = null;
        this.loadElementTypeData();
    }

    createElementTypeMap = function(){
        let self = this;
        self.elementTypes = new Map();
        self.data.forEach( et => {
            self.elementTypes.set(et.Name, et);
        });
    }

    loadElementTypeData= function(){
        let self = this;
        let types = self.courseViewer.dbio.call(
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
            self.courseViewer.loadStatus['finished'] += 1;
        }
        catch( e )
        {
            console.log( 'Bad error', e );
        }
        if( self.courseViewer.onReady )
            self.courseViewer.onReady( self.courseViewer.loadStatus );
    }
}


class RootElement extends Element{
    constructor(courseViewer){
        super(courseViewer, "root");
        this.activePage = null;
    }

    loadClassroomData = function( classroomId ){
        let self = this;
        courseViewer.dbio.call(
            'getClassroom',
            {
                classroomId: classroomId
            },
            function ( code, data ) {
                self.processClassroomData(data);
            }
        );
    }

    processClassroomData = function( data, classroomId){
        let self = this;
        console.log(data);
    }

    loadCourseData = function( courseId ){
        let self = this;
        courseViewer.dbio.call(
            'getCourseList',
            {},
            function ( code, data ) {
                console.log("this is the course table", JSON.parse(data));
                self.processCourseData(data, courseId);
            }
        );
    }

    // save the current class room status
    // for the active page
    saveState  = function(){
        let pageElements = (
            courseViewer
                .mainView
                .getElementsByClassname('.page')
        );
        Array.from(pageElements).forEach( e => {
            if ( !e.hidden )
                e.elementRef.saveState();
        });
    }


    saveActivePage = function(){
        let pageElements = (
            courseViewer
                .mainView
                .getElementsByClassName('page')
        );
        Array.from(pageElements).forEach( e => {
            if ( !e.hidden )
                e.elementRef.saveElements();
        });
    }

    processCourseData = function( data, courseId ){
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
            courseViewer.loadStatus.finished += 1;
        }
        catch( e )
        {
            console.log( 'Bad error', e );
        }
        if( courseViewer.onReady )
            courseViewer.onReady( courseViewer.loadStatus );
    }

    // Render of toolbox menu is the same for all elements
    renderToolbox = function(){
        let self = this;
        removeDomChildren(courseViewer.toolboxView);
        registeredElements.forEach( ( v, k ) => {
            console.log( "what is name and classinfo", k , v);
            if (v.group == "element") {
                courseViewer.toolboxView.appendChild(ce(
                    "div",
                    {
                        "attributes": {
                            "data-element-type": v.elementType,
                            "draggable": "true"
                        },
                        "text": v.displayName,
                        "classes": ["elementType"],
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

   
    renderIndex = function (){
        let self = this;

        let setActiveClass = function (domEle){
            // remove all .Active classes
            let actives = courseViewer.indexView.querySelectorAll('.Active');
                Array.from(actives).forEach( e => {
                    e.classList.remove('Active');
                });
                domEle.classList.add('Active');
        }


        let setProperties = function ( ele ){
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
        let makeLiElement = function( ele ){
            let li = ce("li");           
            // element index text
            let div = ce("div");
            let text = ce(
                "span",
                { 
                    "text": ele.displayId + " " + ele.name,
                    "attributes": {
                        "data-display-id": ele.displayId,
                        "data-db-id": ele.dbId,
                        "data-element-type": ele.elementType
                    },
                    "listeners": [
                        {
                            "event": "click",
                            "callBack": function ( event ){
                                event.stopPropagation();
                                ele.setActive();
                                ele.renderMain();
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
            if (self.isComplete)
                text.classList.add('Complete');

            div.appendChild(text);
            li.appendChild(div);
            return li;
        }

        // add to dom
        removeDomChildren(courseViewer.indexView);

        // Add Indexes
        let ul = ce("ul");
        // Courses
        self.children.forEach( c => {
            // Sections
            c.children.forEach( s => {
                let sLi = makeLiElement(s);
                sLi.classList.add('SectionIndex');
                let pUl = ce('ul');
                // Pages
                s.children.forEach( p => {
                    let pLi = makeLiElement(p);
                    if (pLi)
                        pLi.classList.add('PageIndex');
                    pUl.appendChild(pLi);
                    sLi.appendChild(pUl);
                });
                ul.appendChild(sLi);
            });
        });
        courseViewer.indexView.appendChild(ul);
    }

}


class CourseViewer{
    constructor() {

        console.log("Starting to define courseViewer");

        //classroomId
        this.classroomId = null;

        // Define views
        this.mainView = ge('main');
        this.indexView = ge('index');
        // this.toolboxView = ge('toolbox');
        // this.propertiesView = ge('properties');

        // IO class
        this.dbio = new DBIO('system', 'CourseCreator');
        
        // Element manager
        this.manager = new RootElement(this);

        // set properties definining the class room
        this.userClassroomId = null;
        this.classroomId = null;
        this.courseId = null;

    }

    loadClassroom = function( classroomId )
    {
        this.classroomId = classroomId;
        this.loadStatus = {
            "jobs": 1,
            "finished": 0
        };
        this.manager.loadClassroomData( this.classroomId );
    }

    loadCourse = function( courseId ){
        this.loadStatus = {
            "jobs": 1,
            "finished": 0
        };
        this.manager.loadCourseData( courseId );
    }

    render = function(){
        // render index
        this.manager.renderIndex();
    
        // render main
        this.manager.renderMain();

        // render toolbox
        //this.manager.renderToolbox()

        // render properties
        //this.manager.renderProperties();

    }

    initialize = function(){
        this.render();

        // set active to first child
        this.indexView.querySelector(
            ".PageIndex"
        ).classList.add('Active');
        console.log(" courseViewer object", this);

        // set view button event handler
        // this.mainView.querySelector("#viewButton").addEventListener(
        //     "click",
        //     function( event ){
        //         let v = new View({
        //             title: 'CourseViewer',
        //             width: 1000,
        //             height: 700
        //         });
        //         let f = new File('Progdir:Templates/viewer.html');
        //         f.onLoad = function( data ){
        //             v.setContent( f );
        //         }
        //         f.load();
        //     }
        // );

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
                    displayName: "Checkbox question",
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
courseViewer = new CourseViewer();
// load (courseId)
// courseViewer.load();
// Datas has been loaded, and triggers callback
courseViewer.onReady = function ( loadStatus )
{
    // Initialize course creator based on data
    if ( loadStatus.finished == loadStatus.jobs ){
        console.log("in initialize");
        courseViewer.initialize();
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




Viewer TODO:


DONE Back and forward index buttons dissappear
DONE Back and forward buttons to be always visible


DONE Create form for the check box question (this is important)


DONE - page next should go to next section if on the last page


DONE (courseId) Create load function for classroom
DONE Should not be able to proceed to next page before completed page
DONE Transfer the application to Course

Todo:

DONE - store classroomid or userclassroomid on courseviewer object
DONE - in the viewer when the next button is pushed then save progress for eacch element
DONE is Complete ()

DONE - Save progress function (with class room ID user ID and element ID)
DONE - Store on classroom id and userClassroomId


DONE load state of finished pages etc... how to? in the viewer - when the elements are loaded then if the userClassroomId is set then get the state ( so needs to be question id and if ticket or not ), for a text question is has to the the content


- show state of completion in index
- include a save / or auto save state functionality



- list classrooms
- integrate with user groups



*/  



