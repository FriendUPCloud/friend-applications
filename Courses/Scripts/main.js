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

// Just get a template
Application.getTemplate = function( module, template, callback )
{
	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		callback( e, d );
	}
	m.execute( 'appmodule', {
		appName: 'Courses',
		command: 'gettemplate',
		moduleName: module,
		template: template
	} );
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
							value: '<progressbar progress="' + Math.floor( Math.random() * 100 ) + '"/>'
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
					( function( courseId )
					{
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
										moduleObject.classrooms.initClassroomDetails( courseId );
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
					} )( list[ a ].ID );
				}				
				
				ls.setRowData( out );
			}
			m.execute( 'appmodule', {
				appName: 'Courses',
				command: 'listclassrooms'
			} );
		} );
	},
	// Show the classroom details
	initClassroomDetails( courseId, listview )
	{
		let section = FUI.getElementByUniqueId( 'classroom_section_1' );
		section.setContent( '<p>Details are coming.</p><p class="TextRight"><button type="button" onclick="moduleObject.classrooms.courseViewer(' + courseId +')">Continue course</button></p>' );
		
		let list = FUI.getElementByUniqueId( 'classroom_progress' );
		let m = new Module( 'system' );
		m.onExecuted = function( ee, ed )
		{
			if( ee == 'ok' )
			{
				let rows = JSON.parse( ed );
				let out = [];
				for( let a = 0; a < rows.length; a++ )
				{
					out.push( [ {
						type: 'string',
						value: rows[a].Name
					}, {
						type: 'string',
						value: '<progressbar progress="20%"/>',
					}, {
						type: 'string',
						value: '..',
					}, {
						type: 'string',
						value: 'Pending',
					}, {
						type: 'string',
						value: 'date'
					} ] );
				};
				list.setRowData( out );
			}
		}
		m.execute( 'appmodule', {
			appName: 'Courses',
			command: 'listsections',
			courseId: courseId
		} );
	},
	// The actual course viewer
	courseViewer( courseId )
	{
		let course = new Courseviewer( courseId );
	}
};

class Courseviewer
{
	constructor( courseId )
	{
		let self = this;
		this.courseId = courseId;
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' )
			{
				Alert( 'Could not load coarse', 'Course was not found on the server.' );
				return;
			}
			let course = JSON.parse( d );
			if( !course )
			{
				Alert( 'Could not load coarse', 'Course was not found on the server.' );
				return;
			}
			console.log( 'What is it: ', course );
			self.view = new View( {
				title: 'Taking course: ' + course.Name,
				width: 1280,
				height: 700
			} );
			self.view.onClose = function()
			{
				if( self.view ) self.view = null;
			}
			
			Application.getTemplate( 'classrooms', 'course', function( e, d )
			{
				if( e == 'ok' )
				{
					self.view.setContent( d, function()
					{
						self.view.sendMessage( { command: 'loadcourse', course: course } );
					} );
				}
				else
				{
					self.view.close();
					self.view = null;
				}
			} );
		}
		m.execute( 'appmodule', {
			appName: 'Courses',
			command: 'getcourse',
			courseId: courseId
		} );
	}
}


