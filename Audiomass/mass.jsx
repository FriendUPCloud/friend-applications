// Init application
Application.run = function( msg )
{
	this.setApplicationName( 'Audiomass' ); // Task name
	this.setSingleInstance( false ); // Can we run several or only one instance?
	// Create a new view window
	this.mainView = new View( {
		title: 'Audiomass',
		width: 1100,
		height: 780,
		// Put your assets here, comma separated (HTML, js, css)
		// A HTML file will be used as markup for the view window
		assets: [ 'Progdir:Markup/main.html', 'Progdir:Markup/main.css' ]
	} );
	// Quit when window closed
	this.mainView.onClose = function()
	{
		Application.quit();
	}
	this.mainView.setMenuItems( [ {
	    name: 'File',
	    items: [
	        {
	            name: 'Quit',
	            command: 'quit'
	        }
        ]
    } ] );
}

// Receive messages
Application.receiveMessage = function( msg )
{
	//console.log( 'Received message: ', msg );
}