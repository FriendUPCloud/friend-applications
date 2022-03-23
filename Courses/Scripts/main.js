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
		self.welc = moduleView.moduleContainer.domNode.children[0].children[0];
		self.prog = moduleView.moduleContainer.domNode.children[0].children[1];
		self.stat = moduleView.moduleContainer.domNode.children[0].children[2];
		
		// Welcome 
		self.welc.querySelector('.FUISectionHeader h2').innerHTML = 'Welcome ' + Application.fullName + '!';
		const wc = self.welc.querySelector('.FUISectionContent');
		wc.parentNode.removeChild( wc );
		
		// Activity 
		self.prog = self.prog.querySelector( '.FUISectionContent' );
		self.prog.classList.add( 'dashDisplayWrap' );
		
		// Status
		self.stat = self.stat.querySelector( '.FUISectionContent' );
		self.stat.classList.add( 'dashDisplayWrap' );
		
		console.log( 'sects', {
			welc : self.welc,
			prog : self.prog,
			stat : self.stat,
		});
		
		//self.prog = ge( 'dashProgress' );
		//self.stat = ge( 'dashStatus' );
		
		const cl = new Module( 'system' );
		cl.onExecuted = ( s , d ) => {
			console.log( 'dash list cl', [ s, d ]);
			if ( 'ok' == s )
			{
				const rs = JSON.parse( d );
				console.log( 'rooms', rs );
				const open = {
                    mainNum  : rs.length,
                    mainIcon : 'fa-clock-o',
                    mainText : ( rs.length != 1 ) ? 'Open Courses' : 'Open Course',
                };
                self.addStudentStat( open, '#9b59b6' );
                
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
						let res = null;
						try {
							res = JSON.parse( d );
						}
						catch( ex )
						{
							console.log( 'getclassroomprogress invalid return data', d );
							return;
						}
						console.log( 'getclassroomprogress res', res );
						const prog = res.progress;
						let l = rs.length;
						for( ;l; )
						{
							l--;
							console.log( 'class, prog', rs[l], prog[ rs[l].CourseID ] );
							rs[l].Progress = prog[ rs[l].CourseID ];
							self.addClassProgress( rs[l] );
						}
					}
					else
					{
						console.log( 'getclassroomprogress failed', [ s, d ]);
						try {
							console.log( JSON.parse( d ));
						} catch( ex ) {
							
						}
						
						return;
						/*
						let l = rs.length;
						for( ;l; )
						{
							l--;
							rs[l].Progress = -( Math.floor( Math.random() * 100 ));
							self.addClassProgress( rs[l] );
						}
						*/
					}
				}
				p.execute( 'appmodule', {
					appName    : 'Courses',
					command    : 'getclassroomprogress',
					classrooms : clIds,
				});
				
				const cp = new Module( 'system' );
				cp.onExecuted = ( s, d ) =>
				{
					console.log( 'all completed back', [ s, d ]);
					if ( 'ok' == s )
					{
						let res = null;
						try
						{
							res = JSON.parse( d );
						}
						catch( ex )
						{
							const compl = {
			                    mainNum  : 'borken',
			                    mainIcon : 'fa-book',
			                    mainText : 'Completed courses',
			                    subStat  : undefined,
			                    subText  : undefined,
			                };
			                self.addStudentStat( compl, '#27bcaf' );
							return;
						}
						
						console.log( 'all completed res', res );
						const compl = {
		                    mainNum  : 'NYI',
		                    mainIcon : 'fa-book',
		                    mainText : 'Completed courses',
		                    subStat  : undefined,
		                    subText  : undefined,
		                };
		                self.addStudentStat( compl, '#27bcaf' );
					}
					else
					{
						console.log( 'dash - all completed failed', [ s, d ]);
						try {
							console.log( JSON.parse( d ));
						} catch ( ex ) {}
						
						const compl = {
		                    mainNum  : 'no worky',
		                    mainIcon : 'fa-book',
		                    mainText : 'Completed courses',
		                    subStat  : undefined,
		                    subText  : undefined,
		                };
		                self.addStudentStat( compl, '#27bcaf' );
					}
				}
				
				cp.execute( 'appmodule', {
					appName    : 'Courses',
					command    : 'getclassroomprogress',
					format     : 'sum',
				});
				
				const s = new Module( 'system' );
				s.onExecuted = ( s, d ) => {
					console.log( 'getstats back', [ s, d ]);
					if ( 'ok' == s )
					{
						const res = JSON.parse( d );
						console.log( 'getstats res', res );
						
		                const certs = {
		                    mainNum  : res.certificates.length,
		                    mainIcon : 'fa-certificate',
		                    mainText : ( res.certificates.length == 1 ) ? 'Certificate' : 'Certificates',
		                };
		                self.addStudentStat( certs, '#ff7364' );
					}
					else
					{
						console.log( 'dash getstats failed', [ s, d ]);
					}
				}
				s.execute( 'appmodule', {
					appName : 'Courses',
					command : 'listcertificates',
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
			active  : 'active',
		});
				
	},
	
	addClassProgress( klass )
	{
		const self = this;
		console.log( 'addClassProgress', klass );
		const cEl = document.createElement( 'div' );
		self.prog.appendChild( cEl );
		const cOpts = {
			containerElement : cEl,
		};
		const c = new FUIChartbox( cOpts );
		if ( null == klass.Progress )
            klass.Progress = Math.floor( Math.random() * 100 );
		
		let pColor = '#25bbaf';
        if ( null != klass.Progress )
        {
            if ( klass.Progress > 35 )
                pColor = '#27bcaf';
            if ( klass.Progress > 75 )
                pColor = '#ff7363';
            if ( klass.Progress > 91 )
                pColor = '#d85c4f'
        }
        
        const data = {
        	labels : [
                'complete',
                '',
            ],
            datasets : [{
                label : '',
                data  : [ 
                    klass.Progress, 
                    ( 100 - klass.Progress ),
                ],
                backgroundColor : [
                    pColor,
                    'rgb(230, 230, 230 )',
                ],
            }],
        };
        
        const conf = {
            type    : 'doughnut',
            data    : data,
            options : {
                plugins : {
                    legend : {
                        display : false,
                    },
                },
                cutout : '80%',
            },
        };
        
        c.setData( conf, {
        	label1 : klass.Name,
        	label2 : '',
        	progress : klass.Progress + '%',
        });
	},
	
	addStudentStat( stat, bgColor )
	{
		const self = this;
		console.log( 'addStudentStat', stat );
		const sEl = document.createElement( 'div' );
		self.stat.appendChild( sEl );
		const sOpts = {
			containerElement : sEl,
			bgColor          : bgColor,
		};
		const s = new FUIStatsbox( sOpts );
		s.setData( stat );
	}
};


