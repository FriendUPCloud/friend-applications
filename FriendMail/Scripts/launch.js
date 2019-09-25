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

Application.run = function()
{
	document.body.classList.add( 'Loading' );
};

Application.onQuit = function()
{
	//console.log('Quitting FriendMail');
}

Application.receiveMessage = function( msg )
{
	if( msg.method )
	{
		// Yeah, reply with password!
		if( msg.method == 'getpassword' )
		{
			ge('MailFrame').contentWindow.postMessage( {
				method: 'password',
				password: ge( 'password' ).value,
				documentRoot: this.documentRoot
			}, '*' );
		}
	}
	switch( msg.command )
	{
		case 'launch':
			this.documentRoot = msg.documentRoot;
			this.launch();
			break;
		case 'go':
			ge('MailFrame').src = msg.url;
			break;
	}
};

Application.launch = function()
{
	ge( 'MailFrame' ).classList.add( 'Visible' );
	ge( 'MailFrame' ).onload = function()
	{
		document.body.classList.remove( 'Loading' );
		Application.sendMessage( {
			command: 'inside_menu'
		} );
	}
	ge( 'Launcher' ).submit();
}

