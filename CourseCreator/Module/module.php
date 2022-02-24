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

global $args, $SqlDatabase, $User, $Logger;

// import database class
require( 'classes/database.php' );

// Instance our class!
$db = new CourseDatabase();

if( method_exists( $db, $args->args->command ) )
{
	$i = false;
	
	if( isset( $args->args->vars ) )
	{
		$i =& $args->args->vars;
	}
	
	$result = $db->{$args->args->command}( $i );
	
	die( $result );
}

die( 'fail' );

?>
