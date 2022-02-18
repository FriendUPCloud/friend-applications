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

if( isset( $args->method ) )
{
    switch( $args->method )
    {
        case 'refreshusers':
            if( $rows = $courseDb->fetchObjects( '
                SELECT u.*, crt.ID AS CertID, crt.CertName FROM 
                    CC_Classroom c, CC_UserClassroom u
                LEFT JOIN CC_Certificate crt
                    ON u.UserID=crt.UserID AND crt.ClassID=\'' . intval( $args->classroomId, 10 ) . '\'
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
        case 'refreshrooms':
            {
                if( $rows = $courseDb->fetchObjects( '
                    SELECT
                        C.*,
                        count( UC.UserID ) AS Users
                    FROM CC_Classroom AS C
                    LEFT JOIN CC_UserClassroom AS UC
                        ON C.ID = UC.ClassroomID
                    GROUP BY C.ID
                    ORDER BY C.ID DESC
                ' ) )
                {
                    $out = [];
                    foreach( $rows as $row )
                    {
                        $obj = new stdClass();
                        $obj->ID = $row->ID;
                        $obj->Name = $row->Name;
                        
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
            }
            die( 'fail<!--separate-->{"message":"Failed to load classrooms."}' );
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
                $n->CourseID = $args->data->collectionId;
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
                    die( 'ok<!--separate-->{"ID":' . $n->ID . '}' );
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
                    $cl->Name = $c->Name;
                    $cl->CourseID = $c->CourseID;
                    $cl->StartDate = explode( ' ', $c->StartDate )[0];
                    $cl->EndDate = explode( ' ', $c->EndDate )[0];
                    die( 'ok<!--separate-->' . json_encode( $cl ) );
                }
                die( 'fail<!--separate-->{"message":"Could not load classroom by id."}' );
            }
            break;
        case 'classroomcourses':
        	if( isset( $args->classroomId ) )
        	{
        		if( $rows = $courseDb->fetchObjects( '
        			SELECT * FROM CC_Course WHERE IsDeleted = 0
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
