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
}

// Destroy a course and all its data!
function flushCourseAndData( $courseId )
{
	global $courseDb;
}

// Copies all required data from a course to this classroom
function copyCourseDataToClassroom( $courseId, $classroomId )
{
	global $courseDb;
	
	// Load course template
	$course = new dbIO( 'CC_Course', $courseDb );
	if( $course->Load( $courseId ) )
	{
		// We cannot use a course copy as a template
		if( $course->ParentID > 0 ) return false;
		
		// Create copy course
		$courseCopy = new dbIO( 'CC_Course', $courseDb );
		
		// Make sure we load the original
		if( !$courseCopy->Load( $courseId ) ) return false;
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
									$eleCopy = new dbIO( 'CC_Element' );
									$eleCopy->Load( $el->ID );
									$eleCopy->ID = 0;
									$eleCopy->PageID = $pageCopy->ID;
									if( !$eleCopy->Save() )
									{
										flushCourseAndData( $courseCopy->ID );
										return false;
									}
								}
								return true;
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
		}
	}
	return false;
}



?>
