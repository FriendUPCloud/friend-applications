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
//    elementProgress: integer 0-100 of page element progress
//    session: object CC_CourseSession with valid value session->ID
//    countPageProgress: true|false to count page progress
// }
function getProgress( $flags )
{
	global $db, $Logger;
	
	$progress = 0;
	$progressGroups = 0; // How many groups of numbers to divide on
	
	// Add a progress group with total amount of elements progressed 0-100%
	if( isset( $flags->elementProgress ) )
	{
		$progressGroups++;
		$progress += $flags->elementProgress;
	}
	
	// Count page progress, only by section
	if( 
		isset( $flags->countPageProgress ) && $flags->countPageProgress == true && 
		isset( $flags->sectionId ) && isset( $flags->session ) 
	)
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
	
	// Divide on progress groups
	if( $progressGroups > 1 )
	{
		$progress = floor( $progress / $progressGroups );
	}
	
	return $progress;
}

?>
