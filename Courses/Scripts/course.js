Application.run = function( msg )
{
	FUI.initialize();
}
Application.receiveMessage = function( msg )
{
	console.log( 'Got message: ', msg );
	FUI.initialize();
}
