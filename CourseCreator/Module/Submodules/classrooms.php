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

global $User, $SqlDatabase;

require_once( __DIR__ . '/classrooms/helpers.php' );

if( isset( $args->method ) )
{
    switch( $args->method )
    {
        case 'refreshusers':
            if( $rows = $courseDb->fetchObjects( '
                SELECT u.*, crt.ID AS CertID, crt.CertName FROM 
                    CC_Classroom c, CC_UserClassroom u
                LEFT JOIN CC_Certificate crt
                    ON u.UserID = crt.UserID AND crt.ClassID=\'' . intval( $args->classroomId, 10 ) . '\'
                WHERE
                    c.ID = u.ClassroomID AND
                    c.ID = \'' . intval( $args->classroomId, 10 ) . '\'
            ' ) )
            {
            	$uids = [];
            	foreach( $rows as $r )
            	{
            		$uids[] = $r->UserID;
            	}
            	
            	$keysS = '';
            	if( isset( $args->keys ) )
            	{
            	    $keysS = 'AND ( u.FullName LIKE "%' . $args->keys . '%" )';
            	}
            	
            	if( $users = $SqlDatabase->fetchObjects( '
            		SELECT 
            		    u.*, fu.LoginTime AS LT 
            		FROM 
            		    FUser u LEFT JOIN FUserLogin fu ON fu.LoginTime = ( SELECT MAX(k.LoginTime) FROM FUserLogin k WHERE k.UserID = u.ID ) 
            		WHERE 
            		    ( u.ID = fu.UserID OR fu.ID IS NULL ) AND 
            		    u.ID IN ( ' . implode( ',', $uids ) . ' )
            		    ' . $keysS . '
            	' ) )
            	{
            	    $out = [];
            		foreach( $users as $u )
            		{
            			foreach( $rows as $k=>$v )
            			{
            				if( $rows[$k]->UserID == $u->ID )
            				{
            					$rows[$k]->FullName = $u->FullName;
            					$lt = isset( $u->LT ) ? date( 'Y-m-d', $u->LT ) : '-';
            					$rows[$k]->LoginTime = $lt;
            					$out[] = $rows[$k];
            				}
            			}
            		}
			        die( 'ok<!--separate-->' . json_encode( trim( $keysS ) ? $out : $rows ) );
            	}
            }
            die( 'fail<!--separate-->{"message","No users for this classroom."}' );
            break;
        case 'removeuser':
            $courseDb->query( '
                DELETE FROM CC_UserClassroom
                WHERE
                    ClassroomID = \'' . intval( $args->classroomId, 10 ) . '\' AND
                    UserID = \'' . intval( $args->userId, 10 ) . '\'
            ' );
            break;
        case 'findusers':
            // Find existing users
            $s = '';
            if( $exist = $courseDb->fetchObjects( '
                SELECT UserID, PaymentStatus FROM CC_UserClassroom 
                WHERE ClassroomID = \'' . intval( $args->classroomId, 10 ) . '\'
            ' ) )
            {
                $out = [];
                foreach( $exist as $ex )
                {
                    $out[] = $ex->UserID;
                }
                $s = 'AND u.ID NOT IN (' . implode( ', ', $out ) . ')';
            }
            
            $keysS = '';
        	if( isset( $args->keys ) )
        	{
        	    $keysS = ' AND ( u.FullName LIKE "%' . $args->keys . '%" )';
        	}
            
            // Find users in the same group
            if( $rows = $SqlDatabase->fetchObjects( '
                SELECT u.ID, u.FullName FROM FUser u, FUserToGroup ug1, FUserToGroup ug2
                LEFT JOIN FUserGroup AS fug ON ug2.UserGroupID = fug.ID
                WHERE
                    u.ID = ug1.UserID AND
                    \'' . $User->ID . '\' = ug2.UserID AND
                    ug1.UserGroupID = ug2.UserGroupID AND
                    fug.UserID!=0
                    ' . $not . $s . $keysS . '
                GROUP BY u.ID
            ' ) )
            {
                die( 'ok<!--separate-->' . json_encode( $rows ) );
            }
            die( 'fail<!--separate-->{"message":"No connected users found."}' );
            break;
        case 'adduser':
        	$o = new dbIO( 'CC_UserClassroom', $courseDb );
        	$o->ClassroomID = $args->classId;
        	$o->UserID = $args->userId;
        	if( !$o->Load() )
        	{
        		$o->DateCreated = date( 'Y-m-d H:i:s' );
        	}
        	$o->DateUpdated = date( 'Y-m-d H:i:s' );
        	if( !$o->Save() )
        	{
        		die( 'fail<!--separate-->{"message":"Could not save classroom user."}' );
        	}
        	die( 'ok<!--separate-->{"message":"Classroom user saved.","ClassroomId":"' . $o->ClassroomID . '","UserID":"' . $o->UserID . '"}' );
        	break;
        case 'paymentstatus':
            if ( isset( $args->userId) && isset( $args->classroomId ) && isset( $args->payment ))
            {
                $q = '
                    UPDATE CC_UserClassroom uc
                    SET uc.PaymentStatus=\''.$args->payment.'\'
                    WHERE uc.UserID='.$args->userId.'
                    AND uc.ClassroomID='.$args->classroomId.'
                ';
                
                $r = $courseDb->query( $q );
                $uq = '
                    SELECT * FROM CC_UserClassroom uc
                    WHERE uc.UserID='.$args->userId.'
                    AND uc.ClassroomID='.$args->classroomId.'
                ';
                $upd = $courseDb->fetchObjects( $uq )[0];
                die( 'ok<!--separate-->'.json_encode( $upd ));
            }
            else
            {
                die( 'fail<!--separate-->' . json_encode(
                    [
                        'message'  => 'invalid arguments',
                        'endpoint' => 'classrooms/paymentstatus',
                        'args'     => $args,
                        'expected' => [ 'userId', 'classroomId', 'payment' ],
                    ]
                ));
            }
            break;
        case 'addnews':
        	if( isset( $args->classroomId ) && isset( $args->message ) )
        	{
		    	$n = new dbIO( 'CC_NewsBulletin', $courseDb );
		    	$n->UserID = $User->ID;
		    	$n->DateCreated = date( 'Y-m-d H:i:s' );
		    	$n->DateUpdated = $n->DateCreated;
		    	$n->ClassroomID = $args->classroomId;
		    	$n->Message = $args->message;
		    	if( $n->Save() )
		    	{
		    		die( 'ok<!--separate-->{"message":"News message saved.","response":1}' );
		    	}
		    }
		    die( 'fail<!--separate-->{"message":"Could not add news message.","response":-1}' );
	        break;
        case 'getnews':
        	if( isset( $args->classroomId ) ) 
        	{
        		if( $rows = $courseDb->fetchObjects( '
        			SELECT * FROM CC_NewsBulletin WHERE ClassroomID=\'' . $args->classroomId . '\' ORDER BY DateCreated DESC
        		' ) )
        		{
        			die( 'ok<!--separate-->' . json_encode( $rows ) );
        		}
        	}
        	die( 'fail<!--separate-->{"message":"No news.","response":-1}' );
        	break;
        case 'refreshrooms':
            {
                $q = '
                    SELECT
                        C.*,
                        count( UC.UserID ) AS Users
                    FROM CC_Classroom AS C
                    LEFT JOIN CC_UserClassroom AS UC
                        ON C.ID = UC.ClassroomID
                    WHERE ( ( C.Status !=0 ) OR ( C.Status=0 AND C.OwnerID='.$User->ID.' ) ) AND C.Status != 3
                    GROUP BY C.ID
                    ORDER BY C.ID DESC
                ';
                if( $rows = $courseDb->fetchObjects( $q ) )
                {
                    $out = [];
                    foreach( $rows as $row )
                    {
                        $obj = new stdClass();
                        $obj->ID = $row->ID;
                        $obj->Name = $row->Name;
                        if ( isset( $row->Status ))
                            $obj->Status = intval( $row->Status, 10 );
                        
                        $o = new dbIO( 'FUser' );
                        $o->Load( $row->OwnerID );
                        $obj->Owner = $o->ID ? $o->FullName : ( 'Unknown' . $o->ID . ' or ' . $row->OwnerID );
                        
                        $obj->Users = $row->Users;
                        $obj->CourseID = $row->CourseID;
                        
                        if( isset( $row->EndDate ) )
                            $obj->DateEnd = $row->EndDate;
                        
                        if( isset( $row->StartDate ) )
                            $obj->DateStart = $row->StartDate;
                        
                        $obj->DateCreated = $row->DateCreated;
                        $obj->DateUpdated = $row->DateUpdated;
                        
                        $out[] = $obj;
                    }
                    die( 'ok<!--separate-->' . json_encode( $out ) );
                }
                else
                    die( 'fail<!--separate-->'.json_encode([
                        'message' => 'failed to load classrooms',
                        'q' => $q,
                    ]) );
            }
            
            break;
        case 'loadtemplate':
            {
                if( substr( $args->template, 0, 1 ) == '.' ) die( 'fail' );
                $tpl = __DIR__ . '/classrooms/tpl_' . $args->template . '.html';
                if( file_exists( $tpl ) )
                {
                    die( 'ok<!--separate-->' . file_get_contents( $tpl ) );
                }
            }
            break;
        case 'saveclassroom':
            if( isset( $args->data ) )
            {
                $n = new dbIO( 'CC_Classroom', $courseDb );
                if( isset( $args->data->id ) && $args->data->id > 0 )
                {
                    $n->Load( $args->data->id );
                }
                else
                {
                    $n->DateCreated = date( 'Y-m-d H:i:s' );
                    $n->StartDate = $n->DateCreated;
                    $n->EndDate = date( 'Y-m-d H:i:s', strtotime( $n->DateCreated ) + ( 60 * 60 * 24 * 7 ) );
                }
                
                $n->DateUpdated = date( 'Y-m-d H:i:s' );
                $n->OwnerID = $User->ID;
                $n->Name = $args->data->name;
                
                $clone = false;
                
                // Course have changed! Delete everything related to previous course
                if( $n->CourseID > 0 && $n->CourseID != $args->data->courseId )
                {
                	$course = new dbIO( 'CC_Course', $courseDb );
                	if( $course->Load( $n->CourseID ) )
                	{
		            	// Only remove course data from clones
		            	if( $course->ParentID > 0 )
		            	{
				        	if( removeCourseDataFromClassroom( $n->CourseID, $n->ID ) )
				        	{
						    	// Also copy the new course
						    	if( !( $clone = copyCourseDataToClassroom( $args->data->courseId, $n->ID ) ) )
						    	{
						    		die( 'fail<!--separate-->{"message":"Could not clone template for connected course.","response":-1}' );
						    	}
						    }
						    else
						    {
						    	die( 'fail<!--separate-->{"message":"Could not remove clone for connected course.","response":-1}' );
						    }
						}
						// Copy the new course from template
						else if( !( $clone = copyCourseDataToClassroom( $args->data->courseId, $n->ID ) ) )
				    	{
				    		die( 'fail<!--separate-->{"message":"Could not clone template for connected course.","response":-1}' );
				    	}
				    	else
						{
							die( 'fail<!--separate-->{"message":"Could not clone template.","response":-1}' );
						}
				    }
				    else
				    {
				    	die( 'fail<!--separate-->{"message":"Could not load previously connected course.","response":-1}' );
				    }
                }
                // We are adding a course for the first time
                else if( $n->CourseID == 0 )
                {
                	// Also copy the new course
			    	if( !( $clone = copyCourseDataToClassroom( $args->data->courseId, $n->ID ) ) )
			    	{
			    		die( 'fail<!--separate-->{"message":"Could not clone template for connected course, on top of empty slot.","response":-1}' );
			    	}
                }
                
                if( !$clone )
                {
                	die( 'fail<!--separate-->{"message":"Failed to make clone of course template.","response":-1}' );
                }
                
                $n->CourseID = $clone->ID;
                
                if ( isset( $args->data->status ))
                    $n->Status = intval( $args->data->status, 10 );
                if( !isset( $args->data->startDate ) || !trim( $args->data->startDate ) )
                    $args->data->startDate = date( 'Y-m-d' );
                $n->StartDate = $args->data->startDate . ' 00:00:00';
                if( !isset( $args->data->endDate ) || !trim( $args->data->endDate ) )
                    $args->data->endDate = date( 'Y-m-d' );
                $n->EndDate = $args->data->endDate . ' 23:59:59';
                $n->Save();
                $q = $n->_lastQuery;
                if( $n->ID > 0 )
                {
                    $rq = '
                        SELECT cl.* FROM CC_Classroom cl WHERE cl.ID='. $n->ID .'
                    ';
                    $cl = $courseDb->fetchObjects( $rq );
                    if ( isset( $cl[0]->Status ))
                        $cl[0]->Status = intval( $cl[0]->Status, 10 );
                    
                    die( 'ok<!--separate-->' . json_encode($cl[ 0 ]));
                }
                die( 'fail<!--separate-->{"message":"Failed to save classroom."}<!--separate-->' . $q );
            }
            else
            {
                die( 'fail<!--separate-->{"message":"Failed to save classroom because data structure was empty."}' );
            }
            break;
        case 'getclassroom':
            if( isset( $args->classroomId ) )
            {
                $c = new dbIO( 'CC_Classroom', $courseDb );
                if( $c->Load( $args->classroomId ) )
                {
                    $cl = new stdClass();
                    $cl->ID = $c->ID;
                    if ( isset( $c->Status ))
                        $cl->Status = intval( $c->Status, 10 );
                    $cl->Name = $c->Name;
                    $cl->CourseID = $c->CourseID;
                    $cl->StartDate = explode( ' ', $c->StartDate )[0];
                    $cl->EndDate = explode( ' ', $c->EndDate )[0];
                    die( 'ok<!--separate-->' . json_encode( $cl ) );
                }
                die( 'fail<!--separate-->{"message":"Could not load classroom by id."}' );
            }
            else
            {
                die( 'fail<!--separate-->'.json_encode([
                    'error'    => 'missing classroomId',
                    'endpoint' => 'getclassroom',
                    'args'     => $args,
                ]));
            }
            break;
        case 'removeclassroom':
            if( isset( $args->classroomId ) )
            {
                $rq = '
                    DELETE FROM CC_Classroom WHERE ID='.intval( $args->classroomId, 10 ).'
                ';
                $res = $courseDb->query( $rq );
                die( 'ok<!--separate-->'.json_encode([
                    'res' => $res,
                    'rq'  => $rq,
                ]));
            }
            else
            {
                die( 'fail<!--separate-->' . json_encode([
                    'message' => 'missing classroomId',
                    'args'    => $args,
                ]));
            }
            break;
        case 'movetotrash':
        	if( isset( $args->classroomId ) )
        	{
        		$d = new dbIO( 'CC_Classroom', $courseDb );
        		if( $d->Load( $args->classroomId ) )
        		{
        			$d->Status = 3;
        			$d->Save();
        			die( 'ok<!--separate-->{"message":"Classroom saved, moved to trash.","response":1}' );
        		}
        	}
        	die( 'fail<!--separate-->{"message":"Could not move classroom to trash.","response":-1}' );
        case 'classroomcourses':
        	if( isset( $args->classroomId ) )
        	{
        		if( $rows = $courseDb->fetchObjects( '
        			SELECT * FROM CC_Course 
                    WHERE IsDeleted=0
                    AND Status!=0
        			ORDER BY DateCreated DESC
        		' ) )
        		{
        			die( 'ok<!--separate-->' . json_encode( $rows ) );
        		}
        		die( 'fail<!--separate-->{"message":"No classrooms available."}' );
        	}
            else
            {
                if( $rows = $courseDb->fetchObjects( '
                    SELECT * FROM CC_Course
                    WHERE IsDeleted=0
                    AND Status!=0
                    ORDER BY DateCreated DESC
                ' ) )
                {
                    die( 'ok<!--separate-->' . json_encode( $rows ) );
                }
                die( 'fail<!--separate-->{"message":"No classrooms available."}' );
            }
        	//die( 'fail<!--separate-->{"message":"No classroom specified."}' );
        	break;
    }
    die( 'fail' );
}

$t = file_get_contents( __DIR__ . '/classrooms/tpl_main.html' );
die( 'ok<!--separate-->' . $t );

?>
