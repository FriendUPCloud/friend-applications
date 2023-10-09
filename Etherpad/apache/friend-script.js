window.queueFuncs = [];
FriendApplication = {
	keyboard: {
		shift: false,
		ctrl: false
	},
	setuser( msg )
	{
	    // who knows how this is done..
	},
	new( msg )
	{
		window.parent.postMessage( { command: 'unload' }, '*' );
		setTimeout( function()
		{
			document.location.href = '/';
		}, 250 );
	},
	sharing_embed( msg )
	{
		padeditbar.commands.embed();
	},
	hide_chat( msg )
	{
		if( !document.getElementById( 'chatbox' ) )
			return;
		document.getElementById( 'chatbox' ).classList.remove( 'visible' );
		window.parent.postMessage( { command: 'menuresponse', type: 'chat', visibility: false }, '*' );
	},
	show_chat( msg )
	{
		if( !document.getElementById( 'chatbox' ) )
			return;
		document.getElementById( 'chatbox' ).classList.add( 'visible' );
		window.parent.postMessage( { command: 'menuresponse', type: 'chat', visibility: true }, '*' );
	},
	setContent( msg )
	{
		let cnt = msg.content ? msg.content : '';
		function scset()
		{
			let fr = document.querySelector( 'iframe' );
			if( fr && fr.contentWindow.document )
			{
				// Clear content shit
				while( 1 )
				{
					let test = cnt.split( /(\<div[^\>]*?(id\=\".*?\"))/i );
					if( !test || !test[1] ) break;
					let repl = test[1].split( test[2] ).join( '' );
					cnt = cnt.split( test[1] ).join( repl );
				}
				while( 1 )
				{
					let test = cnt.split( /(\<div[^\>]*?(aria.*?\=\".*?\"))/i );
					if( !test || !test[1] ) break;
					let repl = test[1].split( test[2] ).join( '' );
					cnt = cnt.split( test[1] ).join( repl );
				}
				while( 1 )
				{
					let test = cnt.split( /(\<div[^\>]*?(class\=\"ace-line\"))/i );
					if( !test || !test[1] ) break;
					let repl = test[1].split( test[2] ).join( '' );
					cnt = cnt.split( test[1] ).join( repl );
				}
				setTimeout( function()
				{
					fr.contentWindow.document.ace_inner.document.body.innerHTML = cnt;
				}, 150 );
				return;
			}
		}
		if( document.body && document.body.friendLoaded )
		{	
			scset();
		}
		else
		{
			window.queueFuncs.push( scset );
		}
	},
	getContent()
	{
		window.parent.postMessage( { 
			command: 'save_content', 
			content: document.querySelector( 'iframe' ).contentWindow.document.ace_inner.document.body.innerHTML
		}, '*' );
	}
};


// Incoming event listener
window.addEventListener( 'message', function( msg )
{
	if( msg.data && msg.data.command )
	{
		if( typeof( FriendApplication[ msg.data.command ] ) != 'undefined' )
			FriendApplication[ msg.data.command ]( msg.data );
	}
} );

// Things to do when we load
window.addEventListener( 'load', function()
{
    if( document.querySelector( '#button' ))
    {
            setTimeout( function()
            {
                    document.querySelector( '#button' ).click();
            }, 100 );
    }
	
	// Tracking changes
	let init = setInterval( function()
	{
		let fr = document.querySelector( 'iframe' );
		if( !fr ) return;
		try
		{
			if( fr && 
				fr.contentWindow.document && 
				fr.contentWindow.document.body &&
				fr.contentWindow.document.ace_inner && 
				fr.contentWindow.document.ace_inner.document.body && 
				fr.contentWindow.document.ace_inner.document.body.innerHTML
			)
			{
				window.parent.postMessage( { command: 'ready' }, '*' );
				document.body.friendLoaded = true;
				
				if( window.queueFuncs )
				{
					for( let a = 0; a < queueFuncs.length; a++ )
						queueFuncs[ a ]();
				}
				window.queueFuncs = null;
				
				clearInterval( init );
				fr.contentWindow.document.ace_inner.document.body.addEventListener( 'keydown', function( e )
				{
					// What to do
					if( e.which == 17 )
					{
						FriendApplication.keyboard.ctrl = true;
					}
					else if( e.which == 83 )
					{
						if( FriendApplication.keyboard.ctrl )
						{
							window.parent.postMessage( { 
								command: 'save_content', 
								content: document.querySelector( 'iframe' ).contentWindow.document.ace_inner.document.body.innerHTML
							}, '*' );
						}
					}
					
				} );
				fr.contentWindow.document.ace_inner.document.body.addEventListener( 'keyup', function( e )
				{
					// What to do
					if( e.which == 17 )
					{
						FriendApplication.keyboard.ctrl = false;
					}
				} );
				fr.contentWindow.document.ace_inner.document.body.addEventListener( 'paste', function( e )
				{
					// What to do
					
				} );
				fr.contentWindow.document.ace_inner.document.body.addEventListener( 'cut', function( e )
				{
					// What to do
					
				} );
			}
		}
		catch( e ){}
	}, 100 );
} );
