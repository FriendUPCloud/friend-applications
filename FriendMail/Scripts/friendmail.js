/*©agpl*************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg )
{
	this.setApplicationName( 'Friend Mail' );
	Application.runChecks();
}

// ----------------------------------------------------------------------------- 
Application.runChecks = function()
{
	var m = new Module( 'mail' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			//console.log( d );
			
			var tmp;
			try
			{
				tmp = JSON.parse( d );
			}
			catch(e)
			{
				console.log( 'answer was not JSON...', d );	
				return;
			}
			
			Application.friendmailconfig = tmp;


			Application.showFriendMail();
		}
		else
		{
			Application.displayError( 'FriendMail configuration could not be loaded.', e, d );
		}
	}
	m.execute( 'initfriendmail' );
}

// -----------------------------------------------------------------------------
Application.showFriendMail = function()
{
	var w = new View( {
		title: 'Friend Mail',
		width: 900,
		height: 700
	} );
	
	w.onClose = function()
	{
		Application.quit();
	}
	
	this.w = w;
	
	this.baseUrl = Application.friendmailconfig.url.replace( 'jumpfile', 'index' );
	
	var f = new File( 'Progdir:Templates/friendmail.html' );
	f.replacements = {
		'friendmailhost': Application.friendmailconfig.url,
		'friendmailuser': Application.friendmailconfig.user,
		'friendmailpass': Application.friendmailconfig.pass
	};	
	
	f.onLoad = function( data )
	{
		var documentRoot = document.location.href.split( /[a-z]*?\.html/ )[0];
	
		w.setContent( data, function(){
			w.sendMessage( { 
				command: 'launch',
				documentRoot: documentRoot
			} );
		} );
		w.setMenuItems( [
		{
			name: i18n( 'menu_File' ),
			items: [
				{
					name: i18n( 'menu_quit' ),
					command: 'quit'
				}
			]
		}
		]);
	}
	f.load();
	
}

// -----------------------------------------------------------------------------
Application.displayError = function(errmsg)
{
	// Make a new window with some flags
	var v = new View( {
		title: 'Friend Mail Error',
		width: 480,
		height: 240
	} );	
	v.onClose = function()
	{
		Application.quit();
	}
	v.setContent('<h1 style="color:#F00; padding:32px; border:4px solid #F00; margin:32px; border-radius:8px;">'+ errmsg +'</h1>');
}

// -----------------------------------------------------------------------------
Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	if( typeof( messageHandlers[ msg.command ] ) )
		messageHandlers[ msg.command ]( msg );
}

var messageHandlers = {
	accounts: function( msg )
	{
		if( Application.accountsw )
		{
			return;
		}
		Application.accountsw = new View( {
			title: i18n( 'title_accounts' ),
			width: 600,
			height: 400
		} );
		
		var ac = Application.accountsw;
		
		var f = new File( 'Progdir:Templates/accounts.html' );
		f.onLoad = function( data )
		{
			ac.setContent( data );
		}
		f.load();
	},
	closeaccounts: function( msg )
	{
		if( Application.accountsw )
		{
			Application.accountsw.close();
			Application.accountsw = false;
		}
	},
	inside_menu: function( msg )
	{
		Application.w.setMenuItems( [
			{
				name: i18n( 'menu_File' ),
				items: [
					{
						name: i18n( 'menu_quit' ),
						command: 'quit'
					}
				]
			},
			{
				name: i18n( 'menu_Navigation' ),
				items: [
					{
						name: i18n( 'i18n_menu_email_overview' ),
						command: 'inbox'
					},
					{
						name: i18n( 'i18n_menu_email_flagged' ),
						command: 'email_flagged'
					},
					{
						name: i18n( 'i18n_menu_email_unread' ),
						command: 'email_unread'
					},
					{
						name: i18n( 'i18n_menu_calendar' ),
						command: 'calendar'
					},
					{
						name: i18n( 'i18n_menu_email_history' ),
						command: 'email_history'
					}
				]
			},
			{
				name: i18n( 'menu_Contacts' ),
				items: [
					{
						name: i18n( 'i18n_menu_show_contacts' ),
						command: 'show_contacts'
					},
					{
						name: i18n( 'i18n_menu_new_contact' ),
						command: 'new_contact'
					}
				]
			},
			{
				name: i18n( 'menu_Settings' ),
				items: [
					{
						name: i18n( 'i18n_menu_application_settings' ),
						command: 'application_settings'
					},
					{
						name: i18n( 'i18n_menu_email_accounts' ),
						command: 'email_accounts'
					}
				]
			}
		] );
	},
	/* Menu actions --------------------------------------------------------- */
	calendar: function( msg )
	{
		Application.w.sendMessage( {
			command: 'go',
			url: Application.baseUrl + '?page=calendar'
		} );
	},
	/* Menu actions --------------------------------------------------------- */
	inbox: function( msg )
	{
		Application.w.sendMessage( {
			command: 'go',
			url: Application.baseUrl + '?page=message_list&list_path=combined_inbox'
		} );
	}
};
