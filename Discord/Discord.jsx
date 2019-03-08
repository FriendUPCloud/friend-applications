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
/** @file
 *
 * Friend web-application template
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 12/10/2017
 */

Application.run = function( msg )
{
	// Make a new window with some flags
	this.mainView = new View(
	{
		title: 'Discord Web',
		width: 1280,
		height:  720
	} );

	// Displays the 'About' option in the menu
	this.drawMenu();

	// Load the html into the view
	var self = this;
	var f = new File( 'Progdir:Templates/index.html' );
	f.onLoad = function( data )
	{
		// Set it as window content
		self.mainView.setContent( data );
	}
	f.load();

	// On closing the window, quit.
	this.mainView.onClose = function()
	{
		Application.quit();
	}
};

// Redraws the main application pulldown menu
Application.drawMenu = function()
{
	this.mainView.setMenuItems(
	[
		{
			name: 'File',
			items:
			[
				{
					name: i18n( 'About' ),
					command: 'about'
				},
				{
					name: i18n( 'Help' ),
					command: 'help'
				}
			]
		}
	] );
};

// Message handling
Application.receiveMessage = function( msg )
{
	switch( msg.command )
	{
	case 'about':
		this.about();
		break;
	case 'help':
		this.help();
		break;	}
};

// About box
Application.about = function()
{
	if( this.aboutWindow )
		return;
	this.aboutWindow = new View(
	{
		title: 'About Discord Web',
		width: 400,
		height: 200
	} );
	var v = this.aboutWindow;
	this.aboutWindow.onClose = function()
	{
		Application.aboutWindow = false;
	}
	var f = new File( 'Progdir:Templates/about.html' );
	f.i18n();

	var self = this;
	f.onLoad = function( data )
	{
		self.aboutWindow.setContent( data );
	}
	f.load();
};

// Help box
Application.help = function()
{
	if( this.helpWindow )
		return;
	this.helpWindow = new View(
	{
		title: 'Help with Discord Web',
		width: 640,
		height: 480
	} );
	var v = this.helpWindow;
	this.helpWindow.onClose = function()
	{
		Application.helpWindow = false;
	}
	var f = new File( 'Progdir:Templates/help.html' );
	f.i18n();

	var self = this;
	f.onLoad = function( data )
	{
		self.helpWindow.setContent( data );
	}
	f.load();
};