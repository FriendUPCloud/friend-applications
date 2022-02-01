/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg )
{
    refreshPanelMenu();
}

let currentModule = 0;

function refreshPanelMenu()
{
    let m = new Module( 'system' );
    m.onExecuted = function( e, d )
    {
        if( e != 'ok' )
        {
            return;
        }
        
        let ls = JSON.parse( d );
        
        let out = '';
        
        for( let a = 0; a < ls.length; a++ )
        {
            let img = '';
            switch( ls[a]['name'] )
            {
                case 'dashboard':
                    img = 'dashboard';
                    break;
                case 'courses':
                    img = 'group';
                    break;
                case 'users':
                    img = 'user';
                    break;
                case 'classrooms':
                    img = 'clipboard';
                    break;
            }
            out += '<div class="Module" moduleName="' + ls[a]['name'] + '" id="module_' + ls[a]['name'] + '"><div class="Image IconSmall fa-' + img + '"></div><p><span class="IconSmall fa-text"></span><strong>' + ls[a]['heading'] + '</strong></p><p>' + ls[a]['payoff'] + '</p></div>';
        }
        ge( 'Modules' ).innerHTML = out;
        let mods = ge( 'Modules' ).getElementsByClassName( 'Module' );
        for( let a = 0; a < mods.length; a++ )
        {
            if( a == currentModule )
            {
                mods[a].classList.add( 'Active' );
                setModule( mods[a].getAttribute( 'moduleName' ) );
            }
            else if( mods[a].classList.contains( 'Active' ) )
            {
                mods[a].classList.remove( 'Active' );
            }
            ( function( ele )
            {
                ele.onclick = function()
                {
                    document.body.classList.remove( 'Editmode' );
                    for( let b = 0; b < mods.length; b++ )
                    {
                        if( mods[b] == this )
                        {
                            mods[b].classList.add( 'Active' );
                            setModule( this.getAttribute( 'moduleName' ) );
                        }
                        else
                        {
                            mods[b].classList.remove( 'Active' );
                        }
                    }
                }
            } )( mods[a] );
        }
        
    }
    m.execute( 'appmodule', {
        appName: 'CourseCreator',
        command: 'modules'
    } );
}

function setModule( name )
{
    ge( 'PanelMain' ).classList.add( 'SectionLoading' );
    let m = new Module( 'system' );
    m.onExecuted = function( e, d )
    {
        if( e != 'ok' )
        {
            return;
        }
        if( !Application.submodules )
            Application.submodules = {};        
        ge( 'PanelMain' ).innerHTML = d;
        RunScripts( d, window );
    }
    m.forceHTTP = true;
    m.execute( 'appmodule', {
        appName: 'CourseCreator',
        command: 'submodule',
        vars: {
            submodule: name
        }
    } );
}

Application.receiveMessage = function( msg )
{
    if( msg && msg.submodule )
    {
        if( msg.command )
        {
            if( Application.submodules && Application.submodules[ msg.submodule ] )
            {
                Application.submodules[ msg.submodule ][ msg.command ]( msg.data );
            }
        }
    }
}

