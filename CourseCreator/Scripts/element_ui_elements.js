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

    renderMain = function( flags )
    {

        //console.logr("in render main");
        let self = this;

        this.resetDomContainer();
       
        // DOM Elements:
        // Base 64 encoding
	    let tx = this.properties.question;
	    if( tx && this.properties.question.substr( 0, 13 ) == '<!--BASE64-->' )
	    {
	    	tx = tx.substr( 13, tx.length - 13 );
	    	tx = Base64.decode( tx );
	    }
	    
        // Question:
        let question = ce(
            'span',
            { 
                'ckEditor': true,
                'text': tx,
                'classes': [ 'checkBoxQuestion' ],
                'listeners': [
                    {
                        event: 'blur',
                        callBack: function( event ) {
                            self.properties.question = '<!--BASE64-->' + Base64.encode( event.target.innerHTML );
                            courseCreator.manager.saveActivePage();
                        }
                    },
                    {
                        event: 'change',
                        callBack: function( event ) {
                            self.properties.question = '<!--BASE64-->' + Base64.encode( event.target.innerHTML );
                            courseCreator.manager.saveActivePage();
                        }
                    }
                ]
            }
        );
        
        question.addEventListener( 'keyup', function()
        {
        	self.properties.question = '<!--BASE64-->' + Base64.encode( question.innerHTML );
            courseCreator.manager.saveActivePage();
        } );
        
        this.domContainer.appendChild(question);
        
        // Checkboxes
        let cbxContainer = ce('div');
        cbxContainer.classList.add( 'checkboxContainer' );
        let last = false;
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
                        },
                        {
                            "event": "change",
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
            
            last = cbxLabel;
            
        });
        
        this.domContainer.appendChild( cbxContainer );
        
        if( flags && flags.activate == 'lastEntry' && last )
        {
        	setTimeout( function()
        	{
        		last.focus();
        	}, 0 );
        }
        
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
        this.renderMain( { activate: 'lastEntry' } );
    }
}

