<?php

/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

if( !isset( $args->args->command ) ) die( 'fail' );

// Import database class from Course Creator
require( __DIR__ . '/../../CourseCreator/Module/classes/database.php' );

// Instance our class!
$db = new CourseDatabase();

// Check calls
switch( $args->args->command )
{
	/* General */
	case 'getmodule':
		$mod = $args->args->moduleName;
		$mod = str_replace( array( '/', '..' ), '', $mod );
		if( file_exists( __DIR__ . '/mod_' . $mod . '/template.html' ) )
		{
			die( 'ok<!--separate-->' . file_get_contents( __DIR__ . '/mod_' . $mod . '/template.html' ) );
		}
		die( 'fail<!--separate-->{"message":"No such template found.","response":-1}' );
		break;
	case 'gettemplate':
		if( !isset( $args->args->moduleName ) )
		{
			die( 'fail<!--separate-->{"message":"No module requested.","response":-1}' );
		}
		$mod = $args->args->moduleName;
		$mod = str_replace( array( '/', '..' ), '', $mod );
		$tpl = $args->args->template;
		$tpl = str_replace( array( '/', '..' ), '', $tpl );
		if( file_exists( __DIR__ . '/mod_' . $mod . '/' . $tpl . '.html' ) )
		{
			die( 'ok<!--separate-->' . file_get_contents( __DIR__ . '/mod_' . $mod . '/' . $tpl . '.html' ) );
		}
		die( 'fail<!--separate-->{"message":"No such template found","response":-1}' );
		break;
	/* Classrooms */
	case 'listclassrooms':
		if( $rows = $db->database->fetchObjects( '
			SELECT 
				cr.* 
			FROM 
				CC_UserClassroom uc, 
				CC_Classroom cr 
			WHERE 
				uc.ClassroomID = cr.ID AND 
				uc.UserID=\'' . intval( $User->ID, 10 ) . '\' 
			ORDER BY 
				cr.StartDate DESC
		' ) )
		{
			die( 'ok<!--separate-->' . json_encode( $rows ) );
		}
		die( 'fail<!--separate-->{"message":"Could not find any classrooms for this user.","response":-1}' );
		break;
	case 'listsections':
		if( $rows = $db->database->fetchObjects( '
			SELECT * FROM CC_Section WHERE CourseID=\'' . intval( $args->args->courseId, 10 ) . '\' ORDER BY DisplayID ASC
		' ) )
		{
			die( 'ok<!--separate-->' . json_encode( $rows ) );
		}
		die( 'fail<!--separate-->{"message":"Could not find sections for this course.","response":-1}' );
		break;
}
die( 'fail<!--separate-->{"message":"Unknown appmodule method.","response":-1}' );

?>
