// Init application
Application.run = function( msg )
{
	this.setApplicationName( 'SVGEdit' ); // Task name
	this.setSingleInstance( false ); // Can we run several or only one instance?
	// Create a new view window
	this.mainView = new View( {
		title: 'SVGEdit',
		width: 1100,
		height: 960,
		assets: [ 
		    'Progdir:Assets/main.html',
		    'Progdir:Assets/main.css'
		]
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
	//console.log( 'Received message: ', msg );
}

