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

Application.receiveMessage = function( msg )
{
	switch( msg.command )
	{
		case 'refreshcourses':
			moduleObject.classrooms.initClassroomDetails();
			break;
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
	preload()
	{
		const self = this;
		console.log( 'dash preload' );
		
	},
	initialize( moduleView )
	{
		const self = this;
		console.log( 'dash init', moduleView, self );
		let cont = moduleView.moduleContainer.domNode;
		ge( 'dashWelcome' ).innerHTML = 'Welcome ' + Application.fullName + '!';
		self.prog = ge( 'dashProgress' );
		self.status = ge( 'dashStatus' );
		const cl = new Module( 'system' );
		cl.onExecuted = ( s , d ) => {
			console.log( 'dash list cl', [ s, d ]);
			if ( 'ok' == s )
			{
				const rs = JSON.parse( d );
				console.log( 'rooms', rs );
				const clIds = [];
				let l = rs.length;
				for ( ;l; )
				{
					l--;
					const r = rs[l];
					clIds[l] = r.ID;
				}
				
				console.log( 'class ids', clIds );
				const p = new Module( 'system' );
				p.onExecuted = ( s, d ) => {
					console.log( 'classroom progress back', [ s, d ]);
					if ( 'ok' == s )
					{
						const res = JSON.parse( d );
						console.log( 'getclassroomprogress res', res );
					}
					else
					{
						console.log( 'getclassroomprogress failed', [ s, d ]);
					}
				}
				p.execute( 'appmodule', {
					appName    : 'Courses',
					command    : 'getclassroomprogress',
					classrooms : clIds,
				});
			
			}
			else
			{
				console.log( 'listclassrooms failed', d );
			}
		}
		
		cl.execute( 'appmodule', {
			appName : 'Courses',
			command : 'listclassrooms',
			status  : false,
			active  : 'active',
		});
		
		const s = new Module( 'system' );
		s.onExecuted = ( s, d ) => {
			console.log( 'getstats back', [ s, d ]);
			if ( 'ok' == s )
			{
				const res = JSON.parse( d );
				console.log( 'getstats res', res );
			}
			else
			{
				console.log( 'dash getstats failed', [ s, d ]);
			}
		}
		s.execute( 'appmodule', {
			appName : 'Courses',
			command : 'getstats',
		});
			
			
	},
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
				
				// Get classroom ids
				let cids = [];
				for( let a in list ) cids.push( parseInt( list[a].ID ) );
				
				// Get progress on all classrooms
				let cl = new Module( 'system' );
				cl.onExecuted = function( ce, cd )
				{
					let progress = {};
					if( ce == 'ok' )
					{
						try
						{
							progress = JSON.parse( cd );
						}
						catch( e )
						{
							progress = {};
						}
					}
					
					let out = [];
					
					for( let a = 0; a < list.length; a++ )
					{
						let exStatus = false;
						let endTime = ( new Date( list[a].EndDate ) ).getTime();
						let now = ( new Date() ).getTime();
						
						let prog = progress[ list[a].CourseID ];
						
						if( now >= endTime )
						{
							exStatus = 'Expired';
						}
						else if( prog && prog.status == 9 )
						{
							exStatus = 'Completed';
						}
					
						out.push( [
							{
								type: 'string',
								value: list[a].Name,
								onclick: 'w_classroom_enter_' + a
							},
							{
								type : 'string',
								value : list[a].StartDate.split(' ')[0],
							},
							{
								type: 'string',
								value: '<progressbar progress="' + ( prog ? prog.progress : '0%' ) + '"/>'
							},
							{
								type: 'string',
								value: ( exStatus ? exStatus : ( typeof( prog ) != 'undefined' ) ? 'Active' : 'Available' )
							},
							{
								type: 'string',
								value: friendUP.tool.ucfirst( friendUP.tool.getChatTime( ( new Date( list[a].EndDate ) ).getTime() ) ),
							}
						] );
						
						// Enter classroom overview
						( function( classroomId )
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
											moduleObject.classrooms.initClassroomDetails( classroomId );
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
				cl.execute( 'appmodule', {
					appName: 'Courses',
					command: 'getclassroomprogress',
					classrooms: cids
				} );
			}
			m.execute( 'appmodule', {
				appName: 'Courses',
				command: 'listclassrooms'
			} );
		} );
	},
	// Show the classroom details
	initClassroomDetails( classroomId, listview )
	{
		let self = this;
		
		// If we have no arguments, we are doing a refresh
		if( !classroomId )
		{
			if( this.currentClassroomId )
			{
				classroomId = this.currentClassroomId;
				listview = this.currentListview;
			}
			else
			{
				return;
			}
		}
		// Store the args for later
		else
		{
			this.currentClassroomId = classroomId;
			this.currentListview = listview;
		}
		
		const n = new Module( 'system' );
		n.onExecuted = function( ee, dd )
		{
			const course = JSON.parse( dd );
			//console.log( 'initclassroomdetails course', [ classroomId, listview, course ]);
			let section = FUI.getElementByUniqueId( 'classroom_section_1' );
			const now = Date.now();
			const cStart = Date.parse( course.ClassStartDate );
			const cEnd = Date.parse( course.ClassEndDate );
			const started = cStart < now;
			const ended = cEnd < now;
			let progress = null;
			if ( course.Status )
				progress = course.Status;
			
			let btnText = '';
			let btnDisable = ( !started || ended );
			
			//console.log( 'when does it start?', course, now );
			
			// Button icon
			let classText = 'fa-play-circle-o';
			
			if( progress )
			{
				btnText = 'Continue course';
				classText = 'fa-arrow-circle-right';
			}
			if( !started )
			{
				btnText = 'Not yet available';
				classText = 'fa-warning';
			}
			if( started && !progress )
			{
				btnText = 'Start course';
			}
			if( ended )
			{
				btnText = 'Course Ended';
				classText = 'fa-warning';
			}
			
			let btnClick = 'moduleObject.classrooms.courseViewer(' + course.ID +')';
			
			if( parseInt( progress ) == 9 )
			{
				btnText = 'Course completed';
				classText = 'fa-check Disabled';
				btnClick = '';
			}
			
			section.setHeader( 'Details for ' + course.Name );
			section.setContent( '<p class="TextRight"><button ' + ( btnDisable ? 'disabled' : '' ) + ' type="button" class="IconSmall ' + classText + '" onclick="' + btnClick + '">' + btnText + '</button></p>' );
			
			let list = FUI.getElementByUniqueId( 'classroom_progress' );
			let m = new Module( 'system' );
			m.onExecuted = function( ee, ed )
			{
				if( ee == 'ok' && ed.length )
				{
					let rows = false
					try
					{
						rows = JSON.parse( ed );
					}
					catch( e )
					{
						return;
					}
					let out = [];
					
					let sections = [];
					for( let a = 0; a < rows.length; a++ )
					{
						sections.push( rows[a].ID );
					}
					let sm = new Module( 'system' );
					sm.onExecuted = function( se, sd )
					{
						let sectionProgress = false;
						if( se == 'ok' )
						{
							try
							{
								sectionProgress = JSON.parse( sd );
							}
							catch( e )
							{
								sectionProgress = false;
							}
						}
						for( let a = 0; a < rows.length; a++ )
						{
							// Get section progress
							let sprog = sectionProgress ? ( sectionProgress[ rows[a].ID ] ? sectionProgress[ rows[a].ID ].progress : '0%' ) : '0%';
							out.push( [ {
								type: 'string',
								value: rows[a].Name
							}, {
								type: 'string',
								value: '<progressbar progress="' + sprog + '"/>',
							}, {
								type: 'string',
								value: sprog == '100%' ? 'Completed' : 'Not completed',
							}, {
								type: 'string',
								value: friendUP.tool.ucfirst( friendUP.tool.getChatTime( ( new Date( rows[a].DateUpdated ) ).getTime() ) )
							} ] );
						};
						list.setRowData( out );
					}
					sm.execute( 'appmodule', {
						appName: 'Courses',
						command: 'getsectionprogress',
						sections: sections,
						courseId: course.ID
					} );
				}
			}
			m.execute( 'appmodule', {
				appName: 'Courses',
				command: 'listsections',
				courseId: course.ID
			} );
			
			// Read news bulletin
			let news = FUI.getElementByUniqueId( 'classroom_news' );
			news.setHeader( 'News and updates' );
			let ne = new Module( 'system' );
			ne.onExecuted = function( ner, ned )
			{
				if( ner != 'ok' )
				{
					news.setContent( '<p>No news at this time.</p>' );
					return;
				}
			
				let newsItems = JSON.parse( ned );
				let str = '';
				for( let a = 0; a < newsItems.length; a++ )
				{
					str += '<div class="NewsItem">\
						<div class="Date FloatRight MarginLeft MarginBottom">' + friendUP.tool.getChatTime( newsItems[a].DateUpdated ) + '</div>\
						<div class="NewsContent">' + newsItems[a].Message + '</div>\
					</div>';
				}
				news.setContent( str );
			}
			ne.execute( 'appmodule', {
				appName: 'Courses',
				command: 'getnews',
				classroomId: self.currentClassroomId
			} );
			
		}
		n.execute( 'appmodule', {
			appName: 'Courses',
			command: 'getcoursebyclassroom',
			courseId: classroomId
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
			// Get the current course session
			let j = new Module( 'system' );
			j.onExecuted = function( je, jd )
			{
				if( je == 'ok' )
				{
					let courseSession = JSON.parse( jd );
					
					if( !courseSession || !courseSession.courseSessionId )
					{
						Alert( 'No active course session', 'Could not initialize an active course session. Aborting.' );
						return;
					}
					
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

					self.view = new View( {
						title: 'Taking course: ' + course.Name,
						width: 1280,
						height: 700
					} );
					self.view.onClose = function()
					{
						if( self.view ) self.view = null;
					}
					
					let f = new File( 'Progdir:Assets/course.html' );
					f.onLoad = function( data )
					{
						self.view.setContent( data, function()
						{
							self.view.sendMessage( { 
								command: 'loadcourse', 
								courseId: course, 
								courseSessionId: courseSession.courseSessionId
							} );
						} );
					}
					f.load();
				}
				else
				{
					Alert( 'No active course session', 'Could not initialize an active course session. Aborting (²).' );
					return;
				}
			}
			j.execute( 'appmodule', {
				appName: 'Courses',
				command: 'getcoursesession',
				courseId: courseId
			} );
		}
		m.execute( 'appmodule', {
			appName: 'Courses',
			command: 'getcourse',
			courseId: courseId
		} );
	}
}


