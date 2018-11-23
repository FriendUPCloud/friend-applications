Application.run = function( msg )
{
	this.setApplicationName( 'Photopea' );
	
	var v = new View( {
		title: 'Photopea',
		width: 1024,
		height: 768
	} );
	
	var f = new File( 'Progdir:Templates/pea.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
		
		if( msg.args )
		{
			loadImage( msg.args );
		}
		
	}
	f.load();
	
	v.onClose = function()
	{
		Application.quit();
	}
	
	v.setMenuItems( [
		{
			name: i18n( 'i18n_file' ),
			items: [
				{
					name: i18n( 'i18n_load' ),
					command: 'load'
				},
				{
					name: i18n( 'i18n_save' ),
					command: 'save'
				},
				{
					name: i18n( 'i18n_save_as' ),
					command: 'save_as'
				},
				{
					name: i18n( 'i18n_quit' ),
					command: 'quit'
				}
			]
		}
	] );
	
	this.mainView = v;
}

function loadImage( fn )
{
	if( fn )
	{
		var fna = fn.split( ':' )[0];
		if( fna.indexOf( '/' ) > 0 )
		{
			fna = fna.split( '/' )[0];
		}
		Application.mainView.sendMessage( {
			command: 'load',
			Filename: fna,
			Path: fn
		} );
	}
	else
	{
		var desc = {
			triggerFunction: function( data )
			{
				if( data.length )
				{
					Application.mainView.sendMessage( {
						command: 'load',
						Filename: data[0].Filename,
						Path: data[0].Path
					} );
				}
			},
			path: 'Mountlist:',
			type: 'load',
			title: 'Load image',
			filename: '',
			mainView: Application.mainView.getViewId()
		};
		var f = new Filedialog( desc );
	}
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'setcurrentfile':
			this.mainView.setFlag( 'title', 'Photopea - ' + msg.filename );
			break;
		case 'load':
			loadImage();
			break;
		case 'save':
			this.mainView.sendMessage( {
				command: 'save'
			} );
			break;
		case 'save_as':
			this.mainView.sendMessage( {
				command: 'save_as'
			} );
			break;
	}
}

