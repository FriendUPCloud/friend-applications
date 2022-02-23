/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class ccListview extends ccGUIElement
{
    constructor( options )
    {
    	super( options );
        if( !this.options.hasHeader )
	        this.options.hasHeader = false;
	    if( !this.options.hasHeader )
	        this.options.hasHeaders = false;
	    if( !this.options.hasRows )
	        this.options.hasRows = false;
    }
    
    show()
    {
    	console.log( 'lv.show', this.domElement );
    	this.domElement.classList.toggle( 'ccHidden', false );
    }
    
    hide()
    {
    	console.log( 'lv.hide', this.domElement );
    	this.domElement.classList.toggle( 'ccHidden', true );
    }
    
    attachDomElement()
    {
        super.attachDomElement();
        
        this.domElement.classList.add( 'ccGUI', 'ccListview' );
    }
    
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let self = this;
        
        let header = domElement.getElementsByTagName( 'listviewhead' );
        let headers = domElement.getElementsByTagName( 'listviewheaders' );
        let rows = domElement.getElementsByTagName( 'listviewrows' );
        
        if( header )
        {
        	header = header[0];
            this.options.hasHeader = true;
            
            let d = document.createElement( 'div' );
            d.className = 'ContentHeader';
            
            // Add the heading
            let heading = false;
            if( ( heading = header.getElementsByTagName( 'listviewheading' ) ) )
            {
            	heading = heading[0];
            	let h = document.createElement( 'h2' );
            	h.innerHTML = heading.innerHTML;
            	d.appendChild( h );
            }
            
            let toolbar = false;
            if( ( toolbar = header.getElementsByTagName( 'listviewtoolbar' ) ) )
            {
            	toolbar = toolbar[0];
            	if( toolbar )
            	{
		        	let t = document.createElement( 'div' );
		        	t.className = 'Left';
		        	
		        	let buttons = false;
		        	if( ( buttons = toolbar.getElementsByTagName( 'listviewbutton' ) ) )
		        	{
		        		for( let a = 0; a < buttons.length; a++ )
		        		{
		        			let b = document.createElement( 'div' );
		        			b.classList.add( 'HeaderButton', 'IconSmall', 'MousePointer' );
		        			let icon = '';
		        			if( ( icon = buttons[a].getAttribute( 'icon' ) ) )
		        			{
		        				b.classList.add( 'fa-' + icon );
		        			}
		        			let cb = false;
		        			if( ( cb = buttons[a].getAttribute( 'onclick' ) ) )
		        			{
				    			( function( ele, cbk )
				    			{
				    				ele.onclick = function()
				    				{
										// Trigger callback
						                if( window.ccGUI.callbacks[ cbk ] )
						                {
						                    // Add structure with current element flags
						                    window.ccGUI.callbacks[ cbk ]( self );
						                }
						            }
								} )( b, cb );
							}
		        			t.appendChild( b );
		        		}
		        	}
		        	d.appendChild( t );
		    	}
            }
            
            this.domElement.appendChild( d );
        }
        
        self.headerElements = [];
        
        if( headers )
        {
        	headers = headers[0];
            this.options.hasHeaders = true;
            
            let d = document.createElement( 'div' );
            d.className = 'ContentListHeaders BorderTop';
            
            let headerelements = headers.getElementsByTagName( 'listviewheader' );
            let row = document.createElement( 'div' );
            row.className = 'HRow';
            
            for( let a = 0; a < headerelements.length; a++ )
            {
            	self.headerElements[ a ] = {};
            	self.headerElements[ a ].width = parseInt( headerelements[a].getAttribute( 'width' ) );
            	self.headerElements[ a ].align = headerelements[a].getAttribute( 'align' );
            	self.headerElements[ a ].name = headerelements[a].getAttribute( 'name' ) ? headerelements[a].getAttribute( 'name' ) : headerelements[a].innerText;
            	self.headerElements[ a ].text = headerelements[a].innerText;
            	if( !self.headerElements[ a ].align ) self.headerElements[ a ].align = 'left';
            	let h = document.createElement( 'div' );
            	let alignment = self.headerElements[ a ].align;
            	if( alignment == 'left' ) alignment = ' TextLeft';
            	else if( alignment == 'right' ) alignment = ' TextRight';
            	else if( alignment == 'center' ) alignment = ' TextCenter';
            	h.className = 'HContent' + self.headerElements[ a ].width + ' PaddingSmall Ellipsis FloatLeft' + alignment;
            	h.innerHTML = headerelements[ a ].innerHTML;
            	row.appendChild( h );
            }
            
            d.appendChild( row );
            this.domElement.appendChild( d );
        }
        
        if( rows )
        {
        	rows = rows[0];
            this.options.hasRows = true;
            
            let container = document.createElement( 'div' );
            container.className = 'ContentBlock';
            this.rowContainer = container;
            this.domElement.appendChild( container );
            
            let onload = rows.getAttribute( 'onload' );
        	if( onload )
        	{
        		this.onload = function()
        		{
        			// Trigger callback
	                if( window.ccGUI.callbacks[ onload ] )
	                {
	                    // Add structure with current element flags
	                    window.ccGUI.callbacks[ onload ]( self );
	                }
        		}
        	}
        }
        
        if( this.onload )
        {
        	this.onload();
        }
    }
    
    setRowData( json )
    {
    	// Contains references to data
	    this.dataset = {};
    	this.rowData = json;
    	this.refreshRows();
    }
    
    addRowData( rows )
    {
    	if ( null == this.rowData )
    	{
    		this.setRowData( rows );
    		return;
    	}
    	
    	this.rowData = [ ...this.rowData, ...rows ];
    	console.log( 'addRowData', {
    		rows    : rows,
    		rowData : this.rowData,
    	});
    	
    	this.refreshRows();
    }
    
    refreshRows()
    {
    	let self = this;
    	
    	let json = this.rowData;
    	console.log( 'listview refreshrows', json );
    	this.clearRows();
    	
    	for( let b = 0; b < json.length; b++ )
    	{
    		let row = document.createElement( 'div' );
    		row.className = 'HRow EditRow';
    		let baseWidth = parseInt( 100 / json[b].length );
    		
			for( let z = 0; z < json[b].length; z++ )
			{
				let col = document.createElement( 'div' );
				
				let w = this.headerElements && this.headerElements.length ? 
					this.headerElements[ z ].width : baseWidth;
				
				let alignment = this.headerElements[ z ].align;
            	if( alignment == 'left' ) alignment = ' TextLeft';
            	else if( alignment == 'right' ) alignment = ' TextRight';
            	else if( alignment == 'center' ) alignment = ' TextCenter';
				
				col.className = 'HContent' + w + ' PaddingRight Ellipsis FloatLeft' + alignment;
				
				// Identify column dataset
				if( json[b][z].uniqueid )
				{
					this.dataset[ json[b][z].uniqueid ] = json[b][z];
					this.dataset[ json[b][z].uniqueid ].domNode = col;
				}
				
				let str = ccFactory.create( json[b][z] );
				
				json[b][z].name = this.headerElements[z].name;
				let onclick = json[b][z].onclick;
				
				if( onclick )
				{
				    ( function( data, column )
				    {
				        column.onclick = function( e )
				        {
				        	if( e.target && e.target.nodeName == 'INPUT' ) return;
				            if( window.ccGUI.callbacks[ onclick ] )
	                        {
	                            // Add structure with current element attributes
	                            let obj = {};
	                            for( let d = 0; d < data.length; d++ )
	                            {
	                                obj[ data[ d ].name ] = {};
	                                for( let p in data[ d ] )
	                                {
	                                    if( p == 'name' ) continue;
	                                    obj[ data[ d ].name ][ p ] = data[ d ][ p ];
	                                }
	                            }
	                            window.ccGUI.callbacks[ onclick ]( obj, self, e );
	                        }
				        }
				    } )( json[b], col );
				}
				
				const onchange = json[b][z].onchange;
				if ( onchange )
				{
					/*console.log( 'found onchange for', {
						json   : json,
						jsonb  : json[b],
						jsonbz : json[b][z],
						col    : col,
					});*/
					const data = json[b];
					const cnf = json[b][z];
					const el = col;
					el.onchange = e =>
					{
						console.log( 'onchange', [ cnf, el, e, e.target.value ] );
						if ( window.ccGUI.callbacks[ onchange ] )
						{
							let obj = {};
                            for( let d = 0; d < data.length; d++ )
                            {
                                obj[ data[ d ].name ] = {};
                                for( let p in data[ d ] )
                                {
                                    if( p == 'name' ) continue;
                                    obj[ data[ d ].name ][ p ] = data[ d ][ p ];
                                }
                            }
                            if( e.target && e.target.value )
                            {
                            	obj.value = e.target.value;
                            }
							window.ccGUI.callbacks[ onchange ]( obj, self, e );
						}
					}
					
				}
				
				col.innerHTML = str;					
				row.appendChild( col );
			}
			
			this.rowContainer.appendChild( row );
		}
		
		ccInitializeGUI();
    }
    
    // Edit a row / column by id
    editColumnById( uid )
    {
    	let self = this;
    	let set = this.dataset[ uid ];
    	// We need to handle editing many different types of columns
    	if( set.type == 'string' )
    	{
    		if( set.domNode && set.domNode.parentNode )
    		{
    			set.domNode.innerHTML = '<input type="text" class="InputHeight FullWidth" value="' + set.value + '"/>';
    			let nod = set.domNode.getElementsByTagName( 'input' )[0];
    			nod.addEventListener( 'blur', function( e )
    			{
    				set.value = this.value;
    				
    				// If there's an onchange event, execute it and provide the dataset as well as listview object
    				if( set.onchange )
    				{
    					if( window.ccGUI.callbacks[ set.onchange ] )
    					{
    						window.ccGUI.callbacks[ set.onchange ]( set, self );
    						return;
    					}
    				}
    				self.refreshRows();
    			} );
    			nod.addEventListener( 'change', function( e )
    			{
    				this.blur();
    			} );
    			nod.focus();
    			nod.select();
    		}
    		else
    		{
    			console.log( 'No supported dom node: ', set );
    		}
    	}
    	else
    	{
    		console.log( 'Unsupported type: ' + set.type );
    	}
    }
    
    clearRows()
    {
    	this.rowContainer.innerHTML = '';
    }
}

ccFactory.registerClass( 'listview' );
