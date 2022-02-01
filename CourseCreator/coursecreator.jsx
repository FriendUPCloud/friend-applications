/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/* Main application
*
*/

let version = 'v0.2';

Application.mainView = null;

Application.run = function ( msg ) {
    
    this.setApplicationName( 'CourseCreator' );
    
   
    // Create the admin view
    let adm = new View( {
        title: 'CourseCreator - ' + version,
        width: 1280,
        height: 720
    } );
    
    Application.mainView = adm;
    
    adm.onClose = function()
    {
        Application.quit();
    }
    
    let af = new File( 'Progdir:Templates/admin.html' );
    af.onLoad = function( data )
    {
        adm.setContent( data );
    }
    af.load();
    
}

Application.receiveMessage = function( msg )
{
    if( msg.command )
    {
        // Redirect submodule calls directly to main view
        if( msg.submodule )
        {
            Application.mainView.sendMessage( msg );
        }
    }
}

