// Init application
Application.run = function( msg )
{
	this.setApplicationName( 'Etherpad' ); // Task name
	this.setSingleInstance( false ); // Can we run several or only one instance?
	let self = this;
	
	this.loadTranslations( 'Progdir:lang/', function()
	{
    	let cfg = {
    	    serverUrl: top.document.location.protocol + '//etherpad.' + top.document.location.host
    	};
    	
    	cfg.serverUrl = cfg.serverUrl.split( 'me.friendsky.' ).join( 'friendsky.' );
    	
    	// Create a new view window
    	self.mainView = new View( {
    		title: 'Etherpad',
    		width: 960,
    		height: 960,
    		replacements: {
    		    'server-url': cfg.serverUrl
    		},
    		assets: [ 'Progdir:main.html', 'Progdir:main.css', 'Progdir:main.js' ]
    	} );
    	
    	self.menuConfig = {
    	    
    	};
    	self.refreshMenu();
    	
    	// Quit when window closed
    	self.mainView.onClose = function()
    	{
    		Application.quit();
    	}
	} );
}

Application.refreshMenu = function()
{
    let self = this;
    this.mainView.setMenuItems( [ {
        name: i18n( 'i18n_file' ),
        items: [ {
            name: i18n( 'i18n_new' ),
            command: 'new'
        }, {
            name: i18n( 'i18n_load' ),
            command: 'load'
        }, {
            name: i18n( 'i18n_save' ),
            command: 'save'
        }, {
            name: i18n( 'i18n_save_as' ),
            command: 'save_as'
        }, {
            name: i18n( 'i18n_quit' ),
            command: 'quit'
        } ]
    }, {
        name: i18n( 'i18n_collaboration' ),
        items: [ {
            name: i18n( 'i18n_sharing_embed' ),
            command: 'sharing_embed'
        }, {
            name: i18n( 'i18n_show_chat' ),
            command: 'show_chat',
            disabled: self.menuConfig.chat
        }, {
            name: i18n( 'i18n_hide_chat' ),
            command: 'hide_chat',
            disabled: !self.menuConfig.chat
        } ]
    } ] );
}

Application.fileLoad = function()
{
    let flags = {
		multiSelect: false,
		triggerFunction: function( arr )
		{
			if( arr )
			{
			    Application.currentFile = arr[0];
				Application.mainView.sendMessage( {
					command: 'loadfiles',
					files: arr
				} );
				let nam = Application.currentFile.Path;
				Application.mainView.setFlag( 'title', 'Etherpad - ' + sanitizeFilename( nam ) );
			}
			Application.fileDialog = false;
		},
		path: false,
		rememberPath: true,
		mainView: this.mainView,
		type: 'load',
		suffix: [ 'memo', 'html', 'htm' ]	
	};
	new Filedialog( flags );
}

function sanitizeFilename( data )
{
	if( !data ) return '';
	var filename = data.split( ':' )[1];
	
	if( !( filename && filename.indexOf ) )
		return '';
	
	// Join
	filename = filename.split( '.' );
	filename.pop();
	filename = filename.join( '.' );
	
	return filename;
}

// Saves current file
Application.fileSaveAs = function()
{
    let self = this;
	let flags = {
		type: 'save',
		triggerFunction: function( fname )
		{
			if( !fname || !fname.length )
				return;
			
			if( fname.indexOf( '.' ) < 0 )
				fname += '.memo';
			
			self.currentFile = {
				Path: fname
			};
			
			self.mainView.sendMessage( {
	            command: 'save',
	            path: self.currentFile.Path
	        } );
	       
			Application.mainView.setFlag( 'title', 'Etherpad - ' +  sanitizeFilename( fname ) );
		},
		mainView: this.mainView,
		title: i18n( 'i18n_save_as' ),
		suffix: [ 'memo', 'html', 'htm' ]
	};
	new Filedialog( flags );
}

// Receive messages
Application.receiveMessage = function( msg )
{
    let self = this;
	switch( msg.command )
	{
        case 'loadsuccessful':
            // Cool..
            break;
        // From menu ----------------
	    case 'load':
	        this.fileLoad();
	        break;
	    case 'save':
	        if( !self.currentFile || !self.currentFile.Path )
	            this.fileSaveAs();
	        self.mainView.sendMessage( {
	            command: 'save',
	            path: self.currentFile.Path
	        } );
	        break;
	    case 'save_as':
	        this.fileSaveAs();
	        break;
        case 'new':
            if( this.currentFile )
            {
                Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_are_you_sure_new' ), function( d )
                {
                    if( d.data )
                    {
                        self.currentFile = {};
                        self.mainView.sendMessage( {
                            command: 'new'
                        } );
                    }
                } );
            }
            else
            {
                this.currentFile = {};
                self.mainView.sendMessage( {
                    command: 'new'
                } );
            }
            break;
        case 'hide_chat':
        case 'show_chat':
        case 'hide_users':
        case 'show_users':
        case 'sharing_embed':
            self.mainView.sendMessage( msg );
            break;
        case 'drawmenu':
            if( msg.options )
            {
                for( let a in msg.options )
                {
                    self.menuConfig[ a ] = msg.options[ a ];
                }
            }
            self.refreshMenu();
            break;
	}
}

