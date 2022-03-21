Application.run = function()
{
}

Application.receiveMessage = function( msg )
{
	if( msg.command == 'loadcertificate' )
	{
		let args = {
			appName: 'Courses',
			command: 'showcertificate',
			certId:  msg.certId
		};
		
		ge( 'CertificateView' ).innerHTML = '';
		let s = document.createElement( 'img' );
		s.src = '/system.library/module/?module=system&authid=' + Application.authId + '&command=appmodule&args=' + JSON.stringify( args );
		ge( 'CertificateView' ).appendChild( s );
	}
}
