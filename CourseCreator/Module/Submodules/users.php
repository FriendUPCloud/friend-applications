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

global $User, $SqlDatabase, $Config, $UserSession;

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
                        ON u.ID=s.UserID AND s.Key=\'locale\'
                    WHERE u.ID=' . intval( $args->userId, 10 ) . '
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
                    die( 'fail<!--separate-->{"response":0,"message":"Failed to load user.","userId":' . $args->userId . '}' );
                }
            }
            die( 'fail<!--separate-->' . json_encode( $args ) );
            break;
        // load classrooms for a user
        case 'classrooms':
            if ( !isset( $args->userId ))
            {
                die( 'fail<!--separate-->' . json_encode( [ 'missing userId', $args ]) );
            }
            
            $uid = intval( $args->userId, 10 );
            $q = '
                SELECT
                    uc.ID,
                    uc.Status,
                    cr.ID AS ClassroomID,
                    cr.Name AS ClassName,
                    cr.StartDate,
                    cr.EndDate,
                    cu.ID AS CourseID,
                    cu.Name AS CourseName
                FROM CC_UserClassroom uc
                LEFT JOIN CC_Classroom cr
                    ON uc.ClassroomID=cr.ID
                LEFT JOIN CC_Course cu
                    ON cr.CourseID=cu.ID
                WHERE uc.UserID=' . $uid . '
            ';
            $rows = $courseDb->fetchObjects( $q );
            die( 'ok<!--separate-->' . json_encode( $rows ));
            
            break;
        // List workgroups relative to a user
        case 'getcerts':
            if( isset( $args->userId ))
            {
                $uid = intval( $args->userId, 10 );
                $q = '
                    SELECT c.*  FROM CC_Certificate c
                    WHERE c.UserID=' . $uid . '
                ';
                
                
                $rows = $courseDb->fetchObjects( $q );
                /*
                die( 'ok<!--separate-->' . json_encode([
                    'args' => $args,
                    'uid' => $uid,
                    'q' => $q,
                    'rows' => $rows,
                ]));
                */
                
                die( 'ok<!--separate-->' . json_encode( $rows ));
            }
            else
            {
                die( 'fail<!--separate-->' . json_encode( [ 'error' => 'missing args', 'received' => $args ] ) );
            }
            break;
        case 'addcert':
            if( isset( $args->userId ) && isset( $args->cert ) )
            {
                // collect inputs
                $d = getcwd();
                require_once( $d . '/php/friend.php' ); // FriendCall
                $uid = intval( $args->userId, 10 );
                $to = new dbIO( 'FUser' );
                $to->Load( $uid );
                if ( !$to || !isset( $to->UniqueID ))
                    die( 'fail<!--separate-->' . json_encode([
                        'message' => 'user not found or uniqueId missing',
                        'userId'  => $uid,
                        'user'    => $to,
                    ] ));
                
                $cert = $args->cert;
                $s = new dbIO( 'FSetting' );
                $s->Type = 'CourseCreator';
                $s->Key = 'Storage';
                if( !$s->Load() ) {
                    die( 'fail<!--separate-->{"message":"Could not read server setting"}' );
                }
                
                if ( !isset( $s->Data ))
                    die( 'fail<!--separate-->' . json_encode( [ 
                        'message' => 'missing server setting',
                        'setting' => $s,
                    ] ));
                
                $cs = json_decode( $s->Data );
                if ( !isset( $cs->path ))
                    die( 'fail<!--separate-->' . json_encode( [
                        'message' => 'server setting missing path',
                        'setting' => $cs,
                    ] ));
                
                // check if the cert file exists
                $check = ( $Config->SSLEnable ? 'https://' : 'http://' ) .
                    $Config->FCHost . ':' . $Config->FCPort . '/system.library/file/info';
                
                $cp = [
                    'servertoken' => $User->ServerToken,
                    'path'        => $cert->UserFilePath,
                ];
                
                $fok = FriendCall( $check, null, $cp );
                if ( !$fok )
                    die( 'fail<!--separate-->' . json_encode( [
                        'message' => 'friendcall failed',
                    ] ));
                
                $fok = explode( '<!--separate-->', $fok );
                $fnfo = $fok[1];
                if ( 'fail' == $fok[0] )
                {
                    die( 'fail<!--separate-->' . json_encode( [
                        'message' => 'file not found',
                        'path'    => $cert->UserFilePath,
                        'err'     => $fok,
                    ] ));
                }
                else
                {
                    $fnfo = json_decode( $fnfo );
                }
                
                $fp = explode( '.', $cert->UserFileName );
                $fext = array_pop( $fp );
                $fnm = implode( '.', $fp );
                
                // load file
                $dl = ( $Config->SSLEnable ? 'https://' : 'http://' ) .
                    $Config->FCHost . ':' . $Config->FCPort . '/system.library/file/read';
                $dlp = [
                    'servertoken' => $User->ServerToken,
                    'path'        => $cert->UserFilePath,
                    'download'    => 1,
                    'mode'        => 'rb',
                ];
                $file = FriendCall( $dl, null, $dlp );
                $fh = md5( $file );
                
                // check storage path
                $toPath = $Config->FCUpload;
                $toPath .= $cs->path;
                $ccok = file_exists( $toPath );
                if ( !$ccok )
                {
                    mkdir( $toPath );
                }
                
                $toPath .= '/' . $to->UniqueID;
                $uok = file_exists( $toPath );
                if ( !$uok )
                {
                    mkdir( $toPath );
                }
                
                $toPath .= '/certs';
                $crtok = file_exists( $toPath );
                if ( !$crtok )
                {
                    mkdir( $toPath );
                }
                
                $allok = file_exists( $toPath );
                
                // save file, maybe
                $cwp = $toPath . '/' . $fh . '.' . $fext;
                $exists = file_exists( $cwp );
                if ( false == $exists ) {
                    $wok = file_put_contents( $cwp, $file );
                    if ( false == $wok )
                        die( 'fail<!--separate-->' . json_encode([
                            'message' => 'failed to write cert file',
                            'path'    => $cwp,
                        ] ));
                    
                    $os = intval( $fnfo->Filesize, 10 );
                    if ( $wok != $os )
                    {
                        unlink( $cwp );
                        die( 'fail<!--separate-->' . json_encode([
                            'message'       => 'writing cert did not complete',
                            'cert bytes'    => $os,
                            'written bytes' => $wok,
                        ]));
                    }
                }
                
                // insert into db
                $vals = [ 
                    $uid, 
                    '\'' . $fnm . '.' . $fext . '\'',
                    '\'' . $fh . '\'', 
                    '\'' . $fext . '\'', 
                ];
                $q = '
                    INSERT INTO CC_Certificate (
                        UserID,
                        CertName,
                        FileName,
                        FileExt
                    ) VALUES (' . implode( ',', $vals ). ')
                ';
                
                $iok = $courseDb->Query( $q );
                if ( false == $iok )
                {
                    unlink( $cwp );
                    die( 'fail<!--separate-->' . json_encode([
                        'message' => 'db insert failed, reason unknown',
                        'query'   => $q,
                    ] ));
                }
                
                $qr = '
                    SELECT c.* FROM CC_Certificate c
                    WHERE c.CertName=\'' . $fnm . '.' . $fext . '\' 
                    ORDER BY c.ID
                ';
                $rows = $courseDb->fetchObjects( $qr );
                if ( !$rows )
                {
                    unlink( $cwp );
                    die( 'fail<!--separate-->' . json_encode([
                        'message' => 'failed to read db',
                        'query'   => $qr,
                    ] ));
                }
                
                $lr = array_pop( $rows );
                $lr->url = $cwp;
                
                // return stored cert info
                die( 'ok<!--separate-->' .json_encode( $lr ));
                
                /*
                die( 'ok<!--separate-->' . json_encode( [ 
                    'd' => $d,
                    'cs' => $cs,
                    'cert' => $cert,
                    's' => $s,
                    'Config' => $Config,
                    'User' => $User,
                    'to' => $to,
                    'toPath' => $toPath,
                    'fnfo' => $fnfo,
                    'fext' => $fext,
                    'fnm' => $fnm,
                    'fh' => $fh,
                    'dl' => $dl,
                    'dlp' => $dlp,
                    'args' => $args,
                    'usersession' => $UserSession,
                    'check' => $check,
                    'cp' => $cp,
                    'fok' => $fok,
                    'ccok' => $ccok,
                    'uok' => $uok,
                    'crtok' => $crtok,
                    'allok' => $allok,
                    'cwp' => $cwp,
                    'wok' => $wok,
                    'vals' => $vals,
                    'q' => $q,
                    'qr' => $qr,
                    'rows' => $rows,
                    'lr' => $lr,
                 ] ));
                 */
                 
                
            }
            else
            {
                die( 'fail<!--separate-->' . json_encode( [ 'error' => 'missing args', 'received' => $args ] ) );
            }
            break;
        case 'removecert':
            if( isset( $args->userId ) && isset( $args->certId ) )
            {
                // find cert in db
                $uid = intval( $args->userId, 10 );
                $cid = intval( $args->certId, 10 );
                $cq = '
                    SELECT c.* FROM CC_Certificate c
                    WHERE c.ID=' . $cid . '
                    AND c.UserID=' . $uid . '
                ';
                $crs = $courseDb->fetchObjects( $cq );
                if ( !$crs )
                    die( 'fail<!--separate-->' . json_encode([
                        'message' => 'query failed',
                        'query'   => $rq,
                        'res'     => $crs,
                    ]));
                
                $c = $crs[0];
                if ( !$c )
                    die( 'fail<!--separate-->' . json_encode([
                        'message' => 'cert was not found',
                        'userId' => $uid,
                        'certId' => $cid,
                    ]));
                
                $rq = '
                    SELECT count(*) AS roos FROM CC_Certificate c
                    WHERE c.UserID=\''.$uid.'\'
                    AND c.FileName=\'' . $c->FileName . '\'
                ';
                $rrs = $courseDb->fetchObjects( $rq );
                $fnum = $rrs[0]->roos;
                $fPath = '';
                $yep = false;
                if ( 1 == $fnum )
                {
                    $usr = new dbIO( 'FUser' );
                    $usr->Load( $uid );
                    if ( !$usr || !isset( $usr->UniqueID ))
                        die( 'fail<!--separate-->' . json_encode([
                            'message' => 'user not found or uniqueId missing',
                            'userId'  => $uid,
                            'user'    => $to,
                        ] ));
                    
                    $s = new dbIO( 'FSetting' );
                    $s->Type = 'CourseCreator';
                    $s->Key = 'Storage';
                    if( !$s->Load() ) {
                        die( 'fail<!--separate-->{"message":"Could not read server setting"}' );
                    }
                    
                    if ( !isset( $s->Data ))
                        die( 'fail<!--separate-->' . json_encode( [ 
                            'message' => 'missing server setting',
                            'setting' => $s,
                        ] ));
                    
                    $cs = json_decode( $s->Data );
                    if ( !isset( $cs->path ))
                        die( 'fail<!--separate-->' . json_encode( [
                            'message' => 'server setting missing path',
                            'setting' => $cs,
                        ] ));
                    
                    $fPath = $Config->FCUpload;
                    $fPath .= $cs->path . '/' . $usr->UniqueID . '/certs/';
                    $fPath .= $c->FileName . '.' . $c->FileExt;
                    $yep = file_exists( $fPath );
                    if ( $yep )
                        unlink( $fPath );
                }
                
                $dq = '
                    DELETE FROM CC_Certificate c
                    WHERE c.ID=' . $c->ID . '
                ';
                $dr = $courseDb->Query( $dq );
                
                die( 'ok<!--separate-->' . json_encode( [
                    'uid'   => $uid,
                    'cid'   => $cid,
                    'cq'    => $cq,
                    'crs'   => $crs,
                    'c'     => $c,
                    'rq'    => $rq,
                    'rrs'   => $rrs,
                    'fnum'  => $fnum,
                    'fPath' => $fPath,
                    'yep'   => $yep,
                    'dq'    => $dq,
                    'dr'    => $dr,
                ] ));
                
                
                // find file in storage
                
                // delete from storage
                
                // delete from db
                
                // return happy
                
            }
            else
            {
                die( 'fail<!--separate-->' . json_encode( [ 'error' => 'missing args', 'received' => $args ] ) );
            }
            break;
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
