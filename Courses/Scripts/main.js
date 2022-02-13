/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg )
{
	// Adding the module menu
	FUI.addCallback( 'module_list_modules', function( moduleview )
	{
		moduleview.setModules( [ {
			name: 'Dashboard',
			leadin: 'Learning portal',
			module: 'dashboard',
			icon: 'dashboard',
			onclick: function(){ setModule( moduleview, 'dashboard' ) }
		},
		{
			name: 'My classrooms',
			leadin: 'Active courses',
			module: 'classrooms',
			icon: 'group',
			onclick: function(){ setModule( moduleview, 'classrooms' ) }
		},
		{
			name: 'Certificates',
			leadin: 'Completed classes',
			module: 'certificates',
			icon: 'certificate',
			onclick: function(){ setModule( moduleview, 'certificates' ) }
		} ] );
	} );
}

// Setting the module on a moduleview
function setModule( mv, mod )
{
	console.log( 'Setting module: ', mv, mod );
}
