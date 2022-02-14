/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

let moduleObject = {};

Application.run = function( msg )
{
	// Adding the module menu
	FUI.addCallback( 'module_list_modules', function( moduleview )
	{
		moduleObject.moduleView = moduleview;
		moduleview.setModules( [ {
			name: 'Dashboard',
			leadin: 'Learning portal',
			module: 'dashboard',
			icon: 'dashboard',
			onclick: function(){ setModule( moduleview, 'dashboard' ) },
			active: true
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
	
	// Set up callbacks etc
	for( let a in moduleObject )
	{
		if( moduleObject[ a ].preload )
		{
			moduleObject[ a ].preload();
		}
	}
}

// Setting the module on a moduleview
function setModule( mv, mod )
{
	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			mv.setModuleContent( mod, d );
			if( moduleObject[ mod ] )
			{
				moduleObject[ mod ].initialize( mv );
			}
		}
	}
	m.execute( 'appmodule', {
		command: 'getmodule',
		appName: 'Courses',
		moduleName: mod
	} );
}

/* Dashboard */

moduleObject.dashboard = {
	initialize( moduleView )
	{
		let cont = moduleView.moduleContainer.domNode;
		cont.getElementsByTagName( 'h1' )[0].innerHTML = 'Velkommen ' + Application.fullName + '!';
	}
};

/* Classrooms */

moduleObject.classrooms = {
	initialize( moduleView )
	{
	},
	preload()
	{
		FUI.addCallback( 'w_reload_classrooms', function( ls )
		{
			let m = new Module( 'system' );
			m.onExecuted = function( rc, rd )
			{
				if( rc != 'ok' )
				{
					console.log( 'Could not load classroms.' );
					ls.clearRows();
					return;
				}
				let list = JSON.parse( rd );
				let out = [];
				for( let a = 0; a < list.length; a++ )
				{
					out.push( [
						{
							type: 'string',
							value: list[a].Name,
							onclick: 'w_classroom_enter_' + a
						},
						{
							type: 'string',
							value: '20%'
						},
						{
							type: 'string',
							value: 'tesing...'
						},
						{
							type: 'string',
							value: list[a].EndDate
						}
					] );
					
					// Enter classroom overview
					FUI.addCallback( 'w_classroom_enter_' + a, function( ls )
					{
						let m = new Module( 'system' );
						m.onExecuted = function( mc, md )
						{
							if( mc != 'ok' )
							{
								console.log( 'Could not load classroom.' );
								return;
							}
							moduleObject.moduleView.setSubModuleContent( 
								'classroom', 
								'classroom_details', 
								md, 
								function()
								{
									moduleObject.classrooms.initClassroomDetails();
								} 
							);
						}
						m.execute( 'appmodule', {
							appName: 'Courses',
							command: 'gettemplate',
							moduleName: 'classrooms',
							template: 'classroom'
						} );
					} );
				}				
				
				ls.setRowData( out );
			}
			m.execute( 'appmodule', {
				appName: 'Courses',
				command: 'listclassrooms'
			} );
		} );
	},
	initClassroomDetails()
	{
		let section = FUI.getElementByUniqueId( 'classroom_section_1' );
		section.setContent( 'Details are coming.' );
		
		let m = new Module( 'system' );
		m.onExecuted = function()
		{
			
		}
		m.execute( 'appmodule', {
			appName: 'Courses',
			command: 'classsections',
			classroomId: 1
		} );
	}
};




