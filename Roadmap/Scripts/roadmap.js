Application.wekanURL = 'https://volatile.friendup.cloud/wekan/';
Application.settings = false;

Application.run = function( msg )
{
	this.setApplicationName( 'Wekan v1.06' );
	this.loadSettings();
}

Application.loadSettings = function()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var tmp = false;
			try
			{
				 tmp = JSON.parse( d );	
				 tmp = JSON.parse( tmp[0].Data );
			}
			catch(e)
			{
				console.log(d);
			}
			Application.settings = tmp;
			if( tmp && tmp.wekanhost ) Application.wekanURL = tmp.wekanhost;
		}
		else
		{
			
		}
		
		Application.openView();
	}
	m.execute( 'getsystemsetting', {'type':'system','key':'wekan'} );
}

Application.openView = function()
{
	var v = new View( {
		title: 'Wekan',
		width: 900,
		height: 780
	} );
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}

	f.replacements = {
		'wekanurl': Application.wekanURL
	};
	
	f.load();
	
	v.onClose = function()
	{
		Application.quit();
	}
	
	
	v.setMenuItems( [
		{
			name: 'File',
			items: [
				{
					name: 'Quit',
					command: 'quit'
				}
			]
		}
	] );
}