// UI Radiobox element
class RadioBoxQuestionElement extends Element 
{
    constructor( parent, displayId, dbId=0, name='', properties='' ) 
    {
        super(parent, "radioBoxQuestion", displayId, dbId, name);
        if( !properties )
        {
            properties = {
                question: "question",
                radioBoxes: [
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

    renderMain = function( flags )
    {

        //console.logr("in render main");
        let self = this;

        this.resetDomContainer();
       
        // DOM Elements:
        
        // Base 64 encoding
        let tx = this.properties.question;
        if( tx && this.properties.question.substr( 0, 13 ) == '<!--BASE64-->' )
        {
        	tx = tx.substr( 13, tx.length - 13 );
        	tx = Base64.decode( tx );
        }
        
        // Question:
        let question = ce(
            'span',
            { 
                'ckEditor': true,
                'text': tx,
                'classes': [ 'radioBoxQuestion' ],
                'listeners': [
                    {
                        event: 'blur',
                        callBack: function( event ) {
                            self.properties.question = '<!--BASE64-->' + Base64.encode( event.target.innerHTML );
                            courseCreator.manager.saveActivePage();
                        } 
                    },
                    {
                    	event: 'change',
                        callBack: function( event ) {
                            self.properties.question = '<!--BASE64-->' + Base64.encode( event.target.innerHTML );
                            courseCreator.manager.saveActivePage();
                        } 
                    }
                ]
            }
        );
        
        question.addEventListener( 'keyup', function()
        {
        	self.properties.question = '<!--BASE64-->' + Base64.encode( question.innerHTML );
            courseCreator.manager.saveActivePage();
        } );
        
        this.domContainer.appendChild(question);
        
        // Radioboxes
        let cbxContainer = ce('form');
        cbxContainer.name = 'rand_' + Math.random() * 1;
        cbxContainer.classList.add( 'radioboxContainer' );
        let last = false;
        this.properties.radioBoxes.forEach( ( cbx , i ) => {
            let cbxRow = ce('span', { "classes": ['radioBoxRow']});
            // Radiobox input
            let cbxInput = ce( 
                "input",
                {
                    "attributes": {
                        "type":"radio"
                    },
                    "classes": ['radioBoxTick'],
                    "listeners": [
                        {
                            "event": "change",
                            "callBack": function ( event ) {
                                cbx.isAnswer = event.target.checked;
                                if( cbx.isAnswer )
                                {
                                    cbxRow.classList.add( 'isAnswer' );
                                    let inps = cbxRow.parentNode.getElementsByClassName( 'radioBoxRow' );
                                    for( let a = 0; a < inps.length; a++ )
                                    {
                                    	if( inps[a] != cbxRow )
                                    	{
                                    		inps[a].classList.remove( 'isAnswer' );
                                    		
                                    		// Clear others
                                    		let checks = inps[a].getElementsByTagName( 'input' );
                                    		
                                    		for( let z = 0; z < checks.length; z++ )
                                    		{
                                    			if( checks[z].getAttribute( 'type' ) != 'radio' ) continue;
                                    			if( checks[z] != cbxInput )
                                    			{
                                    				
                                    				checks[z].checked = '';
                                    			}
                                    		}
                                    		for( let z = 0; z < self.properties.radioBoxes.length; z++ )
                                    		{
                                    			if( self.properties.radioBoxes[z] != cbx )
	                                    			self.properties.radioBoxes[z].isAnswer = false;
                                    		}
                                    	}
                                    }
                                }
                                else 
                                {
                                    cbxRow.classList.remove('isAnswer');
                                }
                                courseCreator.manager.saveActivePage();
                            }
                        }
                    ]
                }
            );
            if( cbx.isAnswer )
                cbxInput.checked = true;
			cbxInput.setAttribute( 'name', 'samename' );

            // Radiobox label
            let cbxLabel = ce(
                "span",
                { 
                    "ckEditor": true,
                    "text": cbx.label,
                    "classes": ["radioBoxLabel"],
                    "listeners": [
                        {
                            "event": "blur",
                            "callBack": function ( event ) {
                                cbx.label = event.target.innerHTML;
                                courseCreator.manager.saveActivePage();
                            }
                        },
                        {
                            "event": "change",
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
                            self.properties.radioBoxes = (
                                self.properties.radioBoxes.filter(
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
            
            last = cbxLabel;
            
        });
        
        this.domContainer.appendChild( cbxContainer );
        
        if( flags && flags.activate == 'lastEntry' && last )
        {
        	setTimeout( function()
        	{
        		last.focus();
        	}, 0 );
        }
        
        // add "new radiobox" button
        let button = ce('div', { "classes" : ['buttons']});
        let inner = ce('div', 
            { 
                "classes" : [ 'IconSmall', 'fa-plus-circle'],
                "listeners": [
                    {
                        "event": "click",
                        "callBack": function ( event ) {
                            self.addRadioBox()
                        }
                    }
                ]
            }
        );
        button.appendChild(inner);
        this.domContainer.appendChild(button);
    }

    
    addRadioBox = function () 
    {
        let self = this;
        this.properties.radioBoxes.push(
            {
                "label": "",
                "isCorrect": false
            }
        );
        this.renderMain( { activate: 'lastEntry' } );
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
                .create( div, { 
                	//removePlugins: [ 'ImageInline' ]
                	toolbar: [ 'heading', 'bold', 'italic', 'bulletedList', 'numberedList', 'outdent', 'indent', 'blockQuote' , 'insertTable', 'link', 'mediaEmbed', 'undo', 'redo' ]
                } )
                .catch( error => {
                    console.error( 'We had an error, ', error );
                } )
                .then( ed => {
                	div.addEventListener( 'keyup', function( event )
                	{
                		console.log( 'Key was up!', div.innerHTML );
                		self.properties.textBox.content = '<!--BASE64-->' + Base64.encode( div.innerHTML + "" );
	                    courseCreator.manager.saveActivePage();
                	} );
                } )
            ;
            // Decode Base64 is possible
            let tx = this.properties.textBox.content;
            if( tx && this.properties.textBox.content.substr( 0, 13 ) == '<!--BASE64-->' )
            {
            	let block = this.properties.textBox.content;
            	block = block.substr( 13, block.length - 13 );
            	div.innerHTML = Base64.decode( block );
            }
            else
            {
            	div.innerHTML = tx;
            }
            
            self.domContainer.appendChild(div);
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

	// Render in preview mode
    renderMain = function () 
    {
        let self = this;
        
        self.resetDomContainer();
        
        
        if( !this.contentContainer )
        {
        	this.contentContainer = document.createElement( 'div' );
        	this.domContainer.appendChild( this.contentContainer );
        }
        
        self.contentContainer.className = 'elementEdit';
        self.contentContainer.innerHTML = '';

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

        cdn.push( ce(
            'div',
            {
                'text' : self.properties.image.title,
                'classes': [ 'image-title' ]
            }
        ));
        
        // Interpret image
        let src = '';
        let raw = self.properties.image.friendSource;
        if( raw )
        {
	    	src = raw.indexOf( ':' ) > 0 ? getImageUrl( self.properties.image.friendSource ) : false;
	    	if( !src )
	    	{
	    		let urlpart = {
	    			appName: 'CourseCreator',
	    			command: 'submodule',
	    			vars: {
						method: 'getimage',
						submodule: 'courses',
						filename: raw,
						elementId: self.dbId,
						courseId: courseCreator.manager.children[0].dbId
					}
	    		};
	    		src = '/system.library/module/?module=system&authid=' + Application.authId + '&command=appmodule&args=' + JSON.stringify( urlpart );
	    	}
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
        
        setDomChildren( self.contentContainer, cdn );
    }

	// Render in edit mode
    renderEdit = function() 
    {
        let self = this;
        
        this.contentContainer.className = 'elementEdit';
        this.contentContainer.innerHTML = '';

        let cdn = new Array();

        cdn.push( ce(
            'span',
            {
                'text': 'Edit image:'
            }
        ) );
                
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
                    'value': self.properties.image.friendSource.indexOf( ':' ) > 0 ? self.properties.image.friendSource : 'Click to edit image'
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
                            	if( items && items.length && items[0].Path )
                            	{
		                            event.target.value = items[0].Path;
		                            courseCreator.manager.saveActivePage();
		                        }
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
        
        let block = document.createElement( 'div' );
        block.className = 'ImageEditButtons';
        block.innerHTML = '\
        	<div><button type="button" class="IconSmall FullWidth fa-save" name="save">Save</button></div>\
        	<div><button type="button" class="IconSmall FullWidth fa-remove" name="save">Cancel</button></div>\
        </div>';
        
        let s = block.getElementsByTagName( 'button' );
        s[0].onclick = function()
        {
        	self.saveEditElement();
            courseCreator.manager.saveActivePage();
        }
        s[1].onclick = function( event )
        {
        	event.stopPropagation();
        	self.renderMain();
        }
        cdn.push( block );
        
        setDomChildren( self.contentContainer, cdn);
        
        let input = self.contentContainer.getElementsByTagName( 'input' );
        input[0].onclick = function( event )
        {
        	event.stopPropagation();
        }
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
		if( self.properties.image.friendSource.indexOf( ':' ) > 0 )
		{
			this.storeFriendImage( self.properties.image.friendSource, function( data )
			{
				if( data )
				{
					self.properties.image.friendSource = data.filename;
					courseCreator.manager.saveActivePage();
				}				
				// render main after data is changed
				setTimeout( function(){
				    self.renderMain()
				}, 1 );
			} );
		}
		else
		{
			// render main after data is changed
			setTimeout( function(){
			    self.renderMain()
			}, 1 );
		}
		
    }
    
    // Store Friend image into the Course Creator database
    storeFriendImage( imagesrc, callback )
    {
		let self = this;    
    	let m = new Module( 'system' );
    	m.onExecuted = function( e, d )
    	{
			// Run callback if it exists
			if( callback )
			{
				if( e == 'ok' )
				{
					callback( JSON.parse( d ) );
				}
				else
				{
					callback( false );
				}
			}
		}
		m.execute( 'appmodule', {
			appName: 'CourseCreator',
			command: 'submodule',
			vars: {
				method: 'storeimage',
				submodule: 'courses',
				courseId: courseCreator.manager.children[0].dbId,
				elementId: self.dbId,
				imageSource: imagesrc
			}
		} );
    }
}
