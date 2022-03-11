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

if( !isset( $args->args->command ) ) die( 'fail' );

// Import database class from Course Creator
require( __DIR__ . '/../../CourseCreator/Module/classes/database.php' );

// Instance our class!
$db = new CourseDatabase();

// Check calls
switch( $args->args->command )
{
	/* General */
	case 'getmodule':
		$mod = $args->args->moduleName;
		$mod = str_replace( array( '/', '..' ), '', $mod );
		if( file_exists( __DIR__ . '/mod_' . $mod . '/template.html' ) )
		{
			die( 'ok<!--separate-->' . file_get_contents( __DIR__ . '/mod_' . $mod . '/template.html' ) );
		}
		die( 'fail<!--separate-->{"message":"No such template found.","response":-1}' );
		break;
	case 'gettemplate':
		if( !isset( $args->args->moduleName ) )
		{
			die( 'fail<!--separate-->{"message":"No module requested.","response":-1}' );
		}
		$mod = $args->args->moduleName;
		$mod = str_replace( array( '/', '..' ), '', $mod );
		$tpl = $args->args->template;
		$tpl = str_replace( array( '/', '..' ), '', $tpl );
		if( file_exists( __DIR__ . '/mod_' . $mod . '/' . $tpl . '.html' ) )
		{
			die( 'ok<!--separate-->' . file_get_contents( __DIR__ . '/mod_' . $mod . '/' . $tpl . '.html' ) );
		}
		die( 'fail<!--separate-->{"message":"No such template found","response":-1}' );
		break;
	/* Classrooms */
	case 'listclassrooms':
		if( $rows = $db->database->fetchObjects( '
			SELECT 
				cr.* 
			FROM 
				CC_UserClassroom uc, 
				CC_Classroom cr 
			WHERE 
				uc.ClassroomID = cr.ID AND 
				uc.UserID=\'' . intval( $User->ID, 10 ) . '\'
			ORDER BY 
				cr.StartDate DESC
		' ) )
		{
			die( 'ok<!--separate-->' . json_encode( $rows ) );
		}
		die( 'fail<!--separate-->{"message":"Could not find any classrooms for this user.","response":-1}' );
	// List sections in course
	case 'listsections':
		if( $rows = $db->database->fetchObjects( '
			SELECT * FROM CC_Section WHERE CourseID=\'' . intval( $args->args->courseId, 10 ) . '\' ORDER BY DisplayID ASC
		' ) )
		{
			die( 'ok<!--separate-->' . json_encode( $rows ) );
		}
		die( 'fail<!--separate-->{"message":"Could not find sections for this course.","response":-1}' );
	// Just get the basic course definition
	case 'getcourse':
		if( $row = $db->database->fetchObject( '
			SELECT * FROM CC_Course WHERE ID=\'' . intval( $args->args->courseId, 10 ) . '\'
		' ) )
		{
			die( 'ok<!--separate-->' . json_encode( $row ) );
		}
		die( 'fail<!--separate-->{"message":"Could not find this course.","response":-1}' );
	case 'getcoursebyclassroom':
		if( $row = $db->database->fetchObject( '
			SELECT 
				c.*, 
				cl.StartDate AS ClassStartDate, 
				cl.EndDate AS ClassEndDate 
			FROM 
				CC_Course c, CC_Classroom cl 
			WHERE 
				cl.ID=\'' . intval( $args->args->courseId, 10 ) . '\' AND 
				c.ID = cl.CourseID
		' ) )
		{
			$status = new dbIO( 'CC_CourseSession', $db->database );
			$status->CourseID = $row->ID;
			$status->UserID = $User->ID;
			if( $status->Load() )
			{
				$row->Status = $status->Status;
			}
			else
			{
				$row->Status = 0;
			}
			
			die( 'ok<!--separate-->' . json_encode( $row ) );
		}
		die( 'fail<!--separate-->{"message":"Could not find this course.","response":-1}' );
		break;
	// Get an image based on elementId
	case 'getcourseimage':
		if( $o = $db->database->fetchObject( '
			SELECT * FROM CC_File 
			WHERE 
				ElementID=\'' . intval( $args->args->elementId, 10 ) . '\' AND 
				CourseID=\'' . intval( $args->args->courseId, 10 ) . '\'
		' ) )
		{
			if( $args->args->mode == 'test' )
			{
				die( 'ok<!--separate-->' );
			}
			else if( $args->args->mode == 'data' )
			{
				// Load storage setting
				$s = new dbIO( 'FSetting' );
		        $s->Type = 'CourseCreator';
		        $s->Key = 'Storage';
		        if( !$s->Load() )
		        {
		            die( 'fail<!--separate-->{"message":"Could not read server setting."}' );
		        }
		        $cs = json_decode( $s->Data );
		        
		        // Check storage path
		        $toPath = $Config->FCUpload;
		        $toPath .= $cs->path;
		        $ccok = file_exists( $toPath );
		        if ( !$ccok )
		        {
		            die( 'fail<!--separate-->{"message":"Course file database is uninitialized."}' );
		        }
				// Check if image exists
				if( file_exists( $toPath . '/' . $o->Filename ) )
				{ 			
					// Return image
					die( file_get_contents( $toPath .'/' . $o->Filename ) );
				}
				die( null );
			}
		}
		die( 'fail<!--separate-->{"message":"Could not get image based on elementId.","response":-1,}' );
		break;
	// Load the entire course structure
	case 'loadcoursestructure':
		if( $rows = $db->database->fetchObjects( '
			SELECT * FROM
			(
				SELECT 
					p.ID, p.Name, p.DisplayID, p.DateCreated, p.DateUpdated, "Page" as `Type`, s.ID as `SectionID`, 0 as Navigation
				FROM 
					CC_Page p, CC_Section s
				WHERE
					p.SectionID = s.ID AND 
					s.CourseID = \'' . intval( $args->args->courseId, 10 ) . '\'
			) AS NR1
			UNION
			(
				SELECT 
					d.ID, d.Name, d.DisplayID, d.DateCreated, d.DateUpdated, "Section" as `Type`, 0 as `SectionID`, d.FreeNavigation as Navigation
				FROM 
					CC_Section d
				WHERE
					d.CourseID = \'' . intval( $args->args->courseId, 10 ) . '\'
			)
			ORDER BY `Type` DESC, DisplayID ASC
		' ) )
		{
			die( 'ok<!--separate-->' . json_encode( $rows ) );
		}
		die( 'fail<!--separate-->{"message":"Could not find course structure.","response":-1}' );
	case 'loadpageelements':
		if( $rows = $db->database->fetchObjects( '
			SELECT t.Name AS ElementType, e.* FROM
				CC_Element e, CC_ElementType t
			WHERE
				e.ElementTypeID = t.ID AND
				e.PageID = \'' . intval( $args->args->pageId, 10 ) . '\'
			ORDER BY e.DisplayID ASC
		' ) )
		{
			die( 'ok<!--separate-->' . json_encode( $rows ) );
		}
		die( 'fail<!--separate-->{"message":"No page elements found.","response":-1}' );
		break;
	// Register element value
	// TODO: Make sure to add security here! The course session must be active
	case 'regelementvalue':
		$d =& $db->database->_link;
		$o = new dbIO( 'CC_ElementResult', $db->database );
		$o->ElementID = $d->real_escape_string( $args->args->uniqueName );
		$o->UserID = intval( $User->ID, 10 );
		$o->CourseID = intval( $args->args->courseId, 10 );
		$o->CourseSessionID = intval( $args->args->courseSessionId, 10 );
		if( !$o->Load() )
		{
			$o->DateCreated = date( 'Y-m-d H:i:s' );
		}
		$o->Data = $d->real_escape_string( $args->args->value );
		$o->DateUpdated = date( 'Y-m-d H:i:s' );
		$o->Save();
		if( $o->ID > 0 )
		{
			die( 'ok<!--separate-->{"response":1,"message":"Stored element value."}' );
		}
		die( 'fail<!--separate-->{"response":-1,"message":"Could not store element value."}' );
		break;
	// Get element value
	case 'getelementvalue':
		if( $row = $db->database->fetchObject( '
			SELECT * FROM CC_ElementResult
			WHERE
				UserID=\'' . intval( $User->ID, 10 ) . '\' AND
				ElementID=\'' . $db->database->_link->real_escape_string( $args->args->uniqueName ) . '\' AND
				CourseID=\'' . intval( $args->args->courseId, 10 ) . '\' AND
				CourseSessionID=\'' . intval( $args->args->courseSessionId, 10 ) . '\'
		' ) )
		{
			$o = new stdClass();
			$o->Value = $row->Data;
			$o->UniqueName = $row->ElementID;
			$o->DateCreated = $row->DateCreated;
			$o->DateUpdated = $row->DateUpdated;
			die( 'ok<!--separate-->' . json_encode( $o ) );
		}
		die( 'fail<!--separate-->{"response":-1,"message":"Could not retrieve element value."}' );
		break;
	// Get / create active course session
	case 'getcoursesession':
		$d = new dbIO( 'CC_CourseSession', $db->database );
		$d->Status = 1;
		$d->UserID = $User->ID;
		$d->CourseID = $args->args->courseId;
		$d->Load();
		if( $d->ID > 0 ) die( 'ok<!--separate-->{"courseId":' . $d->CourseID . ',"courseSessionId":' . $d->ID . '}' );
		else
		{
			$d->DateCreated = date( 'Y-m-d H:i:s' );
			$d->Save();
			if( $d->ID > 0 )
			{
				die( 'ok<!--separate-->{"courseId":' . $d->CourseID . ',"courseSessionId":' . $d->ID . '}' );
			}
			die( 'fail<!--separate-->{"message":"Could not store active course session.","response":-1}' );
		}
		die( 'fail<!--separate-->{"message":"Could not get active course session.","response":-1}' );
		break;
}
die( 'fail<!--separate-->{"message":"Unknown appmodule method.","response":-1}' );

?>
