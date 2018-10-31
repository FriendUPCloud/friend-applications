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

Application.run = function( msg, iface )
{
	//var s = new Screen( { title: 'Astray', fullscreen: true } );
	//this.screen = s;
	//s.loadTemplate( 'Progdir:index.html' );
	var s = new Screen( {
		title: 'Astray',
		width: 600,
		height: 600
	} );
	
	var f = new File( 'Progdir:index.html' );
	f.onLoad = function( data )
	{
		s.setContent( data );
	}
	f.load();
}

