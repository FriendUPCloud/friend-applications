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

// Removes all data from a classroom related to connected course
function removeCourseDataFromClassroom( $courseId, $classroomId )
{
	global $courseDb;
	
	$o = new dbIO( 'CC_Course', $courseDb );
	$o->ClassroomID = $classroomId;
	$o->ID = $courseId;
	if( $o->Load() )
	{
		if( $o->ParentID > 0 )
		{
			return flushCourseAndData( $o->ID );
		}
	}
	return false;
}

// Destroy a course and all its data!
function flushCourseAndData( $courseId )
{
	global $courseDb;
	
	$course = new dbIO( 'CC_Course', $courseDb );
	if( !$course->Load( $courseId ) )
	{
		return false;
	}
	// Find sections
	if( $sects = $courseDb->fetchObjects( '
		SELECT * FROM CC_Section WHERE CourseID=\'' . $course->ID . '\'
	' ) )
	{
		foreach( $sects as $sect )
		{
			// Fetch pages
			if( $pages = $courseDb->fetchObjects( '
				SELECT * FROM CC_Page WHERE SectionID=\'' . $sect->ID . '\'
			' ) )
			{
				// Now flush!
				foreach( $pages as $page )
				{
					// Remove results if any
					$courseDb->query( 'DELETE FROM CC_PageResult WHERE PageID=\'' . $page->ID . '\'' );
					$courseDb->query( 'DELETE FROM CC_ElementResult r WHERE r.ID IN ( SELECT e.ID FROM CC_Element e WHERE e.PageID=\'' . $page->ID . '\'' );
					// Remove all elements
					$courseDb->query( 'DELETE FROM CC_Element WHERE PageID=\'' . $page->ID . '\'' );
				}
				// Remove pages
				$courseDb->query( 'DELETE FROM CC_Page WHERE SectionID=\'' . $sect->ID . '\'' );
			}
		}
		// Remove sections
		$courseDb->query( 'DELETE FROM CC_Section WHERE CourseID=\'' . $course->ID . '\'' );
	}
	// Remove course
	$course->Delete();
	return true;
}

// Copies all required data from a course to this classroom
function copyCourseDataToClassroom( $courseId, $classroomId )
{
	global $courseDb, $Logger;
	
	if( !$courseDb )
	{
		die( 'fail<!--separate-->{"message":"No database.","response":-1}' );
	}
	
	// Load course template
	$course = new dbIO( 'CC_Course', $courseDb );
	if( $course->Load( $courseId ) )
	{
		// We cannot use a course copy as a template
		if( $course->ParentID > 0 ) 
		{
			//$Logger->log( 'copyCourseDataToClassroom: Course has parent!' );
			return false;
		}
		
		// Create copy course
		$courseCopy = new dbIO( 'CC_Course', $courseDb );
		
		// Make sure we load the original
		if( !$courseCopy->Load( $courseId ) ) 
		{
			//$Logger->log( 'copyCourseDataToClassroom: Could not load template!' );
			return false;
		}
		$courseCopy->ID = 0;
		$courseCopy->ParentID = $course->ID;
		
		// Check if we can save the course copy
		if( $courseCopy->Save() )
		{
			// Load all course sections
			if( $sections = $courseDb->fetchObjects( '
				SELECT * FROM CC_Section WHERE CourseID = \'' . $course->ID . '\' ORDER BY ID ASC
			' ) )
			{
				// Run through all course sections
				foreach( $sections as $sect )
				{
					$sectCopy = new dbIO( 'CC_Section', $courseDb ); 
					$sectCopy->Load( $sect->ID );
					$sectCopy->ID = 0;
					$sectCopy->DateCreated = date( 'Y-m-d H:i:s' );
					$sectCopy->DateUpdated = $sectCopy->DateCreated;
					$sectCopy->CourseID = $courseCopy->ID;
					
					// We crashed!
					if( !$sectCopy->Save() ) 
					{
						flushCourseAndData( $courseCopy->ID );
						//$Logger->log( 'copyCourseDataToClassroom: Could not save section copy!' );
						return false;
					}
					
					// Get all pages for this course
					if( $pages = $courseDb->fetchObjects( '
						SELECT * FROM CC_Page WHERE SectionID=\'' . $sect->ID . '\' ORDER BY ID ASC
					' ) )
					{
						// Go through all pages
						foreach( $pages as $page )
						{
							$pageCopy = new dbIO( 'CC_Page', $courseDb );
							$pageCopy->Load( $page->ID );
							$pageCopy->ID = 0;
							$pageCopy->SectionID = $sectCopy->ID;
							
							if( !$pageCopy->Save() )
							{
								flushCourseAndData( $courseCopy->ID );
								//$Logger->log( 'copyCourseDataToClassroom: Could not save page copy!' );
								return false;
							}
							
							// Get all elements for this page
							if( $elements = $courseDb->fetchObjects( '
								SELECT * FROM CC_Element WHERE PageID=\'' . $page->ID . '\' ORDER BY ID ASC
							' ) )
							{
								// Go through all elements
								foreach( $elements as $el )
								{
									if( $oldElement = $courseDb->fetchObject( 'SELECT * FROM CC_Element WHERE ID=\'' . $el->ID . '\'' ) )
									{
										$eleCopy = new dbIO( 'CC_Element', $courseDb );
										
										foreach( $oldElement as $k=>$v )
										{
											if( $k == 'ID' ) continue;
											
											// Base64 encode properties because of JSON error
											if( $k == 'Properties' )
											{
												$eleCopy->$k = 'BASE64:' . base64_encode( $v );
											}
											else
											{
												$eleCopy->$k = $v;
											}
										}
										
										$eleCopy->PageID = $pageCopy->ID;
										
										if( !$eleCopy->Save() )
										{
											flushCourseAndData( $courseCopy->ID );
											//$Logger->log( 'copyCourseDataToClassroom: Could not save element copy!' );
											return false;
										}
									}
									
								}
								// Successfully cloned course template, sections, pages and elements
							}
							// This page may lack elements
							else
							{
								// Flush and return false
								flushCourseAndData( $courseCopy->ID );
								//$Logger->log( 'copyCourseDataToClassroom: Could not find elements on page! (' . $page->Name . ' -> ' . $page->ID . ')' );
								return false;
							}
						}
					}
					else
					{
						flushCourseAndData( $courseCopy->ID );
						//$Logger->log( 'copyCourseDataToClassroom: No pages in section!' );
						return false;
					}
				}
			}
			// Success
			return $courseCopy;
		}
	}
	//$Logger->log( 'copyCourseDataToClassroom: Fail at the root of algo!' );
	return false;
}

// Get the progress in percent for a user in a classroom
function fetchUserClassroomProgress( $userId, $classroomId )
{
	global $courseDb, $Logger;
	
	if( !$courseDb )
	{
		die( 'fail<!--separate-->{"message":"No database.","response":-1}' );
	}
	
	// Reference course db
	$db = new stdClass();
	$db->database =& $courseDb;
	
	if( $sects = $db->database->fetchObjects( '
        SELECT s.* FROM 
            CC_Section s,
            CC_CourseSession cs,
            CC_Classroom cl
        WHERE
            cs.UserID = \'' . intval( $userId, 10 ) . '\' AND
            cs.CourseID = s.CourseID AND
            cl.ID = \'' . $classroomId . '\' AND
            cl.CourseID = s.CourseID
        ORDER BY s.DisplayID ASC
    ' ) )
    {
        $sections = array();
        foreach( $sects as $sect )
        {
            $sections[] = $sect->ID;
        }
        $newArgs = new stdClass();
        $newArgs->args = new stdClass();
        $newArgs->args->courseId = $sects[0]->CourseID;
        $newArgs->args->sections = $sections;
        $newArgs->args->userId = $userId;
        
        $res = getSectionProgress( $newArgs );
        
        if( $res->message == 'found' )
        {
            return $res->totalProgress . '%';
        }
    }
    else
    {
    }
	
	return '0%';
}

// Calculate progress for a course/section in an integer. 
// All input and output values are integer.
// Flags: 
// {
//    sectionId: integer row ID specific section
//    classroomId: integer row ID specific classroom (all sections)
//    elementProgress: integer 0-100 of page element progress
//    session: object CC_CourseSession with valid value session->ID
//    countPageProgress: true|false to count page progress
// }
function getProgress( $flags )
{
	global $courseDb, $Logger;
	
	// Reference course db
	$db = new stdClass();
	$db->database =& $courseDb;
	
	$progress = 0;
	$progressGroups = 0; // How many groups of numbers to divide on
	$progressOnElements = false;
	
	// Add a progress group with total amount of elements progressed 0-100%
	// Only when in section mode
	if( isset( $flags->elementProgress ) && isset( $flags->sectionId ) )
	{
		$progressGroups++;
		$progress += intval( $flags->elementProgress, 10 );
		$progressOnElements = true;
	}
	
	// Count page progress
	if( isset( $flags->countPageProgress ) && $flags->countPageProgress == true )
	{
		// Only by section
		if( isset( $flags->sectionId ) && isset( $flags->session ) )
		{
			// See if we have a page result on this section
			if( $pResults = $db->database->fetchObjects( '
				SELECT pr.* FROM CC_PageResult pr, CC_Page p
				WHERE
					p.SectionID = \'' . intval( $flags->sectionId, 10 ) . '\' AND
					pr.PageID = p.ID AND
					pr.CourseSessionID = \'' . intval( $flags->session->ID, 10 ) . '\'
			' ) )
			{
				// Ok, we have a page result on this session, check progress
				// Check page progress and combine it
				if( $allPages = $db->database->fetchObjects( '
					SELECT 
						ID, DisplayID, `Name` 
					FROM
						CC_Page 
					WHERE 
						SectionID = \'' . intval( $flags->sectionId, 10 ) . '\'
					ORDER BY
						DisplayID ASC
				' ) )
				{
					$pageTotal = count( $allPages );
					$pageProgress = 1;
					$mostProgress = 1;
					$highestDisplayID = -1;
					foreach( $allPages as $page )
					{
						foreach( $pResults as $p )
						{
							if( $p->PageID == $page->ID )
							{
								if( intval( $page->DisplayID, 10 ) > $highestDisplayID )
								{
									$highestDisplayID = intval( $page->DisplayID, 10 );
									$mostProgress = $pageProgress;
								}
							}
						}
						$pageProgress++;
					}
					// Add page progress
					if( $highestDisplayID > 0 )
					{
						$progressGroups++;
						$progress += floor( $mostProgress / $pageTotal * 100 );
					}
					
					// Check if there are any interactive elements on proposed page
					// If not, remove that progressgroup
					if( $progressOnElements )
					{
						if( $interactive = $db->database->fetchObject( '
							SELECT COUNT(el.ID) CNT FROM
								CC_Element el, CC_ElementType et, CC_Page p
							WHERE
								el.ElementTypeID = et.ID AND et.IsQuestion AND 
								el.PageID = p.ID AND p.SectionID = \'' . intval( $flags->sectionId, 10 ) . '\'
						' ) )
						{
							if( $interactive->CNT <= 0 )
							{
								$progressGroups--;
							}
						}
					}
				}
			}
		}
		// By entire classroom
		else if( isset( $flags->classroomId ) && isset( $flags->session ) )
		{
			// Fetch all classroom sections
			if( $sections = $db->database->fetchObjects( '
				SELECT 
				    sc.ID, sc.Name, c.Name AS ClassroomName 
				FROM 
				    CC_Section sc, CC_Classroom c, CC_CourseSession se
				WHERE
					se.ID = \'' . intval( $flags->session->ID, 10 ) . '\' AND
					se.CourseID = sc.CourseID AND
					c.CourseID = se.CourseID AND
					c.ID = \'' . intval( $flags->classroomId, 10 ) . '\'
				ORDER BY sc.DisplayID
			' ) )
			{
				$sectionProgress = 0;
				$secTotal = 0;
				foreach( $sections as $sec )
				{
					// Use section flag for this function to extract per section
					$fl = new stdClass();
					$fl->sectionId = $sec->ID;
					$fl->session = $flags->session;
					$fl->countPageProgress = $flags->countPageProgress; // Is always true
					$sectionProgress += getProgress( $fl );
					$secTotal++;
				}
				if( $sectionProgress > 0 )
				{
					$progressGroups++;
					$progress += floor( $sectionProgress / $secTotal );
				}
			}
		}
	}
	
	// Divide on progress groups
	if( $progressGroups > 1 )
	{
		$progress = floor( $progress / $progressGroups );
	}
	
	return $progress;
}

function getSectionProgress( $args )
{
    global $courseDb, $User, $Logger;
    
    // Reference course db
	$db = new stdClass();
	$db->database =& $courseDb;
    
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
    
    $Logger->log( 'Checking section progress: ' . print_r( $args, 1 ) );
    
    // Designated user?
    if( isset( $args->args->userId ) )
    {
        $us = new dbIO( 'FUser' );
        if( !$us->Load( $args->args->userId ) )
        {
            $res = new stdClass();
            $Logger->log( 'Can not find user.' );
            $res->message = 'notfound';
            return $res;
        }
    }
    // Current user
    else
    {
        $us =& $User;
    }
    
    // Get session
    $sess = $db->database->fetchObject( '
	    SELECT * FROM 
	    CC_CourseSession s 
	    WHERE 
		    ( s.Status = 9 OR s.Status = 1 ) AND 
		    s.CourseID = \'' . intval( $args->args->courseId, 10 ) . '\' AND
		    s.UserID=\'' . $us->ID . '\'
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
						    s.UserID=\'' . $us->ID . '\' AND 
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
				    else
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
			    if( !isset( $args->args->skipGetProgress ) )
			    {
			        $flags = new stdClass();
			        $flags->sectionId = $secId;
			        $flags->session = $sess; // Session object
			        $flags->elementProgress = $response->{$secId}->progress;
			        $flags->countPageProgress = true;
			        
			        // Add page progress specified on section id
			        $response->{$secId}->progress = getProgress( $flags );
			    }
			    
			    $found = 1;
			    
			    // Convert to percentage string
			    if( !isset( $args->args->skipPercent ) )
			    {
			        $response->{$secId}->progress .= '%';
			    }
		    }
		    if( $found > 0 )
		    {
			    $res = new stdClass();
			    $res->response = $response;
			    $res->totalProgress = 0;
			    $tcount = 0;
			    foreach( $response as $section=>$value )
			    {
			        if( !isset( $args->args->skipPercent ) )
    			    {
    			        $res->totalProgress += $value->progress;
    			    }
    			    else
    			    {
    			        $res->totalProgress += intval( $value->progress, 10 );
    			    }
    			    $tcount++;
			    }
			    $res->totalProgress = floor( $res->totalProgress / $tcount );
			    $res->message = 'found';
			    return $res;
		    }
		    $res = new stdClass();
		    $res->message = 'noelements';
		    return $res;
	    }
    }
    $res = new stdClass();
    $res->message = 'notfound';
    return $res;
}

?>
