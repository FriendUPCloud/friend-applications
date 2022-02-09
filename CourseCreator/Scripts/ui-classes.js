/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Global
window.ccGUI = {
    callbacks: {},
    guiElements: {}
};

ccFactory = {
    // Initial built-in classes
    classTypes: [ 'string' ],
    // Create meta markup for a class instance
	create( data )
	{
		switch( data.Type )
		{
			case 'string':
				return data.Value;
				break;
			default:
			{
    			let classStr = 'cc' + data.Type.substr( 0, 1 ).toUpperCase() + data.Type.substr( 1, data.Type.length - 1 );
			    try
			    {
                    let classObj = eval( classStr );
                    return( new classObj().getMarkup( data ) );
                }
                catch( e )
                {
                    console.log( 'No such class type ' + classStr );
                }
                return '';
             }   
		}
	},
	// Registers a class to the factory
	registerClass( type )
	{
	    for( let a = 0; a < this.classTypes.length; a++ )
	    {
	        if( this.classTypes[ a ] == type ) return false;
	    }
	    this.classTypes.push( type );
	},
	// Get that element!
	getElementByUniqueId( id )
	{
		return window.ccGUI.guiElements[ id ] ? window.ccGUI.guiElements[ id ] : false;
	}
};

// Base class
class ccGUIElement
{
    // Sets default values etc
    constructor( options )
    {
        this.options = options;
        
        if( options.uniqueid )
        {
        	if( window.ccGUI.guiElements[ options.uniqueid ] )
        	{
        		console.log( 'ccGUI: Gui element with proposed uniqueId ' + options.uniqueid + ' is taken. Object becomes an orphan.' );
        	}
        	else
        	{
        		window.ccGUI.guiElements[ options.uniqueid ] = this;
        	}
        }
        
        let d = document.createElement( 'div' );
        this.domElement = d;
        this.attachDomElement();
    }
    // Sets options on gui element
    setOptions( options )
    {
        for( let a in options )
        {
            this.options[ a ] = options[ a ];
        }
    }
    // Attaches GUI to dom element if specified
    attachDomElement()
    {
        if( !this.options ) return;
        
        if( !this.domElement.parentNode && this.options.containerElement )
        {
            this.grabAttributes( this.options.containerElement );
            this.options.containerElement.appendChild( this.domElement );
        }
        else if( !this.domElement.parentNode && this.options.placeholderElement )
        {
            this.grabAttributes( this.options.placeholderElement );
            this.options.placeholderElement.parentNode.replaceChild( this.domElement, this.options.placeholderElement );
        }
    }
    // Grabs attributes from the dom element if they are supported
    grabAttributes( domElement )
    {
    	let uid = domElement.getAttribute( 'uniqueid' );
    	if( uid )
    	{
    		if( window.ccGUI.guiElements[ uid ] )
    		{
    			if( this.options.uniqueid )
    			{
    				console.log( 'ccGUI: Could not set new uniqueid - id ' + uid + ' already taken. Keeping old id: ' + this.options.uniqueId );
    			}
    			else
    			{
    				console.log( 'ccGUI: Gui element with proposed uniqueid ' + options.uniqueId + ' is taken. Object becomes an orphan.' );
    			}
    		}
    		else
    		{
    			if( this.options.uniqueid && this.options.uniqueid != uid )
    			{
    				delete window.ccGUI.guiElements[ this.options.uniqueid ];
    			}
    			window.ccGUI.guiElements[ uid ] = this;
    		}
    	}
    }
    // Refreshes gui's own dom element
    refreshDom()
    {
    }
}

