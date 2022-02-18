Application.run = function( msg )
{
	FUI.initialize();
}
Application.receiveMessage = function( msg )
{
	if( msg.command == 'loadcourse' )
	{
		let cr = FUI.getElementByUniqueId( 'course' );
		cr.setCourse( msg.course );
	}
}
