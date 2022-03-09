/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/


// UI Checkbox element
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
                            courseCreator.manager.saveActivePage();
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
                                courseCreator.manager.saveActivePage();
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
                                courseCreator.manager.saveActivePage();
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


// UI Textbox element
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
                    courseCreator.manager.saveActivePage();
            }, true);
        }
        
    }

    renderEdit = function() 
    {
        let self = this;
    }
}



// UI Image element
class ImageElement extends Element 
{
    constructor( parent, displayId = 0, dbId=0, name='', properties='' ) 
    {
        super( parent, 'image', displayId, dbId, name );
        if (!properties){
            properties = {
                'image': {
                    'title': 'this is a title',
                    'friendSource': ''
                }
            };
        }
        this.properties = properties;
        this.linkDomContainer();
        this.domContainer.classList.add( 'element' );
        this.domContainer.classList.add( 'list-group-item' );
    }

    renderMain = function () 
    {
        let self = this;
        
        self.resetDomContainer();
        
        if( !this.contentContainer )
        {
        	this.contentContainer = document.createElement( 'div' );
        	this.domContainer.appendChild( this.contentContainer );
        }
        
        this.contentContainer.className = 'elementEdit';
        this.contentContainer.innerHTML = '';

        self.contentContainer.addEventListener(
            'click',
            function _clickRenderEdit ( event ) {
                self.renderEdit();
                self.domContainer.removeEventListener(
                    'click',
                    _clickRenderEdit
                );
            }
        );

        let cdn = new Array();

        cdn.push(ce(
            'div',
            {
                'text' : self.properties.image.title
            }
        ));
        
        // Interpret image
        let src = '';
        let raw = self.properties.image.friendSource;
        if( raw )
        {
	    	src = raw.indexOf( ':' ) > 0 ? getImageUrl( self.properties.image.friendSource ) : ( 'https://' + raw );
		    
		}
        
        // image
        let img = ce(
            'img',
            {
                'attributes' : {
                    'src': src,
                    'data-friend-source': self.properties.image.friendSource
                }
            }
        );
        cdn.push( img );
        setDomChildren( this.contentContainer, cdn );
    }

    renderEdit = function() 
    {
        let self = this;
        
        this.contentContainer.className = 'elementEdit';
        this.contentContainer.innerHTML = '';

        let cdn = new Array();

        cdn.push(ce(
            'span',
            {
                'text': 'Edit image:'
            }
        ));
                
        // Title
        cdn.push( ce(
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
        ) );

        cdn.push( ce(
            'input',
            {
                'attributes' : {
                    'type': 'input',
                    'value': self.properties.image.friendSource
                },
                'classes': [
                    'imageSrc'
                ],
                'listeners': [ {
                    'event': 'click',
                    'callBack': function ( event ) 
                    {
                    	event.stopPropagation();
                        let d = new Filedialog( {
                            triggerFunction: function( items )
                            {
                                event.target.value = items[0].Path;
                                courseCreator.manager.saveActivePage();
                            },
                            path: 'Mountlist:',
                            type: 'load',
                            title: 'Load your image',
                            filename: ''
                        } );
                    }
                } ]
            }
        ) );
        cdn.push(ce(
            'button',
            {
                "text": "Save",
                "listeners": [
                    {
                        "event": "click",
                        "callBack": function ( event ) {
                            self.saveEditElement();
                            courseCreator.manager.saveActivePage();
                        }
                    }
                ]
            }
        ));
        setDomChildren(this.contentContainer, cdn);
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

		// Convert images to Friend images
		console.log( 'Image source: ' + self.properties.image.friendSource );

		courseCreator.manager.saveActivePage();
		
        // render main after data is changed
        setTimeout( function(){
            self.renderMain()
        }, 1 );
    }
}
