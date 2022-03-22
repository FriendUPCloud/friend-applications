

**How to get progress of a classroom on behalf of a user:**

let cl = new Module( 'system' );
cl.onExecuted = function( returnCode, returnData )
{
    // returns returnData upon OK returnCode:
    // { 
    //		progress  : {"6":0,"13":100,"41":50}, where key is CourseID and value is percent completed
    //		completed : 11 when format:'sum' argument is passed
	// } 
}
cl.execute( 'appmodule', {
	appName: 'Courses',
	command: 'getclassroomprogress',
	classrooms: cids // Classroom IDs array,
	userId: intID // optional if you are admin, to peek at users
	context : 'classrooms' // check progress for classrooms, not a user
	format: 'sum' // get total completed courses for either a user or overall, depending on context
} );