/* Certificates */

moduleObject.certificates = {
	initialize( moduleView )
	{
		
	},
	preload()
	{
		FUI.addCallback( 'w_reload_certificates', function( lv )
		{
			let s = new Module( 'system' );
			s.onExecuted = function( se, sd )
			{
				if( se != 'ok' )
				{
					return;
				}
				let dat = JSON.parse( sd );
				
				if( !dat.certificates.length )
				{
					lv.setRowData( [ {
						type: 'string',
						value: 'No certificates to list.'
					}, {
						type: 'string',
						value: ''
					}, {
						type: 'string',
						value: ''
					} ] );
					return;
				}
				
				let out = [];
				let certs = dat.certificates;
				for( let a = 0; a < certs.length; a++ )
				{
					out.push( [ 
						{
							type: 'string',
							value: certs[a].Classroom
						},
						{
							type: 'string',
							value: 'Click to open',
							onclick: 'clickety_' + a
						},
						{
							type: 'string',
							value: getDateString( certs[a].DateAdded )
						}
					] );
					( function( cl, cid )
					{
						FUI.addCallback( 'clickety_' + a, function( itm )
						{
							let v = new View( {
								title: 'Checking certificate for ' + cl,
								width: 1100,
								height: 990
							} );
							let f = new File( 'Progdir:Assets/certificate.html' );
							f.onLoad = function( data )
							{
								v.setContent( data, function()
								{
									v.sendMessage( {
										command: 'loadcertificate',
										certId: cid
									} );
								} );
							}
							f.load();
						} );
					} )( certs[a].Classroom , certs[a].ID );
				}
				lv.setRowData( out );
			}
			s.execute( 'appmodule', {
				appName : 'Courses',
				command : 'listcertificates',
			});
		} );
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
					ls.setRowData( [ [ {
						type: 'string',
						value: 'You have no classrooms available.'
					} ] ] );
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
					console.log( 'getclassroomprogress classrooms', [ ce, cd ]);
					let progress = {};
					if( ce == 'ok' )
					{
						try
						{
							const res = JSON.parse( cd ); 
							progress = res.progress;
							console.log( 'w_reload_classrooms res', progress );
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
						
						let prog = '0%';
						if( list[ a ] && progress[ list[a].CourseID ] )
						{
							prog = progress[ list[a].CourseID ];
							//console.log( 'prog', prog );
							if( now >= endTime )
							{
								exStatus = 'Expired';
							}
							else if( prog && prog.status == 9 )
							{
								exStatus = 'Completed';
							}
						}
						else
						{
							exStatus = 'New';
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
								value: '<progressbar progress="' + ( prog ? prog : '0%' ) + '"/>'
							},
							{
								type: 'string',
								value: ( exStatus ? exStatus : ( typeof( prog ) != 'undefined' ) ? 'Active' : 'Available' )
							},
							{
								type: 'string',
								value: getDateString( list[ a ].EndDate ),
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
			
			let details = '';
			if( course.Description && course.Description.length )
			{
				details = '<div class="Details"><p>' + course.Description.split( "\n" ).join ( '<br><br>' ) + '</p></div>';
			}
			
			section.setHeader( 'Details for ' + course.Name );
			section.setContent( details + '<p class="TextRight"><button ' + ( btnDisable ? 'disabled' : '' ) + ' type="button" class="IconSmall ' + classText + '" onclick="' + btnClick + '">' + btnText + '</button></p>' );
			
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
								value: rows[a].DateUpdated != rows[a].DateCreated ? getDateString( rows[a].DateUpdated ) : 'Never'
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
						<div class="Date FloatRight MarginLeft MarginBottom">' + getDateString( newsItems[a].DateUpdated ) + '</div>\
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

/* Date helper */

function getDateString( dt )
{
	function tPad( num )
	{
		if( ( num + '' ).length < 2 )
			return '0' + ( num + '' );
		return num;
	}
	
	let months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Des' ];
	
	let now = new Date();
	let then = new Date( dt );
	
	let nyear = now.getFullYear();
	let nmonth = now.getMonth() + 1;
	let ndate = now.getDate();
	
	let tyear = then.getFullYear();
	let tmonth = then.getMonth() + 1;
	let tdate = then.getDate();
	
	
	// Last year we do not care about time
	if( nyear > tyear )
	{
		return tdate + '. ' + months[ then.getMonth() ] + ' ' + tyear;
	}
	
	// Check span of time
	
	let secs = 0;
	let nowTime = now.getTime();
	let thenTime = then.getTime();
	
	// In the past
	if( nowTime > thenTime )
	{
		secs = Math.floor( ( nowTime - thenTime ) / 1000 );
		
		if( secs < 60 )
		{
			return secs + ' seconds ago.';
		}
		
		if( secs / 60 < 60 )
		{
			return secs + ' minutes ago.';
		}
		
		if( secs / 60 / 60 < 24 )
		{
			return Math.floor( secs / 60 / 60 ) + ' hours ago.';
		}
		
		return tPad( tdate ) + '. ' + tPad( months[ then.getMonth() ] ) + ' ' + tyear; 
	}
	else
	{
		secs = Math.floor( ( thenTime - nowTime ) / 1000 );
		
		if( secs < 60 )
		{
			return 'In ' + secs + ' seconds.';
		}
		
		if( secs / 60 < 60 )
		{
			return 'In ' + secs + ' minutes.';
		}
		
		if( secs / 60 / 60 < 24 )
		{
			return 'In ' + Math.floor( secs / 60 / 60 ) + ' hours.';
		}
		
		return tPad( tdate ) + '. ' + tPad( months[ then.getMonth() ] ) + ' ' + tyear;
	}
}


