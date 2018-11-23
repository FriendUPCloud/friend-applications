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
	var w = new View( {
		title: 'Photopea',
		width: 1024,
		height: 800
	} );
	
	this.view = w;
	
	w.onClose = function()
	{
		Application.quit();
	}
	
	w.setContent( '<iframe style="position: absolute; top: 0; left: 0; margin: 0; width: 100%; height: 100%; border: 0" src="http://www.photopea.com/"></iframe>' );
}

