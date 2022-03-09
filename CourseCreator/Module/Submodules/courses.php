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

global $Config;

require_once( getcwd() . '/php/friend.php' ); // FriendCall

if( isset( $args->method ) )
{
    switch( $args->method )
    {
    	case 'coursetotrash':
    		$o = new dbIO( 'CC_Course', $courseDb );
    		if( $o->Load( $args->courseId ) )
    		{
    			$o->IsDeleted = 1;
    			if( $o->Save() )
    			{
    				die( 'ok' );
    			}
    		}
    		die( 'fail' );
    	
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
    	
    	case 'getimage':
    		// Get storage path
    		$s = new dbIO( 'FSetting' );
            $s->Type = 'CourseCreator';
            $s->Key = 'Storage';
            if( !$s->Load() ) {
                die( 'fail<!--separate-->{"message":"Could not read server setting"}' );
            }
            $cs = json_decode( $s->Data );
            
            // Check storage path
            $toPath = $Config->FCUpload;
            $toPath .= $cs->path;
            $ccok = file_exists( $toPath );
            if ( !$ccok )
            {
               	die( null );
            }
            
            $o = new dbIO( 'CC_File', $courseDb );
            $o->CourseID = $args->courseId;
            $o->Filename = $args->filename;
            if( $o->Load() )
            {
            	die( file_get_contents( $toPath . '/' . $o->Filename ) );
            }
            die( null );
    	case 'storeimage':
    		// Get storage path
    		$s = new dbIO( 'FSetting' );
            $s->Type = 'CourseCreator';
            $s->Key = 'Storage';
            if( !$s->Load() ) {
                die( 'fail<!--separate-->{"message":"Could not read server setting"}' );
            }
            $cs = json_decode( $s->Data );
            
            // Check storage path
            $toPath = $Config->FCUpload;
            $toPath .= $cs->path;
            $ccok = file_exists( $toPath );
            if ( !$ccok )
            {
                mkdir( $toPath );
            }
    		
    		$o = new Door( $args->imageSource );
    		$f = $o->getFile( $args->imageSource );
    		if( $f )
    		{
				if( $content = $f->GetContent() )
				{
					$bytes = random_bytes(20);
					$filename = bin2hex($bytes);
					if( $fp = fopen( $toPath .'/' . $filename, 'w+' ) )
					{
						if( fwrite( $fp, $content ) )
						{
							fclose( $fp );
							
							$io = new dbIO( 'CC_File', $courseDb );
							$io->Filename = $filename;
							$io->OriginalFilename = strtolower( $args->imageSource );
							$io->ElementID = $args->elementId;
							$io->CourseID = $args->courseId;
							$io->DateCreated = date('Y-m-d H:i:s' );
							$io->Save();
							
							if( $io->ID > 0 )
							{
								die( 'ok<!--separate-->{"message":"File stored successfully.","filename":"' . $filename . '","remotefile":"' . $toPath .'/' . $filename . '","contentlength":"' . strlen( $content ) . '"}' );
							}
						}
						else
						{
							fclose( $fp );
							// Error, clean up
							unlink( $toPath . '/' . $filename );
						}
					}
				}
			}
			die( 'fail<!--separate-->{"message":"Could not get file.","error":-1,"patherror":"' . $toPath . '"}' );
    		break;
    	
    	case 'publishcourse':
    		$o = new dbIO( 'CC_Course', $courseDb );
    		if( $o->Load( $args->courseId ) )
    		{
    			$o->Status = $args->published ? 1 : 0;
    			if( $o->Save() )
    			{
    				die( 'ok' );
    			}
    		}
    		die( 'fail' );
    		
        case 'courses':
        {
            if( $rows = $courseDb->fetchObjects( 'SELECT * FROM CC_Course WHERE IsDeleted = 0 ORDER BY ID DESC' ) )
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
