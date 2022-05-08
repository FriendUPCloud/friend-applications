Application.run = function( msg )
{
	FUI.initialize();
}
let iterator = 0;
Application.receiveMessage = function( msg )
{
	if( msg.command == 'loadcourse' )
	{
	    try
	    {
		    let cr = FUI.getElementByUniqueId( 'course' );
		    cr.setCourse( msg.courseId, msg.courseSessionId );
		}
		catch( e )
		{
		    setTimeout( function()
		    {
		        Application.receiveMessage( msg );
		        console.log( 'Retrying... ' + ( ++iterator ) );
		    }, 250 );
		}
	}
}

