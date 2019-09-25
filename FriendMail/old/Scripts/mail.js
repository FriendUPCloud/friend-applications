/*
	Standard init
*/
Application.run = function( msg )
{
	Application.setApplicationName('Friend Mail');
	
	// Make a new window with some flags
	var v = new View( {
		title: 'Friend Mail',
		width: 1200,
		height: 600
	} );
	
	// Load a file from the same dir as the jsx file is located
	f = new File('Progdir:Templates/friendmail.html');
	f.onLoad = function( data )
	{
		v.setContent( data );
	};
	f.load();

	// On closing the window, quit.
	v.onClose = function()
	{
		Application.quit();
	}	
}