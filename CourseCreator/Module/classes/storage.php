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

require_once( getcwd() . '/php/friend.php' ); // FriendCall

class StorageObject
{
	function __construct( $relativeFolder = 'temp', $userId = false )
	{
		global $User;
		
		if( !$userId )
			$userId = $User->ID;
		
		$uid = intval( $userId, 10 );
		$cid = null;
		
		// Grab user
		$to = new dbIO( 'FUser' );
		$to->Load( $uid );
		if( !$to || !isset( $to->UniqueID ) )
		{
			die( 'fail<!--separate-->' . json_encode( [
				'message' => 'user not found or uniqueId missing',
				'userId'  => $uid,
				'user'    => $to,
			] ) );
		}
		$this->user = &$to;

		$s = new dbIO( 'FSetting' );
		$s->Type = 'CourseCreator';
		$s->Key = 'Storage';
		if( !$s->Load() )
		{
			die( 'fail<!--separate-->{"message":"Could not read server setting"}' );
		}
		$this->storage = &$s;
	}
	
	// Stores data on the server side
	function storeData( $data, $filename = false )
	{
		
	}
}


/*

// collect inputs
$d = getcwd();
require_once( $d . '/php/friend.php' ); // FriendCall
$uid = intval( $args->userId, 10 );
$cid = null;
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
if ( isset( $args->classroomId ))
{
    $cid = intval( $args->classroomId, 10 );
    $vals = [ 
        $uid, 
        $cid,
        '\'' . $fnm . '.' . $fext . '\'',
        '\'' . $fh . '\'', 
        '\'' . $fext . '\'', 
    ];
    $q = '
        INSERT INTO CC_Certificate (
            UserID,
            ClassID,
            CertName,
            FileName,
            FileExt
        ) VALUES (' . implode( ',', $vals ). ')
    ';
}
else
{
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
}

$iok = $courseDb->Query( $q );
if ( false == $iok )
{
    unlink( $cwp );
    die( 'fail<!--separate-->' . json_encode([
        'message' => 'db insert failed, reason unknown',
        'query'   => $q,
        'values'  => $vals,
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
*/
?>
