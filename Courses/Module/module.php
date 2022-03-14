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

// Just get the element types (ID's)
function getInteractiveElementTypes( $db )
{
	$ids = $db->database->fetchObjects( '
		SELECT ID FROM CC_ElementType WHERE `Name` IN ( \'checkBoxQuestion\', \'radioBoxQuestion\' )
	' );
	$out = [];
	foreach( $ids as $i ) $out[] = $i->ID;
	return $out;
}

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
	/* ---------------------------------------------------------------------- */
	/* This part is related to statistics, user progress and so on ---------- */
	/* ---------------------------------------------------------------------- */
	// Tell the system that a page has been read
	case 'setpagestatus':
		if( isset( $args->args ) && isset( $args->args->pageId ) && isset( $args->args->courseSessionId ) )
		{
			$d = new dbIO( 'CC_Page', $db->database );
			if( !$d->Load( $args->args->pageId ) )
			{
				die( 'fail<!--separate-->{"message":"Failed to load page."}' );
			}
			$p = new dbIO( 'CC_PageResult', $db->database );
			$p->PageID = $d->ID;
			$p->CourseSessionID = $args->args->courseSessionId;
			if( !$p->Load() )
			{
				$p->Status = 1;
				$p->DateCreated = date( 'Y-m-d H:i:s' );
				$p->Save();
				die( 'ok<!--separate-->{"message":"Page result stored."}' );
			}
			die( 'fail<!-separate-->{"message":"Page result has already been stored."}' );
		}
		die( 'fail<!--separate-->{"message":"Failed to find page id in arguments."}' );
		break;
	// Check if a section is done on sectionId and courseSessionId
	case 'checksectiondone':
		if( !isset( $args->args ) || !isset( $args->args->sectionId ) || !isset( $args->args->courseSessionId ) )
		{
			die( 'fail<!--separate-->{"message":"Missing args for query.","response":-1}' );
		}
		// Check if we have any page results
		if( $page = $db->database->fetchObjectRow( '
			SELECT p.* FROM CC_PageResult p, CC_Section s, CC_CourseSession cs
			WHERE
				s.ID = \'' . intval( $args->args->sectionId, 10 ) . '\' AND
				cs.ID = \'' . intval( $args->args->courseSessionId, 10 ) . '\' AND
				cs.CourseID = s.CourseID AND
				p.CourseSessionID = cs.ID
			LIMIT 1
		' ) )
		{
			// Check if we have page results that are not "completed status"
			if( $rows = $db->database->fetchObjectRows( '
				SELECT p.* FROM CC_PageResult p, CC_Section s, CC_CourseSession cs
				WHERE
					s.ID = \'' . intval( $args->args->sectionId, 10 ) . '\' AND
					cs.ID = \'' . intval( $args->args->courseSessionId, 10 ) . '\' AND
					cs.CourseID = s.CourseID AND
					p.CourseSessionID = cs.ID AND
					p.Status != \'1\'
			' ) )
			{
				die( 'fail<!--separate->{"message":"This section is not complete.","response":-1}' );
			}
			// Ok, all are completed status
			else
			{
				die( 'ok<!-separate-->{"message":"This section is complete.","response":1}' );
			}
		}
		// Section hasn't even been started on
		die( 'fail<!--separate->{"message":"This section is not complete.","response":-1}' );
		break;
	// Get progress for you (your user) in a selected class
	case 'getclassroomprogress':
		$types = getInteractiveElementTypes( $db );
		
		if( isset( $args->args ) && isset( $args->args->courseSessionId ) )
		{
			$csid = array( intval( $args->args->courseSessionId, 10 ) );
		}
		// Get active sessions frmo classroom ids
		else if( isset( $args->args ) && isset( $args->args->classrooms ) )
		{
			$classrooms = $args->args->classrooms;
			$csid = array();
			foreach( $classrooms as $k=>$v )
			{
				$classrooms[ $k ] = intval( $v, 10 );
			}
			if( $sessions = $db->database->fetchObjects( '
				SELECT s.* FROM CC_CourseSession s, CC_Classroom c WHERE c.ID IN ( ' . implode( ',', $classrooms ) . ' ) AND s.CourseID = c.CourseID
			' ) )
			{
				foreach( $sessions as $sess )
				{
					$csid[] = $sess->CourseID;
				}
			}
			else
			{
				die( 'fail<!--separate-->SELECT s.* FROM CC_CourseSession s, CC_Classroom c WHERE c.ID IN ( ' . implode( ',', $classrooms ) . ' ) AND s.CourseID = c.CourseID' );
			}
		}
		else
		{
			die( 'fail<!--separate-->{"message":"Could not find course session or course ids.","response":-1}' );
		}
		
		$userId = $User->ID;
		
		// Only admins can do this
		if( $level == 'Admin' && isset( $args->args ) && isset( $args->args->userId ) )
		{
			$userId = intval( $args->args->userId, 10 );
		}
		
		// Pass through all sessions
		if( count( $csid ) )
		{
			// Output progress based on course
			$out = new stdClass();
			foreach( $csid as $csi )
			{
				
				// Get classroom
				$cl = new dbIO( 'CC_CourseSession', $db->database );
				$cl->CourseID = $csi;
				$cl->Status = 1;
				if( !$cl->Load() )
				{
					continue;
				}
				
				// Get total element count based on course session
				if( $elementCount = $db->database->fetchObject( '
					SELECT COUNT(e.ID) CNT
					FROM 
						CC_CourseSession s, 
						CC_Element e, 
						CC_Page p, 
						CC_Section se 
					WHERE 
						s.CourseID = s.CourseID AND 
						s.UserID = \'' . $userId . '\' AND 
						p.SectionID = se.ID AND 
						s.CourseID = se.CourseID AND 
						p.ID = e.PageID AND 
						e.ElementTypeID IN ( ' . implode( ',', $types ) . ' ) AND 
						s.ID = ' . $cl->ID . '
				' ) )
				{
					$elementCount = $elementCount->CNT;
					
					// Get elements that were interacted with
					if( $registered = $db->database->fetchObject( '
						SELECT COUNT(ID) AS CNT FROM CC_ElementResult WHERE CourseSessionID = ' . $cl->ID . '
					' ) )
					{
						$registered = $registered->CNT;
						
						$out->{$cl->CourseID} = ( ( $registered / $elementCount ) * 100 );
					}
				}
			}
			die( 'ok<!--separate-->' . json_encode( $out ) );
		}
		// Zero progress
		die( 'fail<!--separate-->{"message":"Could not parse any classroom ids or course session id."}' );
		break;
}
die( 'fail<!--separate-->{"message":"Unknown appmodule method.","response":-1}' );

?>
