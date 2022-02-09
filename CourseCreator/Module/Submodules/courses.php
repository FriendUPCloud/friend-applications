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

if( isset( $args->method ) )
{
    switch( $args->method )
    {
    	case 'setcoursename':
    		$o = new dbIO( 'CC_Course', $courseDb );
    		if( $o->Load( $args->courseId ) )
    		{
    			$o->Name = $args->coursename;
    			if( $o->Save() )
    			{
    				die( 'ok' );
    			}
    		}
    		die( 'fail' );
    		
        case 'courses':
        {
            if( $rows = $courseDb->fetchObjects( 'SELECT * FROM CC_Course ORDER BY ID DESC' ) )
            {
                die( 'ok<!--separate-->' . json_encode( $rows ) );
            }
            break;
        }
    }
    die( 'fail' );
}

$t = file_get_contents( __DIR__ . '/courses/tpl_main.html' );
die( 'ok<!--separate-->' . $t );

?>
