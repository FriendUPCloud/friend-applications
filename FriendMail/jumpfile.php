<?php
	// Copied from default index.php
	define('APP_PATH', '/usr/local/share/cypht/');
	define('DEBUG_MODE', false);
	define('CACHE_ID', '3979USqI%2Bn89e2dVr3Ja9Z6%2FsE7jXEGxAd3JkvaPE%2B4%3D');
	define('SITE_ID', '%2Bsr9zTWF23YSu8OnWLnHC26SjRbcIodKASRP%2BxhxUDeYcreSY3oqNvmyBp7pbGpJFDmnTOiSrzCdm9GXUapJNg%3D%3D');
	define('JS_HASH', 'sha512-BSsY4qKNBwQOnT9K7r61Ga/XRmfkIrdb0q51DTQ5FmFu4Xc/ZsAOq0TgltGVtfZjTPQuFzEQVw2ONHfDt9aklw==');
	define('CSS_HASH', 'sha512-6vC+HsbgdEVSJNW/CNh9OsI+OzjlxJfjheASjB7Kp0w1O6lsiAephaJne2E2LOjRFJTQnDv7BrpERb3GmrYhwg==');












	// This stuff matches line numbers with default index.php

	// show all warnings in debug mode
	if (DEBUG_MODE) {
	    error_reporting(E_ALL | E_STRICT);
	}

	// config file location
	define('CONFIG_FILE', APP_PATH.'hm3.rc');

	// don't let anything output content until we are ready
	ob_start();

	// set default TZ
	date_default_timezone_set( 'UTC' );

	// get includes
	require APP_PATH.'lib/framework.php';

	// get configuration
	$config = new Hm_Site_Config_File(CONFIG_FILE);

	// Altered behavior here: ...

	// setup ini settings
	require APP_PATH.'lib/ini_set.php';

	/* process the request */
	$session_setup = new Hm_Session_Setup( $config );
	$session = $session_setup->setup_session();

	$pagekey = $session->build_fingerprint( $_SERVER, SITE_ID );
	$user = $_REQUEST['username'];
	$pass = $_REQUEST['password'];
	$myfolder = substr( $_SERVER['REQUEST_URI'],0, strrpos($_SERVER['REQUEST_URI'],'/' ) + 1);

	if( $user )
	{
		echo <<<EOL
<html>
	<head><title>Friend Mail - login form</title></head>
	<body>
		<form id="patlauncher" action="{$myfolder}?page=message_list&list_path=combined_inbox" method="POST" style="display:none;">
			<input type="hidden" id="hm_page_key" name="hm_page_key" value="{$pagekey}" />
			<input type="hidden" id="username" name="username" value="{$user}" />
			<input type="hidden" id="password" name="password" value="{$pass}" />
			<input type="submit" value=" GO GO GO " />
		</form>
		<script type="text/javascript">
			document.getElementById('patlauncher').submit();
		</script>
	</body>
</html>
EOL;
	}
	else
	{
		echo <<<EOL
<html>
	<head><title>Friend Mail - register</title></head>
	<body>
		<script>
			window.parent.postMessage( { data: '{"method":"register_friendmail_user"}' }, '*' );
		</script>
	</body>
</html>
EOL;
	}

?>
