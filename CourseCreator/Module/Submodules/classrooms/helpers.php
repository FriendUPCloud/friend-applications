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

?>
