Application.run = function( msg )
{
}


Application.receiveMessage = function( msg )
{
	if( msg.command == 'loadcontroller' )
	{
		let m = new Module( 'system' );
		m.onExecuted = function( me, md )
		{
			if( me != 'ok' ) return;
			let data = JSON.parse( md );
			console.log( 'Here is the data!', data );
		}
		m.execute( 'appmodule', {
			appName: 'CourseCreator',
			command : 'submodule',
            vars    : {
                submodule   : 'classrooms',
                method      : 'getcontrollingsheet',
                userId      : msg.userId,
                classroomId : msg.classroomId
            },
		} );
	}
}
