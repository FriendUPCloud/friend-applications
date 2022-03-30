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
	global $db, $Logger;
	
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
						$Logger->log( 'Section: Element progress: ' . $progressGroups );
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
						$Logger->log( 'Section: Element progress: ' . $progressGroups );
					}
				}
			}
		}
		// By entire classroom
		else if( isset( $flags->classroomId ) && isset( $flags->session ) )
		{
			// Fetch all classroom sections
			if( $sections = $db->database->fetchObjects( '
				SELECT sc.ID, sc.Name FROM CC_Section sc, CC_Classroom c, CC_CourseSession se
				WHERE
					se.ID = \'' . intval( $flags->session->ID, 10 ) . '\' AND
					se.CourseID = sc.CourseID AND
					c.CourseID = se.CourseID AND
					c.ID = \'' . intval( $flags->classroomId, 10 ) . '\'
				ORDER BY sc.DisplayID
			' ) )
			{
				$Logger->log( 'Classroom ID: ' . $flags->classroomId );
				$sectionProgress = 0;
				$secTotal = 0;
				foreach( $sections as $sec )
				{
					// Use section flag for this function to extract per section
					$fl = new stdClass();
					$fl->sectionId = $sec->ID;
					$fl->session = $flags->session;
					$fl->countPageProgress = true;
					//$fl->elementProgress = $flags->elementProgress;
					$sectionProgress += getProgress( $fl );
					$secTotal++;
					$Logger->log( 'Classroom: Section ' . $secTotal . '. progress: ' . $sectionProgress );
				}
				if( $sectionProgress > 0 )
				{
					$progressGroups++;
					$progress += floor( $sectionProgress / $secTotal );
				}
				$Logger->log( 'Classroom: Total section progress: ' . $sectionProgress );
			}
			else
			{
				/*$Logger->log( 'Query failed: SELECT sc.ID, sc.Name FROM CC_Section sc, CC_Classroom c, CC_CourseSession se
				WHERE
					se.ID = \'' . intval( $flags->session->ID, 10 ) . '\' AND
					se.CourseID = sc.CourseID AND
					c.CourseID = se.CourseID AND
					c.ID = \'' . intval( $flags->classroomId, 10 ) . '\'
				ORDER BY sc.DisplayID' );*/
			}
		}
	}
	
	// Divide on progress groups
	if( $progressGroups > 1 )
	{
		$progress = floor( $progress / $progressGroups );
	}
	
	$Logger->log( 'Resulting progress: ' . $progress . '%' );
	
	return $progress;
}

?>
