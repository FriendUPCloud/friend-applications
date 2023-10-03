// Start logic for this application scope
Application.run = function( msg )
{
}

// From ether
window.addEventListener( 'message', function( msg )
{
     if( msg.data && msg.data.command )
    {
        switch( msg.data.command )
        {
            case 'save_content':
                if( !Application.currentPath )
                {
                    Application.sendMessage( {
                        command: 'save'
                    } );
                    return;
                }
                let f = new File( Application.currentPath );
                f.save( msg.data.content );
                break;
            // Results
            case 'show_users':
            case 'hide_users':
            case' show_chat':
            case 'hide_chat':
                let options = {};
                switch( msg.data.command )
                {
                    case 'show_users': options.users = true; break;
                    case 'hide_users': options.users = false; break;
                    case' show_chat': options.chat = true; break;
                    case 'hide_chat':  options.chat = false; break;
                }
                Application.sendMessage( {
                    options: options,
                    command: 'drawmenu'
                } );
                break;
            // Loading something
            case 'unload':
                ge( 'mainframe' ).classList.remove( 'Showing' );
                break;
            // We are ready
            case 'ready':
                if( Application.queuedFunc )
                {
                    Application.queuedFunc();
                }
                Application.blocked = false; // unblock
                ge( 'mainframe' ).classList.add( 'Showing' );
                ge( 'mainframe' ).contentWindow.postMessage( { 
                    command: 'setuser',
                    username: Application.fullName
                }, '*' );
                break;
        }
    }
} );

// Receive messages from other scopes
Application.receiveMessage = function( msg )
{
    if( Application.blocked ) return;
    if( !msg.command ) return;
    switch( msg.command )
    {
        case 'drop':
			this.receiveMessage( {
			    command: 'loadfiles',
			    files: msg.data
			} );
			break;
        case 'save':
            Application.currentPath = msg.path;
            ge( 'mainframe' ).contentWindow.postMessage( { 
                command: 'getContent'
            }, '*' );
            break;
        // App wants to edit menu
        case 'menuresponse':
            let options = {};
            options[ msg.type ] = msg.visibility;
            Application.sendMessage( {
                options: options,
                command: 'drawmenu'
            } );
            break;
        case 'sharing_embed':
        case 'show_users':
        case 'hide_users':
        case 'show_chat':
        case 'hide_chat':
        case 'new':
            msg.username = Application.fullName;
            ge( 'mainframe' ).contentWindow.postMessage( msg, '*' );
            break;
        case 'loadfiles':
            Application.currentPath = msg.files[0].Path;
            let f = new File( msg.files[0].Path );
            f.onLoad = function( data )
            {
                Application.blocked = true; // Block messaging!
                ge( 'mainframe' ).contentWindow.postMessage( { command: 'new' }, '*' );
                Application.queuedFunc = function()
                {
                    ge( 'mainframe' ).contentWindow.postMessage( { 
                        command: 'setContent', content: data 
                    }, '*' );
                    Application.sendMessage( {
                        command: 'loadsuccessful',
                        path: msg.files[0].Path
                    } );
                }
            }
            f.load();
            break;
    }
}