class ccRadiobox extends ccGUIElement
{
    constructor( options )
    {
        super( options );
        if( options.value )
            this.value = options.value;
        if( options.elements )
            this.elements = options.elements;
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        this.domElement.classList.add( 'ccGUI', 'ccRadiobox' );
        
        this.refreshDom();
    }
    refreshDom()
    {
        let self = this;
        
        if( this.changed )
        {
            // Gui containers
            let str = '';
            
            if( this.elements && this.elements.length )
            {
                for( let a in this.elements )
                {
                    let e = this.elements[ a ];
                    str += '<div class="ccRadioElement">';
                    str += '<div class="ccRadioToggle">' + e.label + '</div>';
                    str += '</div>';
                }
            }
            
            this.domElement.innerHTML = str;
            
            // Events
            let radios = this.domElement.getElementsByClassName( 'ccRadioElement' );
            for( let a = 0; a < radios.length; a++ )
            {
                ( function( r, item, ele ){
                    r.onclick = function()
                    {
                        self.value = ele.value;
                        if( self.options.onchange )
                        {
                            // Trigger callback
                            if( window.ccGUI.callbacks[ self.options.onchange ] )
                            {
                                // Add structure with current element flags
                                window.ccGUI.callbacks[ self.options.onchange ]( self.value );
                            }
                        }
                        self.refreshDom();
                    }
                } )( radios[ a ], a, this.elements[ a ] );
            }
            
            this.changed = false;
        }
        
        let radios = this.domElement.getElementsByClassName( 'ccRadioElement' );
        for( let a = 0; a < this.elements.length; a++ )
        {
            if( this.elements[a].value == this.value )
            {
                radios[a].classList.add( 'ccSelected' );
            }
            else
            {
                radios[a].classList.remove( 'ccSelected' );
            }
        }
    }
    grabAttributes( domElement )
    {
        let val = domElement.getAttribute( 'value' );
        if( val ) 
            this.value = parseFloat( val );
    
        let elements = domElement.getElementsByTagName( 'radioelement' );
        if( !elements || !elements.length ) return;
        
        this.elements = [];
        for( let a = 0; a < elements.length; a++ )
        {
            let el = elements[a];
            let e = {
                selected: el.getAttribute( 'selected' ) == 'selected' ? true : false,
                label: el.getAttribute( 'label' ) ? el.getAttribute( 'label' ): '',
                value: el.getAttribute( 'value' )
            };
            if( e.selected )
            {
                this.value = e.value;
            }
            this.elements.push( e );
        }
        
        // Support onchange
        if( domElement.getAttribute( 'onchange' ) )
        {
            this.setOptions( { onchange: domElement.getAttribute( 'onchange' ) } );
        }
        
        this.changed = true;
        
        this.refreshDom();
    }
}
ccFactory.registerClass( 'radiobox' );

// Checkbox element
class ccCheckbox extends ccGUIElement
{
    constructor( options )
    {
        super( options );
        if( options && options.checked )
            this.checked = options.checked;
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        this.domElement.onclick = function()
        {
            if( self.checked )
            {
                self.domElement.classList.remove( 'ccChecked' );
                self.checked = false;
            }
            else
            {
                self.domElement.classList.add( 'ccChecked' );
                self.checked = true;
            }
            if( self.options.onchange )
            {
                // Trigger callback
                if( window.ccGUI.callbacks[ self.options.onchange ] )
                {
                    // Add structure with current element flags
                    window.ccGUI.callbacks[ self.options.onchange ]( self.checked );
                }
            }
        }
        
        this.domElement.classList.add( 'ccGUI', 'ccCheckbox' );
        
        this.domElement.innerHTML = '<div class="ccGroove"><div class="ccButton"></div></div>';
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        if( domElement.getAttribute( 'checked' ) )
        {
            this.checked = domElement.getAttribute( 'checked' ) != '' ? true : false;
        }
        else
        {
            this.checked = false;
        }
        
        // Support onchange
        if( domElement.getAttribute( 'onchange' ) )
        {
            this.setOptions( { onchange: domElement.getAttribute( 'onchange' ) } );
        }
        
        this.refreshDom();
    }
    refreshDom()
    {
        super.refreshDom();
        
        // Make sure we see checked
        if( this.checked )
        {
            this.domElement.classList.add( 'ccChecked' );
        }
        else
        {
            this.domElement.classList.remove( 'ccChecked' );
        }
    }
    getMarkup( data )
    {
    	let str = '<checkbox {options}/>';
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
    	return str;
    }
}
ccFactory.registerClass( 'checkbox' );

class ccItembox extends ccGUIElement
{
    constructor( options )
    {
        super( options );
        if( options.onsubmit )
            this.onsubmit = options.onsubmit;
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        this.domElement.classList.add( 'ccGUI', 'ccItembox', 'BordersDefault', 'Padding', 'MarginBottom' );
        
        this.domElement.innerHTML = '<div class="ccForm HRow">\
            <div class="HContent20 Ellipsis FloatLeft"><p class="InputHeight"><strong>Group name:</strong></p></div>\
            <div class="HContent80 Ellipsis FloatLeft"><input type="text" class="FullWidth InputHeight"/></div>\
        </div>\
        <div class="ccForm HRow MarginTop">\
            <div class="HContent20 Ellipsis FloatLeft"><p class="InputHeight"><strong>Description:</strong></p></div>\
            <div class="HContent80 Ellipsis FloatLeft"><textarea class="FullWidth" rows="5"></textarea></div>\
        </div>\
        <div class="ccForm HRow MarginTop">\
            <div class="HContent100 Ellipsis FloatLeft TextRight"><button class="Button IconSmall fa-plus" type="button"></button></div>\
        </div>';
        
        // Set up events
        let inp = this.domElement.getElementsByTagName( 'input' )[0];
        let txt = this.domElement.getElementsByTagName( 'textarea' )[0];
        let btn = this.domElement.getElementsByTagName( 'button' )[0];
        btn.onclick = function()
        {
            // Trigger callback
            if( window.ccGUI.callbacks[ self.options.onsubmit ] )
            {
                // Add structure with current element flags
                window.ccGUI.callbacks[ self.options.onsubmit ]( { name: inp.value, description: txt.value } );
            }
        }
        setTimeout( function()
        {
            inp.focus();
        }, 5 );
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        // Support onchange
        if( domElement.getAttribute( 'onsubmit' ) )
        {
            this.setOptions( { onsubmit: domElement.getAttribute( 'onsubmit' ) } );
        }
        
        this.refreshDom();
    }
    refreshDom()
    {
        super.refreshDom();
        
        // Make sure we see checked
        if( this.checked )
        {
            this.domElement.classList.add( 'ccChecked' );
        }
        else
        {
            this.domElement.classList.remove( 'ccChecked' );
        }
    }
}
ccFactory.registerClass( 'itembox' );

