// Init application
Application.run = function( msg )
{
	this.setApplicationName( 'IframedApp' ); // Task name
	
	// Create a new view window
	this.mainView = new View( {
		title: 'An iframed app',
		width: 720,
		height: 600,
		// A HTML file will be used as markup for the view window
		assets: [ 'Progdir:assets/iframe.html' ]
	} );
	// Quit when window closed
	this.mainView.onClose = function()
	{
		Application.quit();
	}
	this.mainView.setMenuItems( [
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

// Receive messages
Application.receiveMessage = function( msg )
{
}

