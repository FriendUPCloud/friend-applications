Application.run = function( msg )
{
	if( this.initialized )
		return;
		
	this.state = 'idle';
	this.stateData = {};
	this.openFiles = [];
	this.initialized = true;
	this.currentFile = -1;
	this.options = {
		environment: {
		}
	};
	this.reloadPea();
	
	window.addEventListener( 'message', function( msg )
	{
		if( msg.origin && msg.origin.indexOf( 'photopea.com' ) > 0 )
		{
			// Only handle this state
			if( Application.state == 'load' )
			{
				if( msg.data == 'done' )
				{
					Notify( { title: 'File loaded', text: 'Photopea successfully loaded file.' } );
					Application.openFiles.push( Application.stateData.filename );
					Application.currentFile = Application.openFiles.length - 1;
					Application.sendMessage( { command: 'setcurrentfile', filename: Application.openFiles[ Application.currentFile ] } );	
				}
				Application.state = 'idle';
			}
			else if( Application.state == 'save' )
			{
				if( msg.data != 'done' )
				{
					var f = new File( Application.openFiles[ Application.currentFile ] );
					f.onSave = function()
					{
						Application.state = 'idle';
						Application.sendMessage( { command: 'setcurrentfile', filename: Application.openFiles[ Application.currentFile ] } );
						Notify( { title: 'File saved', text: 'Photopea successfully saved file.' } );
					}
					f.save( msg.data, false, 'wb' );
				}
			}
		}
	} );
	
	// Reference to iframe
	this.peaFrame = ge( 'Pea' );
}

Application.reloadPea = function()
{
	ge( 'Pea' ).src = 'https://www.photopea.com/?p=' + JSON.stringify( this.options );
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'drop':
			var path = false;
			var project = false;
			for( var a = 0; a < msg.data.length; a++ )
			{
				// Filter
				path = msg.data[a].Path;
				break;
			}
			if( path )
			{
				var fn = path;
				if( fn.indexOf( '/' ) > 0 )
				{
					fn = fn.split( '/' );
					fn = fn.pop();
				}
				else if( fn.indexOf( ':' ) > 0 )
				{
					fn = fn.split( ':' )[1];
				}
				Application.receiveMessage( { command: 'load', Path: path, Filename: fn } );
			}
			break;
		case 'load':
			
			if( this.state == 'idle' )
			{
				this.state = 'load';
			
				var ext = msg.Filename.split( '.' );
				ext = ext.pop();
			
				if( msg.Path.indexOf( '.' ) > 0 )
				{
					var p = msg.Path;
					var f = new File( p );
					f.onLoad = function( data )
					{
						pea.postMessage( data, '*' );
					}
					// Load binary
					f.load( 'rb' );
					
					this.stateData = {
						filename: p
					};
				}
				else
				{
					// Not supported file format..
				}
			}
			else
			{
				Notify( { title: 'Could not load', text: 'Photopea is busy. Please wait.' } );
			}
			
			return;
		case 'save_as':
			if( this.currentFile < 0 )
			{
				this.openFiles[ 0 ] = 'Unnamed.psd';
				this.currentFile = 0;
			}
			if( this.currentFile >= 0 )
			{
				var c = this.openFiles[ this.currentFile ];
				var onlyFilename = '';
				if( c.indexOf( '/' ) > 0 )
				{
					c = c.split( '/' );
					onlyFilename = c.pop();
					c = c.join( '/' );
				}
				else if( c.indexOf( ':' ) > 0 )
				{
					onlyFilename = c.split( ':' )[1];
					c = c.split( ':' )[0] + ':';
				}
				
				Filedialog( {
					triggerFunction: function( path )
					{
						if( path.length )
						{
							Application.openFiles[ Application.currentFile ] = path;
							Application.receiveMessage( { command: 'save' } );
						}
						else
						{
							Notify( { title: 'File save failed', text: 'Could not write to new filename.' } );
						}
					},
					path: c,
					type: "save",
					title: i18n( 'i18n_save_as' ),
					filename: onlyFilename
				} );
			}
			return;
		case 'save':
			if( this.currentFile < 0 )
			{
				this.receiveMessage( { command: 'save_as' } );
				return;
			}
			if( this.currentFile >= 0 )
			{
				if( this.state == 'idle' )
				{
					this.state = 'save';
					var f = this.openFiles[ this.currentFile ];
					var ext = f.split( '.' ).pop().toLowerCase();
					pea.postMessage( 'app.activeDocument.saveToOE("' + ext + '");', '*' );
				}
				else
				{
					Notify( { title: 'Could not save', text: 'Photopea is busy. Please wait.' } );
				}
			}
			else
			{
				Notify( { title: 'File error', text: 'No file to save.' } );
			}
			break;
	}
}

