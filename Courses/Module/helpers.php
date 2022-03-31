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
    global $db, $User, $Logger;
    
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
    
    // Designated user?
    if( isset( $args->args->userId ) )
    {
        $us = new dbIO( 'FUser' );
        if( !$us->Load( $args->args->userId ) )
        {
            $res = new stdClass();
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
