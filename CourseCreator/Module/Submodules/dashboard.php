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

global $User;

$t = file_get_contents( __DIR__ . '/dashboard/tpl_main.html' );

$str = str_replace( '{fullname}', $User->FullName, $t );

die( 'ok<!--separate-->' . $str );

?>