/* Image class */
class ccPicture extends ccGUIElement
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
        
        this.domElement.classList.add( 'ccGUI', 'ccPicture' );
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let attrs = [ 'width', 'height', 'icon', 'type', 'shape', 'border-size', 'onclick' ];
        
        for( let a in attrs )
        {
        	let op = domElement.getAttribute( attrs[ a ] );
        	if( op )
	        	this.options[ attrs[ a ] ] = op;
        }
        
        this.refreshDom();
    }
    refreshDom()
    {
        super.refreshDom();
        
        let self = this;
        
        // Do something with properties on dom
        
        if( this.options.width )
        {
            this.domElement.style.width = this.options.width;
        }
        if( this.options.height )
        {
        	this.domElement.style.height = this.options.height;
        }
        
        let exClasses = '';
        
        if( this.options.shape )
        {
        	if( this.options.shape == 'circle' )
        	{
        		this.domElement.style.borderRadius = '100%';
        	}
        	else
        	{
        		this.domElement.style.borderRadius = '';
        	}
        }
        if( this.options[ 'border-size' ] )
        {
        	this.domElement.style.borderWidth = this.options[ 'border-size' ];
    		this.domElement.style.borderStyle = 'solid';
        }
        else
        {
        	this.domElement.style.borderWidth = '';
        }
        
        if( this.options[ 'onclick' ] )
        {
        	this.domElement.style.cursor = 'pointer';
        	this.domElement.onclick = function( e )
        	{
        		cancelBubble( e );
        		if( window.ccGUI.callbacks[ self.options.onclick ] )
		        {
		            // Add structure with current element flags
		            window.ccGUI.callbacks[ self.options.onclick ]( true );
		        }
		        return;
        	}
        }
        
        // Set stuff on this.domElement.innerHTML
        if( this.options.type == 'icon' )
        {
        	let icon = this.options.icon ? ( 'fa-' + this.options.icon ) : 'fa-info';
        	this.domElement.innerHTML = '<div class="IconSmall ' + icon + exClasses + '"></div>';
        }
    }
    getMarkup( data )
    {
    	// Return meta-markup for class instantiation later
    	
    	let str = '<picture {options}/>';
    	let opts = [];
    	for( let a in data )
    	{
    		if( a == 'width' )
    		{
    			opts.push( 'width="' + data[a] + '"' );
    		}
    		if( a == 'height' && data[a] )
    		{
    			opts.push( 'height="' + data[a] + '"' );
    		}
    		if( a == 'type' && data[a] )
    		{
    			opts.push( 'type="' + data[a] + '"' );
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
    	return str;
    }
}
ccFactory.registerClass( 'picture' );

// Management functions --------------------------------------------------------

// Initialize all gui elements on body
function ccInitializeGUI()
{
    let types = ccFactory.classTypes;
    
    for( let b = 0; b < types.length; b++ )
    {
        ( function( domtype )
        {
            // Convert markup into classes
            let ch = document.getElementsByTagName( domtype );
            let out = [];
            for( let a = 0; a < ch.length; a++ )
            {
                out.push( ch[a] );
            }
            for( let a = 0; a < out.length; a++ )
            {
                let classStr = 'cc' + domtype.substr( 0, 1 ).toUpperCase() + domtype.substr( 1, domtype.length - 1 );
                let classObj = eval( classStr );
                new classObj( { placeholderElement: out[a] } );
            }
        } )( types[b] );
    }
}

// Add a callback
function ccAddCallback( callbackId, callbackFunc )
{
    window.ccGUI.callbacks[ callbackId ] = callbackFunc;
}

