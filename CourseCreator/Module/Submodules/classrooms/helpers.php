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
	global $courseDb;
	
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
			return false;
		}
		
		// Create copy course
		$courseCopy = new dbIO( 'CC_Course', $courseDb );
		
		// Make sure we load the original
		if( !$courseCopy->Load( $courseId ) ) 
		{
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
					$sectCopy->CourseID = $courseCopy->ID;
					
					// We crashed!
					if( !$sectCopy->Save() ) 
					{
						flushCourseAndData( $courseCopy->ID );
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
										// Base64 encode properties because of JSON error
										//$eleCopy->Properties = 'BASE64:' . base64_encode( $eleCopy->Properties );
										$eleCopy = new dbIO( 'CC_Element', $courseDb );
										foreach( $oldElement as $k=>$v )
										{
											if( $k == 'ID' ) continue;
											$eleCopy->$k = $v;
										}
										
										if( !$eleCopy->Save() )
										{
											flushCourseAndData( $courseCopy->ID );
											return false;
										}
									}
									
								}
								// Successfully cloned course template, sections, pages and elements
							}
							else
							{
								flushCourseAndData( $courseCopy->ID );
								return false;
							}
						}
					}
					else
					{
						flushCourseAndData( $courseCopy->ID );
						return false;
					}
				}
			}
			// Success
			return $courseCopy;
		}
	}
	return false;
}



?>
