<?php

$db = null;
// import for testing off line
include_once( 'classes/database.php');
include_once( '/home/lars/friendup/build/php/classes/dbio.php' );
$conf = parse_ini_file( '/home/lars/friendup/build/cfg/cfg.ini', true );
// print_r($conf);
$db = new SqlDatabase();
$r = $db->Open( 
	$conf[ 'DatabaseUser' ][ 'host' ],
	$conf[ 'DatabaseUser' ][ 'login' ], 
	$conf[ 'DatabaseUser' ][ 'password' ]
);
$db->SelectDatabase("friendup");

// print_r($r);
// print_r(get_class_methods($db));
// Instance our class!

$dbio = new CourseDatabase($db);
$properties = (object)[
	"ID"=>1,
	"Property"=>"new prop"
];

$dbio->updateTable('CC_ElementType', $properties);

// $o = new DbIO( "CC_ElementType" , $db );
// $o->Load(1);
// print_r($o);
// $o->Find();

// $result = $db->FetchArray("SELECT * FROM `CC_ElementType`");
//$result = $db->fetchObjects("SELECT * FROM `CC_ElementType`");
// print_r($result);

?>