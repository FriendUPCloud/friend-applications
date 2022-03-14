

**How to get progress of a classroom on behalf of a user:**

let cl = new Module( 'system' );
cl.onExecuted = function( returnCode, returnData )
{
    // returns returnData upon OK returnCode:
    // {"6":0,"13":0,"41":50} where key is CourseID and value is percent completed
}
cl.execute( 'appmodule', {
	appName: 'Courses',
	command: 'getclassroomprogress',
	classrooms: cids // Classroom IDs array,
	userId: intID // optional if you are admin, to peek at users
} );

