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
	
	// Fetch all section elements
	if( $row = $courseDb->fetchObject( '
		SELECT COUNT(e.ID) CNT FROM 
			CC_Element e,
			CC_ElementType et,
			CC_Page p,
			CC_Section s,
			CC_Classroom cl
		WHERE
			cl.ID = \'' . $classroomId . '\' AND
			cl.CourseID = s.CourseID AND
			s.ID = p.SectionID AND
			p.ID = e.PageID AND
			et.ID = e.ElementTypeID AND
			et.IsQuestion
	' ) )
	{
		$elementCount = $row->CNT ? $row->CNT : 0;
		
		// Fetch all element results
		if( $rows = $courseDb->fetchObjects( '
			SELECT e.*, er.OriginalElementID FROM
				CC_ElementResult er,
				CC_Element e,
				CC_Page p,
				CC_Section s,
				CC_Classroom cl,
				CC_CourseSession se
			WHERE
				cl.ID = \'' . $classroomId . '\' AND
				cl.CourseID = s.CourseID AND
				s.ID = p.SectionID AND
				p.ID = e.PageID AND
				er.OriginalElementID = e.ID AND
				er.UserID = \'' . intval( $userId, 10 ) . '\' AND
				se.CourseID = s.CourseID AND
				se.UserID = \'' . intval( $userId, 10 ) . '\' AND
				er.Data
		' ) )
		{	
			$uniques = new stdClass();
			$elementResultCount = 0;
			foreach( $rows as $row )
			{
				if( !isset( $uniques->{$row->OriginalElementID} ) )
				{
					$elementResultCount++;
					$uniques->{$row->OriginalElementID} = true;
				}
			}
			//$elementResultCount = $row->CNT ? $row->CNT : 0;
			if( $elementResultCount > 0 && $elementCount > 0 )
			{
				return floor( $elementResultCount / $elementCount * 100 ) . '%';
			}
		}
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
	
	// Add a progress group with total amount of elements progressed 0-100%
	if( isset( $flags->elementProgress ) )
	{
		$progressGroups++;
		$progress += intval( $flags->elementProgress, 10 );
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
				}
			}
		}
		// By entire classroom
		else if( isset( $flags->classroomId ) && isset( $flags->session ) )
		{
			$Logger->log( 'Checking sections of classrooms' );
			// Fetch all classroom sections
			if( $sections = $db->database->fetchObjects( '
				SELECT sc.ID, sc.Name FROM CC_Section sc, CC_Classroom c, CC_CourseSession se
				WHERE
					se.ID = \'' . intval( $flags->session->ID, 10 ) . '\' AND
					se.CourseID = sc.CourseID AND
					c.CourseID = se.CourseID AND
					c.ID = \'' . intval( $flags->classroomId, 10 ) . '
				ORDER BY sc.DisplayID
			' ) )
			{
				$sectionProgress = 0;
				$secTotal = 0;
				foreach( $sections as $sec )
				{
					$Logger->log( 'What section: ' . $sec->Name );
					// Use section flag for this function to extract per section
					$fl = new stdClass();
					$fl->sectionId = $sec->ID;
					$fl->session = $flags->session;
					$fl->countPageProgress = true;
					$sectionProgress += getProgress( $fl );
					$secTotal++;
				}
				if( $sectionProgress > 0 )
				{
					$progressGroups++;
					$progress += floor( $sectionProgress / $secTotal );
				}
			}
			else
			{
				$Logger->log( 'Failed' );
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

?>
