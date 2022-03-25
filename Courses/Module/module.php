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

global $Config, $User;

if( !isset( $args->args->command ) ) die( 'fail' );

// Import database class from Course Creator
require( __DIR__ . '/../../CourseCreator/Module/classes/database.php' );
require_once( 'helpers.php' );

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
	case 'listcertificates':
		$cq = '
			SELECT c.*, cl.Name as Classroom FROM 
				CC_Certificate AS c,
				CC_Classroom cl
			WHERE 
				c.UserID=\''.$User->ID.'\' AND
				c.ClassID = cl.ID
		';
		$certs = $db->database->fetchObjects( $cq );
		if ( false == $certs )
			$certs = [];
		
		die( 'ok<!--separate-->'.json_encode([
			'openCourses' => false,
			'completedCourses' => false,
			'certificates' => $certs,
			'cq' => $cq,
			'endpoint' => 'getstats',
			'aargs'    => $args->args,
		]));
	/* Classrooms */
	case 'listclassrooms':
		$status = 'AND cr.Status != 3';
		if( isset( $args->args->status )) {
			if ( !$args->args->status )
				$status = '';
			else
				$status = 'AND cr.Status ='.$args->args->status;
		}
		
		$active = '';
		if ( isset( $args->args->active ))
		{
			if ( 'active' == $args->args->active )
				$active = 'AND ( DATE(cr.StartDate) <= CURDATE() ) AND ( DATE(cr.EndDate) >= CURDATE() )';
			if ( 'starting' == $args->args->active )
				$active = 'AND ( DATE(cr.StartDate) > CURDATE() )';
			if ( 'ended' == $args->args->active )
				$active = 'AND ( DATE(cr.EndDate) < CURDATE() )';
		}
	
		$q = '
			SELECT 
				cr.* 
			FROM 
				CC_UserClassroom uc, 
				CC_Classroom cr 
			WHERE 
				uc.ClassroomID = cr.ID
			AND 
				uc.UserID=\'' . intval( $User->ID, 10 ) . '\' AND cr.Status > 0
			' . $status . '
			' . $active . '
			ORDER BY 
				cr.StartDate DESC, ID DESC
		';
			
		if( $rows = $db->database->fetchObjects( $q ) )
		{
			/*
			die( 'ok<!--separate-->' . json_encode( [
				'rows' => $rows,
				'aargs' => $args->args,
				'q' => $q,
			] ) );
			*/
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
			// Update section date
			if( $sect = $db->database->fetchObject( '
				SELECT se.ID FROM CC_Section se, CC_Page p
				WHERE p.ID = \'' . intval( $args->args->pageId, 10 ) . '\' AND p.SectionID = se.ID
			' ) )
			{
				$db->database->query( 'UPDATE CC_Section SET DateUpdated=\'' . date( 'Y-m-d H:i:s' ) . '\' WHERE ID=\'' . $sect->ID . '\' LIMIT 1' );
			}
			die( 'ok<!--separate-->' . json_encode( $rows ) );
		}
		die( 'fail<!--separate-->{"message":"No page elements found.","response":-1,"pageId":' . $args->args->pageId . '}' );
		break;
	// Register element value
	// TODO: Make sure to add security here! The course session must be active
	case 'regelementvalue':
		$d =& $db->database->_link;
		$o = new dbIO( 'CC_ElementResult', $db->database );
		$o->ElementID = $d->real_escape_string( $args->args->uniqueName );
		$o->OriginalElementID = intval( $args->args->elementId, 10 );
		$o->UserID = intval( $User->ID, 10 );
		$o->CourseID = intval( $args->args->courseId, 10 );
		$o->CourseSessionID = intval( $args->args->courseSessionId, 10 );
		if( !$o->Load() )
		{
			if( !$args->args->value )
			{
				die( 'fail<!--separate-->{"response":-1,"message":"Element never existed."}' );
			}
			$o->DateCreated = date( 'Y-m-d H:i:s' );
		}
		if( !$args->args->value )
		{
			$o->Delete();
			die( 'ok<!--separate-->{"response":1,"message":"Element was removed."}' );
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
			SELECT 
				e.* 
			FROM 
				CC_ElementResult e,
				CC_Element ol,
				CC_Page p,
				CC_Section s,
				CC_CourseSession se
				
			WHERE
				e.UserID=\'' . intval( $User->ID, 10 ) . '\' AND
				e.ElementID=\'' . $db->database->_link->real_escape_string( $args->args->uniqueName ) . '\' AND
				e.CourseID=\'' . intval( $args->args->courseId, 10 ) . '\' AND
				e.CourseSessionID=\'' . intval( $args->args->courseSessionId, 10 ) . '\' AND
				
				
				e.OriginalElementID = ol.ID AND
				ol.PageID = p.ID AND
				p.SectionID = s.ID AND
				s.CourseID = se.CourseID AND
				se.ID = e.CourseSessionID
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
	// Get full information about session
	case 'getsessioninfo':
		if( $row = $db->database->fetchObject( '
			SELECT * FROM CC_CourseSession
			WHERE
				ID=\'' . intval( $args->args->courseSessionId, 10 ) . '\' AND
				UserID=\'' . $User->ID . '\'
		' ) )
		{
			die( 'ok<!--separate-->' . json_encode( $row ) );
		}
		die( 'fail<!--separate-->{"message":"Could not get session information.","response":-1}' );
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
	// Set information regarding current session
	case 'setsessioninfo':
		if( isset( $args->args->courseSessionId ) )
		{
			$sess = new dbIO( 'CC_CourseSession', $db->database );
			if( $sess->Load( $args->args->courseSessionId ) )
			{
				$inf = false;
				if( isset( $args->args->currentSectionId ) )
				{
					$sess->CurrentSection = $args->args->currentSectionId;
					$inf = ',"Change":"Section","Value":"' . $sess->CurrentSection . '"';
					$field = 'CurrentSection';
					$value = $sess->CurrentSection;
				}
				if( isset( $args->args->currentPageId ) )
				{
					$sess->CurrentPage = $args->args->currentPageId;
					$inf = ',"Change":"Page","Value":"' . $sess->CurrentPage . '"';
					$field = 'CurrentPage';
					$value = $sess->CurrentPage;
				}
				if( $inf )
				{
					if( $sess->Save() )
					{
						// Double check!
						$sess = new dbIO( 'CC_CourseSession', $db->database );
						$sess->Load( $args->args->courseSessionId );
						if( $sess->{$field} == $value )
						{
							die( 'ok<!--separate-->{"message":"Session information saved.","response":1' . $inf . '}' );
						}
						else
						{
							die( 'fail<!--separate-->{"message":"Session information could not save.","response":-1}' );
						}
					}
				}
			}
		}
		die( 'fail<!--separate-->{"message":"No such session.","response":-1}' );
		break;
	/* ---------------------------------------------------------------------- */
	/* This part is related to statistics, user progress and so on ---------- */
	/* ---------------------------------------------------------------------- */
	// Get the progress status on sections
	case 'getsectionprogress':
	
		// Get types
		$types = $db->database->fetchObjects( 'SELECT * FROM CC_ElementType WHERE IsQuestion' );
		$typeOut = [];
		$response = new stdClass();
		if( $types )
		{
			foreach( $types as $ty )
			{
				$typeOut[] = intval( $ty->ID, 10 );
			}
		}
		
		// Get session
		$sess = $db->database->fetchObject( '
			SELECT * FROM 
			CC_CourseSession s 
			WHERE 
				( s.Status = 9 OR s.Status = 1 ) AND 
				s.CourseID = \'' . intval( $args->args->courseId, 10 ) . '\' AND
				s.UserID=\'' . $User->ID . '\'
			ORDER BY ID DESC LIMIT 1
		' );
		
		// Validate that we have our information
		if( count( $typeOut ) > 0 && $sess->ID )
		{
			if( isset( $args->args ) && isset( $args->args->sections ) )
			{
				$found = 0;
				foreach( $args->args->sections as $secId )
				{
					// Get all elements on this section
					if( $elementC = $db->database->fetchObject( $q = ( '
						SELECT COUNT(e.ID) AS CNT FROM CC_Element e, CC_Section s, CC_Page p
						WHERE
							p.SectionID = s.ID AND
							e.PageID = p.ID AND 
							s.ID = \'' . intval( $secId, 10 ) . '\' AND
							e.ElementTypeID IN ( ' . implode( ', ', $typeOut ) . ' )
					' ) ) )
					{
						$elementC = $elementC->CNT;
						
						if( $rows = $db->database->fetchObjects( '
							SELECT e.* 
							FROM 
								CC_ElementResult e, 
								CC_Element el,
								CC_CourseSession s,
								CC_Section se,
								CC_Page p
							WHERE
								s.ID = \'' . $sess->ID . '\' AND 
								s.UserID=\'' . $User->ID . '\' AND 
								se.CourseID = s.CourseID AND
								se.ID = \'' . $secId . '\' AND
								p.SectionID = se.ID AND
								el.ID = e.OriginalElementID AND
								el.PageID = p.ID AND
								e.CourseSessionID = s.ID AND 
								e.Data AND 
								e.UserID = s.UserID
						' ) )
						{
							$uniques = new stdClass();
							$elementFilled = 0;
							foreach( $rows as $row )
							{
								if( !isset( $uniques->{$row->OriginalElementID} ) )
								{
									$elementFilled++;
									$uniques->{$row->OriginalElementID} = true;
								}
							}
							
							$response->{$secId} = new stdClass();
							if( $elementC > 0 && $elementFilled > 0 )
							{
								$response->{$secId}->progress = floor( $elementFilled / $elementC * 100 );
							}
							else
							{
								// Check if page is complete
								if( $d = $db->database->fetchObject( ( $q = '
									SELECT pr.Status FROM CC_PageResult pr, CC_Section s, CC_Page p
									WHERE
										s.ID=\'' . intval( $secId, 10 ) . '\' AND 
										pr.PageID = p.ID AND
										p.SectionID = s.ID AND
										pr.CourseSessionID = \'' . $sess->ID . '\'
									ORDER BY pr.ID DESC
									LIMIT 1
								' ) ) )
								{
									// Non-interactive (no interactive elements)
									if( $elementC == 0 )
									{
										// Check if the page is complete
										$response->{$secId}->progress = 0;
									}
									// No interactive element is completed
									else
									{
										$response->{$secId}->progress = 0;
									}
								}
								// The page of the element is not complete
								else
								{
									$response->{$secId}->progress = 0;
								}
							}
							$found++;
						}
						// No section data on elements, what if there's elements that we didn't count? (e.g. non-interactive)
						else if( 1 == 1 )
						{
							$response->{$secId} = new stdClass();
							// Check if page is complete
							if( $d = $db->database->fetchObject( ( $q = '
								SELECT pr.Status FROM CC_PageResult pr, CC_Section s, CC_Page p
								WHERE
									s.ID=\'' . intval( $secId, 10 ) . '\' AND 
									pr.PageID = p.ID AND
									p.SectionID = s.ID AND
									pr.CourseSessionID = \'' . $sess->ID . '\'
								ORDER BY pr.ID DESC
								LIMIT 1
							' ) ) )
							{
								// Non-interactive (no interactive elements)
								if( $elementC == 0 )
								{
									// Check if the page is complete
									$response->{$secId}->progress = 0;
								}
								// No interactive element is completed
								else
								{
									$response->{$secId}->progress = 0;
								}
							}
							// The page of the element is not complete
							else
							{
								$response->{$secId}->progress = 0;
							}
						}
					}
					
					// Setup flags so we can get page progress on top of element progress
					$flags = new stdClass();
					$flags->sectionId = $secId;
					$flags->session = $sess; // Session object
					$flags->elementProgress = $response->{$secId}->progress;
					$flags->countPageProgress = true;
					
					// Add page progress specified on section id
					$response->{$secId}->progress = getProgress( $flags );
					$found = 1;
					
					// Convert to percentage string
					$response->{$secId}->progress .= '%';
				}
				if( $found > 0 )
				{
					die( 'ok<!--separate-->' . json_encode( $response ) );
				}
				die( 'fail<!--separate-->{"message":"Could not find progress on elements or results.","response":-1}<!--separate-->' . $q );
			}
		}
		die( 'fail<!--separate-->{"message":"Could not find progress.","response":-1}' );
		break;
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
		if( $page = $db->database->fetchObject( '
			SELECT COUNT(p.ID) AS CNT FROM CC_PageResult p, CC_Section s, CC_CourseSession cs
			WHERE
				s.ID = \'' . intval( $args->args->sectionId, 10 ) . '\' AND
				cs.ID = \'' . intval( $args->args->courseSessionId, 10 ) . '\' AND
				cs.CourseID = s.CourseID AND
				p.CourseSessionID = cs.ID AND
				cs.UserID=\'' . $User->ID . '\'
		' ) )
		{
			// The amount of pages that were viewed
			$pageResultCount = $page->CNT;
			
			$total = 0;
			if( $total = $db->database->fetchObject( '
				SELECT COUNT(p.ID) AS CNT FROM CC_Page p, CC_Section s, CC_CourseSession cs
				WHERE
					p.SectionID = \'' . intval( $args->args->sectionId, 10 ) . '\' AND
					s.ID = p.SectionID AND
					s.CourseID = cs.CourseID AND
					cs.ID = \'' . intval( $args->args->courseSessionId, 10 ) . '\' AND
					cs.UserID = \'' . $User->ID . '\'
			' ) )
			{
				$total = $total->CNT;
			}
			else
			{
				die( 'fail<!--separate-->{"message":"Could not find a page count for this section.","response":1}' );
			}
			
			// Check if we have page results that are not "completed status"
			if( $rows = $db->database->fetchObjects( '
				SELECT p.* FROM CC_PageResult p, CC_Section s, CC_CourseSession cs
				WHERE
					s.ID = \'' . intval( $args->args->sectionId, 10 ) . '\' AND
					cs.ID = \'' . intval( $args->args->courseSessionId, 10 ) . '\' AND
					cs.CourseID = s.CourseID AND
					p.CourseSessionID = cs.ID AND
					p.Status != \'1\' AND
					cs.UserID = \'' . $User->ID . '\'
			' ) )
			{
				die( 'fail<!--separate->{"message":"This section is not complete because of unread pages.","response":-1}' );
			}
			// Ok, all are completed status
			else
			{
				if( $pageResultCount == $total )
				{
					die( 'ok<!--separate-->{"message":"This section is complete.","response":1}' );
				}
				else
				{
					die( 'fail<!--separate-->{"message":"Not all pages were read.","response":-1,"pages":' . $total . ',"readpages":' . $pageResultCount . '}' );
				}
			}
		}
		// Section hasn't even been started on
		die( 'fail<!--separate->{"message":"This section is not complete.","response":-1}' );
		break;
	// Get progress for you (your user) in a selected class
	case 'getclassroomprogress':
		$types = getInteractiveElementTypes( $db );
		$context = 'user';
		$format = 'course';
		$sum = null;
		
		if ( isset( $args->args ) && isset( $args->args->context ) )
			$context = $args->args->context;
		
		if ( isset( $args->args ) && isset( $args->args->format ) )
			$format = $args->args->format;
		
		if ( isset( $args->args ) && isset( $args->args->countPageProgress ))
			$countPageProgress = $args->args->countPageProgress;
		
		$userId = intval( $User->ID, 10 );
		
		// Only admins can do this
		if( $level == 'Admin' && isset( $args->args ) && isset( $args->args->userId ) )
		{
			$userId = intval( $args->args->userId, 10 );
		}
		
		// Get only one item based on course session id
		$csIds = [];
		$classrooms = false;
		if( isset( $args->args ) && isset( $args->args->courseSessionId ) )
		{
			$csIds[] = intval( $args->args->courseSessionId, 10 );
		}
		// Get active sessions frmo classroom ids
		else if( isset( $args->args ) && isset( $args->args->classrooms ) )
		{
			$classrooms = $args->args->classrooms;
			foreach( $classrooms as $k=>$v )
			{
				$classrooms[ $k ] = intval( $v, 10 );
			}
			
			$userCheck = ' AND s.UserID=\'' . $userId . '\'';
			
			if ( 'classrooms' == $context )
			{
				/*
				$uq = '
					SELECT uc.UserID
					FROM CC_UserClassroom uc
					WHERE uc.ClassroomID IN ('. implode( ',', $classrooms ) .')
					GROUP BY uc.UserID
				';
				$ur = $db->database->fetchObjects( $uq );
				$uList = [];
				if ( $ur )
				{
					foreach( $ur AS $u )
					{
						$uList[] = intval( $u->UserID, 10 );
					}
				}
				$userCheck = 'AND s.UserID IN (' . implode( ',', $uList ) . ')';
				*/
				$userCheck = '';
			}

			$cq = '
				SELECT
					s.* 
				FROM 
					CC_CourseSession s, 
					CC_Classroom c 
				WHERE c.ID IN ( ' . implode( ',', $classrooms ) . ' ) 
				' . $userCheck . ' 
				AND s.CourseID = c.CourseID
				GROUP BY s.ID
			';
			if( $sessions = $db->database->fetchObjects( $cq ) )
			{
				foreach( $sessions as $s )
				{
					$csIds[] = $s->ID;
				}
			}
		}
		else if ( 'sum' == $format )
		{
			$usrChk = ' AND s.UserID=\'' . $userId . '\'';
			if ( 'classrooms' == $context )
				$usrChk = '';
			
			$sq = '
				SELECT s.*
				FROM CC_CourseSession s
				WHERE s.Status = 9
				'.$usrChk.'
			';
			$sr = $db->database->fetchObjects( $sq );
			if ( $sr )
			{
				foreach( $sr AS $s )
				{
					$csIds[] = $s->ID;
				}
			}
			
			die('ok<!--separate-->'.json_encode([
				'sq'  => $sq,
				'sr'  => $sr,
				'sum' => count( $sr ),
			]));
		}
		else
		{
			die( 'fail<!--separate-->{"message":"Could not find course session or course ids.","response":-1}' );
		}
		
		
		// Pass through all sessions
		
		$loops = []; // debug
		$crsProg = []; // store progress by course id
		
		if( count( $csIds ) )
		{
			// Output progress based on course
			$out = new stdClass();
			foreach( $csIds as $csId )
			{
				unset( $iter );
				$iter = [];
				$loops[] = &$iter;
				$iter[ 'csId' ] = $csId;
				$regQ = '';
				$regR = null;
				$elC = null;
				
				// Request course session with classroom ID
				$sq = '
					SELECT
						s.*, cl.ID AS ClassID 
					FROM
						CC_CourseSession s
					LEFT JOIN CC_Classroom cl
						ON s.CourseID = cl.CourseID
					WHERE
						s.ID='.$csId.' 
				';
				
				$iter[ 'sq' ] = $sq;
				
				$session = $db->database->fetchObject( $sq );
				
				unset( $prog );
				if ( !isset( $crsProg[ $session->CourseID ]) )
				{
					$crsProg[ $session->CourseID ] = [];
				}
				$prog = &$crsProg[ $session->CourseID ];
				
				$iter[ 'session' ] = $session;
				
				// Not Started session
				if( $session->Status == '0' )
				{
					$prog[] = 0;
					unset( $csId );
					continue;
				}
				
				// Completed session
				if( $session->Status == '9' )
				{
					$prog[] = 100;
					unset( $csId );
					continue;
				}
				
				$iter[ 'countthetings' ] = true;
				
				/*
				$out->{$cl->CourseID} = new stdClass();
				$entry =& $out->{$cl->CourseID};
				$entry->status = $cl->Status;
				*/
				
				$sectionSpecific = '';
				if( isset( $args->args->sectionId ) )
				{
					$sectionSpecific = 's.ID = \'' . intval( $args->args->sectionId, 10 ) . '\' AND ';
				}
				
				$iter[ 'sectionSpecific' ] = $sectionSpecific;
				
				// Get total page count based on course session
				$maxQuery = '';
				if ( $countPageProgress )
				{
					$maxQuery = '
						SELECT COUNT( p.ID ) AS CNT
						FROM
							CC_CourseSession AS cs,
							CC_PageResult AS pr,
							CC_Page AS p,
							CC_Section AS s
						WHERE
							s.CourseID = cs.CourseID
						AND
							p.SectionID = s.ID
						AND
							pr.PageID = p.ID
						AND
							'.$sectionSpecific.'
							cs.ID = ' . $csId . '
					';
					
				}
				else
				{
					$maxQuery = '
						SELECT COUNT( e.ID ) CNT
						FROM 
							CC_CourseSession s, 
							CC_Element e, 
							CC_Page p, 
							CC_Section s 
						WHERE 
							cs.CourseID = s.CourseID AND 
							p.SectionID = s.ID AND 
							p.ID = e.PageID AND 
							e.ElementTypeID IN ( ' . implode( ',', $types ) . ' ) AND 
							' . $sectionSpecific . '
							s.ID = \'' . $csId . '\'
					';
					
				}
				// Get total element count based on course session
				$iter[ 'maxQuery' ] = $maxQuery;
				if( $elC = $db->database->fetchObject( $maxQuery ) )
				{
					/*
						s.CourseID = s.CourseID AND 
						s.UserID = \'' . $userId . '\' AND 
						p.SectionID = se.ID AND 
						s.CourseID = se.CourseID AND ' . $sectionSpecific . '
						p.ID = e.PageID AND 
						e.ElementTypeID IN ( ' . implode( ',', $types ) . ' ) AND 
						s.ID = \'' . $csId . '\' AND
						s.UserID = \'' . $userId . '\'
					*/
					$iter[ 'elC' ] = $elC;
					$elementCount = $elC->CNT;
					
					$registeredQuery = '';
					// Get pages that were interacted with
					if ( $countPageProgress )
					{
						$registeredQuery = '
							SELECT
								pr.*
							FROM
								CC_PageResult pr
							WHERE
								pr.CourseSessionID = ' . $csId . '
						';
					}
					// Get elements that were interacted with
					else
					{
						$registeredQuery = '
							SELECT 
								er.*
							FROM 
								CC_ElementResult er
							WHERE 
								er.CourseSessionID = \'' . $csId . '\'
						';
					}
					
					/*
					cs.UserID = \'' . $userId . '\' AND 
						cs.ID = er.CourseSessionID AND 
						er.Data AND 
						er.UserID = cs.UserID AND
						er.CourseSessionID = \'' . $csId . '\'
					*/
					
					if( isset( $args->args->sectionId ) )
					{
						$iter[ 'sectionId '] = intval( $args->args->sectionId );
						if ( $countPageProgress )
						{
							$registeredQuery = '
								SELECT
									pr.*
								FROM
									CC_PageResult AS pr
								LEFT JOIN CC_Page AS p
									ON pr.PageID = p.ID
								WHERE
									pr.CourseSessionID = ' . $csId .  '
								AND
									p.SectionID = ' . intval( $args->args->sectionId, 10 ) . '
							';
						}
						else
						{
							$registeredQuery = '
								SELECT 
									er.*
								FROM 
									CC_ElementResult er
								LEFT JOIN CC_Element e
									ON er.ElmentID = e.ID
								LEFT JOIN CC_Page p
									ON e.PageID = p.ID
								WHERE
									er.CourseSessionID = ' . csId . '
								AND
									p.SectionID = ' . intval( $args->args->sectionId, 10 ) . '
							';
						}
						
						/*
						
						$regQ = '
							SELECT 
								r.*
							FROM 
								CC_ElementResult r, 
								CC_Element e, 
								CC_Page p, 
								CC_Section s, 
								CC_CourseSession cs
							WHERE 
								r.Data AND 
								r.UserID = cs.UserID AND
								r.OriginalElementId = e.ID AND
								e.PageID = p.ID AND
								p.SectionID = s.ID AND
								s.ID = \'' . intval( $args->args->sectionId, 10 ) . '\' AND
								r.CourseSessionID = \'' . $csId . '\' AND
								cs.UserID = \'' . $userId . '\' AND
								cs.ID = r.CourseSessionID
						';
						
						*/
					}
					
					$iter[ 'reggedQ' ] = $registeredQuery;
					
					$regR = $db->database->fetchObjects( $registeredQuery );
					$iter[ 'regR' ] = $regR;
					if( $regR )
					{
						$uniques = new stdClass();
						$registered = 0;
						foreach( $regR as $row )
						{
							if( !isset( $uniques->{$row->OriginalElementID} ) )
							{
								$registered++;
								$uniques->{$row->OriginalElementID} = true;
							}
						}
						
						$iter[ 'uniques' ] = $uniques;
						$reg = $registered; //intval( $registered->CNT, 10 );
						$tot = intval( $elementCount, 10 );
						$in = [
							'registered' => $reg,
							'total'      => $tot,
						];
						$iter[ 'in' ] = $in;
						if ( 0 == $reg || 0 == $tot )
							$prog[] = 0;
						else
							$prog[] = ( $reg / $tot ) * 100;
						
					}
					else
					{
						$prog[] = 0;
					}
				}
				else
				{
					$prog[] = 0;
				}
				
				unset( $csId );
			}
		}
		
		$progress = [];
		$classCount = [];
		foreach( $crsProg as $cid=>$cps )
		{
			$u = count( $cps );
			if ( 'classrooms' == $context )
			{
				$countUsers = '
					SELECT count( uc.ID ) AS users
					FROM CC_Classroom AS cl
					LEFT JOIN CC_UserClassroom AS uc
						ON cl.ID = uc.ClassroomID
					WHERE cl.CourseID = '.$cid.'
				';
				$usersInClass = $db->database->fetchObject( $countUsers );
				$classCount[ $cid ] = $usersInClass;
				$u = $usersInClass->users;
			}
			
			if ( 0 == $u )
			{
				$progress[ $cid ] = 0;
			}
			else
			{
				$s = 0;
				foreach( $cps as $n )
					$s = $s + $n;
				$progress[ $cid ] = ( $s / $u );
			}
			
			unset( $cid );
			unset( $cps );
			unset( $u );
			unset( $s );
			unset( $usersInClass );
			unset( $countUsers );
		}
		
		die( 'ok<!--separate-->' . json_encode( [
			'args'       => $args,
			'csIds'      => $csIds,
			'crsProg'    => $crsProg,
			'progress'   => $progress,
			'completed'  => $sum,
			'args'       => $args,
			'loops'      => $loops,
			'classcount' => $classCount,
		] ) );
		
		break;
	// Just complete the course
	case 'complete':
		$courseSession = new dbIO( 'CC_CourseSession', $db->database );
		$courseSession->UserID = $User->ID;
		$courseSession->ID = intval( $args->args->courseSessionId, 10 );
		if( $courseSession->Load() )
		{
			$courseSession->Status = 9; // Completed
			$courseSession->Save();
			die( 'ok<!--separate-->{"response":1,"message":"Your course have been completed."}' );
		}
		die( 'fail<!--separate-->{"response":-1,"message":"You could not complete this course."}' );
		break;
	case 'getnews':
		if( isset( $args->args->classroomId ) )
		{
			if( $rows = $db->database->fetchObjects( '
				SELECT * FROM CC_NewsBulletin WHERE ClassroomID=\'' . intval( $args->args->classroomId, 10 ) . '\' ORDER BY DateUpdated DESC
			' ) )
			{
				die( 'ok<!--separate-->' . json_encode( $rows ) );
			}
		}
		die( 'fail<!--separate-->{"message":"No news for classroom.","response":-1}' );
		break;
	case 'showcertificate':
		$d = getcwd();
		$s = new dbIO( 'FSetting' );
        $s->Type = 'CourseCreator';
        $s->Key = 'Storage';
        if( !$s->Load() )
        {
            die( 'fail<!--separate-->{"message":"Could not read server setting."}' );
        }
        if( !isset( $s->Data ) )
        {
            die( 'fail<!--separate-->' . json_encode( [ 
                'message' => 'missing server setting',
                'setting' => $s,
            ] ) );
        }
        $cs = json_decode( $s->Data );
        if( !isset( $cs->path ) )
        {
            die( 'fail<!--separate-->' . json_encode( [
                'message' => 'server setting missing path',
                'setting' => $cs,
            ] ) );
        }
        
        // check storage path
        $toPath = $Config->FCUpload;
        $toPath .= $cs->path;
        $ccok = file_exists( $toPath );
        if ( !$ccok )
        {
          die( 'fail<!--separate-->{"message":"Server path does not exist."}' );
        }
        
        $cert = new dbIO( 'CC_Certificate', $db->database );
        if( !$cert->Load( $args->args->certId ) )
        {
        	die( 'fail<!--separate-->{"message":"Could not load cert."}' );
        }
        
        if( file_exists( $toPath . '/' . $User->UniqueID . '/certs/' . $cert->FileName . '.' . $cert->FileExt ) )
        {
        	die( readfile( $toPath . '/' . $User->UniqueID . '/certs/' . $cert->FileName . '.' . $cert->FileExt ) );
        }
        die( 'fail<!--separate-->{"message":"No such certificate!"}' );
        
		break;
}
die( 'fail<!--separate-->{"message":"Unknown appmodule method.","response":-1}' );

?>
