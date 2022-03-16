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
global $Config;

if ( isset( $args->method ))
{
	switch( $args->method )
	{
		case 'activeclasses':
			$q = '
				SELECT cl.ID, cl.Name, cl.CourseID, count( uc.UserID ) AS Users 
				FROM CC_Classroom AS cl
				LEFT JOIN CC_UserClassroom AS uc
					ON cl.ID=uc.ClassroomID
				WHERE ( cl.StartDate < NOW() )
				AND ( cl.EndDate > NOW() )
				GROUP BY cl.ID
			';
			$res = $courseDb->fetchObjects( $q );
			die( 'ok<!--separate-->'.json_encode([
				'activeclasses' => $res,
				'q'             => $q,
			]));
		case 'classtats':
			if ( isset( $args->classId ))
			{
				// all users in class
				$qn = '
					SELECT uc.ID, uc.UserID FROM CC_UserClassroom AS uc
					WHERE uc.ClassroomID='.$args->classId.'
				';
				$uc = $courseDb->fetchObjects( $qn );
				$total = count( $uc );
				$crIds = [];
				for ( $i=0; $i<$total; $i++ )
				{
					array_push( $crIds, $uc[$i]->ID );
				}
				
				// completion stats for each user
				$qs = '
					SELECT 
						uce.Points, 
						uce.PointsPossbile,
						uce.IsComplete, 
						uce.UserClassroomID 
					FROM CC_UserClassroomElement AS uce
					WHERE uce.UserClassroomId IN ( '.implode(',', $crIds ).' )
				';
				$sres = $courseDb->fetchObjects( $qs );
				
				//
				die( 'ok<!--separate-->'.json_encode([
					'uc'    => $uc,
					'total' => $total,
					'crIds' => $crIds,
					'qs'    => $qs,
					'sres'  => $sres,
				]));
			}
			else
			{
				die( 'ok<!--separate-->'.json_encode([
					'endpoint' => 'classtats',
					'error'    => 'missing args',
					'required' => [ 'classId' ],
					'passed'   => $args,
				]));
			}
		case 'status':
			// students total / online
			$aq = '
				SELECT uc.UserID FROM CC_UserClassroom AS uc GROUP BY uc.UserID;
			';
			$allUIDs = $courseDb->fetchObjects( $aq );
			// online
			$d = getcwd();
            require_once( $d . '/php/friend.php' ); // FriendCall
            
            $getonline = ( $Config->SSLEnable ? 'https://' : 'http://' ) .
            	$Config->FCHost . ':' . $Config->FCPort . '/system.library/user/activewslist';
            	
            $op = [
                'servertoken' => $User->ServerToken,
            ];
            
            $online = 0;
            $fres = FriendCall( $getonline, null, $op );
            if ( $fres )
            {
            	$o = json_decode( $fres );
            	$online = count( $o->userlist );
            }
			
			// active sessions today
			
			
			// completed courses
			
			die( 'ok<!--separate-->'.json_encode([
				'endpoint'         => 'status',
				'args'             => $args,
				'aq'               => $aq,
				'allUIDs'          => $allUIDs,
				'getonline'        => $getonline,
				'op'               => $op,
				'fres'             => $fres,
				'o'                => $o,
				'online'           => $online,
				'usersTotal'       => count( $allUIDs ),
				'usersOnline'      => 8,
				'activeSessions'   => 3,
				'completedCourses' => 26,
			]));
		die( 'fail<!--separate-->'.json_encode( [
			'error' => 'no endpoint found',
			'args'  => $args,
		]));
	}
}
else
{
	
$t = file_get_contents( __DIR__ . '/dashboard/tpl_main.html' );

$str = str_replace( '{fullname}', $User->FullName, $t );

die( 'ok<!--separate-->' . $str );
	
}


?>
