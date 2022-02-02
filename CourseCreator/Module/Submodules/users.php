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
        // TODO: This may be deprecated
        case 'refreshusers':
            break;
        case 'listusers':
            $crows = $courseDb->fetchObjects('
                SELECT DISTINCT uc.UserID FROM CC_UserClassroom uc
            ');
            
            $uids = [];
            foreach( $crows as $u )
            {
                $uids[] = $u->UserID;
            }
            $uidlist = implode( ',', $uids );
            $frows = $SqlDatabase->fetchObjects('
                SELECT
                    u.ID,
                    u.FullName,
                    u.Name,
                    u.LoginTime,
                    u.Status
                FROM FUser u
                WHERE u.ID IN (' . $uidlist . ')
            ');
            
            //$debug = [ $crows, $uids, $uidlist, $frows ];
            die( 'ok<!--separate-->' . json_encode( $frows ));
            break;
        // Load a template
        case 'loadtemplate':
            {
                if( substr( $args->template, 0, 1 ) == '.' ) die( 'fail' );
                $tpl = __DIR__ . '/users/tpl_' . $args->template . '.html';
                if( file_exists( $tpl ) )
                {
                    die( 'ok<!--separate-->' . file_get_contents( $tpl ) );
                }
            }
            break;
        // Load a user account record
        case 'loaduser':
            // TODO: Add security layer
            if( isset( $args->userId ) )
            {
                $q = '
                    SELECT
                        u.ID,
                        u.FullName,
                        u.Name,
                        u.Email,
                        u.Status,
                        s.Data AS Locale
                    FROM FUser AS u
                    LEFT JOIN FSetting AS s
                        ON u.ID=s.UserID
                    WHERE u.ID=' . intval( $args->userId, 10 ) . '
                    AND s.Key=\'locale\'
                ';
                $o = $SqlDatabase->fetchObjects( $q )[0];
                if( $o->ID > 0 )
                {
                    $us = new stdClass();
                    $us->ID = $o->ID;
                    $us->Name = $o->Name;
                    $us->Email = $o->Email;
                    $us->Status = $o->Status;
                    $us->Language = $o->Locale;
                    $us->FullName = $o->FullName;
                    die( 'ok<!--separate-->' . json_encode( $us ) );
                }
                else
                {
                    die( 'fail<!--separate-->' . json_encode( [ $o, $q ] ) );
                }
            }
            die( 'fail<!--separate-->' . json_encode( $args ) );
            break;
        // List workgroups relative to a user
        case 'workgroups':
            // TODO: Add security layer
            if( !isset( $args->userId ) )
            {
                die( 'fail' );
            }
            if( $rows = $SqlDatabase->fetchObjects( '
                SELECT ug.*, fug.UserID AS `Member` FROM 
                    FUserGroup ug 
                    LEFT JOIN FUserToGroup fug 
                        ON ( fug.UserGroupID = ug.ID AND fug.UserID = \'' . intval( $args->userId, 10 ) . '\' )
                WHERE
                    ug.ParentID <= 0 AND
                    ( 
                        ug.Type = "Workgroup" OR
                        ug.Type = "Organization" 
                    )
                ORDER BY ug.Name ASC
            ' ) )
            {
                die( 'ok<!--separate-->' . json_encode( $rows ) );
            }
            die( 'fail<!--separate-->{"message":"Failed to find workgroups or organizations."}' );
            break;
        // Toggle a workgroup membership
        case 'toggleworkgroup':
            // TODO: Add security layer!
            if( $args->relation == true )
            {
                if( !( $SqlDatabase->fetchObject( '
                    SELECT * FROM FUserToGroup WHERE UserID=\'' . intval( $args->userId, 10 ) . '\' AND
                        UserGroupId=\'' . intval( $args->groupId, 10 ) . '\'
                ' ) ) )
                {
                    $SqlDatabase->query( 'INSERT INTO FUserToGroup ( UserID, UserGroupID ) 
                        VALUES ( \'' . intval( $args->userId, 10 ) . '\', \'' . intval( $args->groupId, 10 ) . '\' )' );
                    die( 'ok<!--separate-->{"message":"Group relation toggled on."}' );
                }
                else
                {
                    die( 'ok<!--separate-->{"message":"Group relation already toggled on."}' );
                }
            }
            else
            {
                $SqlDatabase->query( 'DELETE FROM FUserToGroup 
                    WHERE UserID=\'' . intval( $args->userId, 10 ) . '\' AND
                        UserGroupId=\'' . intval( $args->groupId, 10 ) . '\' LIMIT 1' );
                die( 'ok<!--separate-->{"message":"Group relation toggled off."}' );
            }
            die( 'fail<!--separate->{"message":"Failed to locate group."}' );
            break;
        // Toggle locked status on a user account
        case 'updateavatar':
            $f = new dbIO( 'FSetting' );
            $f->UserID = $args->uid;
            $f->Type = 'system';
            $f->Key = 'Avatar';
            $f->Load();
            $f->Data = $args->data;
            $f->Save();
            if( $f->ID > 0 )
            {
                die( 'ok<!--separate-->{"response":1,"message":"Avatar was updated"}' );
            }
            die( 'fail<!--separate-->{"response":0,"message":"Coult not save avatar to user profile."}' );
            break;
        case 'changepassword':
            break;
        default:
            break;
    }
}
else
{
    $t = file_get_contents( __DIR__ . '/users/tpl_main.html' );
    die( 'ok<!--separate-->' . $t );
}

?>
