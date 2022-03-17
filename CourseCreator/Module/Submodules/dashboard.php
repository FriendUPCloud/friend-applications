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
		case 'classesprogress':
			if ( isset( $args->classrooms ))
			{
				$progs = [];
				$qts = [];
				foreach( $args->classrooms AS $cid )
				{
					$qt = '
						SELECT 
							cl.ID AS cId,
							count( DISTINCT sc.ID ) AS sc,
							count( DISTINCT pg.ID ) AS pg, 
							count( DISTINCT el.ID ) AS el
						FROM CC_Classroom AS cl
						LEFT JOIN CC_Course AS crs
							ON cl.CourseID = crs.ID
						LEFT JOIN CC_Section AS sc
							ON crs.ID = sc.CourseID
						LEFT JOIN CC_Page AS pg
							ON sc.ID = pg.SectionID
						LEFT JOIN CC_Element AS el
							ON pg.ID = el.PageID
						WHERE cl.ID='.$cid.'
					';
					$qts[] = $qt;
					
					$tot = $courseDb->fetchObjects( $qt );
					$total = $tot->el;
					$progs[] = $total;
				}
				
				
				die( 'ok<!--separate-->'.json_encode([
					'qts'   => $qts,
					'progs' => $progs,
				]));
			}
			else
			{
				die( 'fail<!--separate-->'.json_encode([
					'endpoint' => 'classesprogress',
					'error'    => 'missing args',
					'required' => [ 'classrooms<[id,..]>' ],
					'passed'   => $args,
				]));
			}
		case 'status':
			// students total
			$aq = '
				SELECT uc.UserID FROM CC_UserClassroom AS uc GROUP BY uc.UserID;
			';
			$all = $courseDb->fetchObjects( $aq );
			// online
			$d = getcwd();
            require_once( $d . '/php/friend.php' ); // FriendCall
            
            $getonline = ( $Config->SSLEnable ? 'https://' : 'http://' ) .
            	$Config->FCHost . ':' . $Config->FCPort . '/system.library/user/activewslist';
            	
            $op = [
                'servertoken' => $User->ServerToken,
            ];
            
            $online = [];
            $fres = FriendCall( $getonline, null, $op );
            if ( $fres )
            {
            	$o = json_decode( $fres );
            	foreach( $o->userlist AS $fu )
            	{
            		foreach( $all AS $u )
            		{
            			if ( $fu->ID == $u->UserID )
            				$online[] = $u->UserID;
            		}
            	}
            }
			
			// sessions
			$sq = '
				SELECT cs.ID, cs.DateCreated FROM CC_CourseSession AS cs
				WHERE DATE( cs.DateCreated ) = CURDATE()
			';
			$sess = $courseDb->fetchObjects( $sq );
			
			// completed courses
			
			
			die( 'ok<!--separate-->'.json_encode([
				'endpoint'         => 'status',
				'args'             => $args,
				'aq'               => $aq,
				'all'              => $all,
				'getonline'        => $getonline,
				'op'               => $op,
				'fres'             => $fres,
				'o'                => $o,
				'online'           => $online,
				'sess'             => $sess,
				'usersTotal'       => count( $all ),
				'usersOnline'      => count( $online ),
				'activeSessions'   => count( $sess ),
				'completedCourses' => 'NYI',
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
