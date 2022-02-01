<?php

/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*
    Requirements: php/friend.php must be in memory
*/


/*
    Database IO Fix class   
    
    Overloads LoadTable and Save() methods in dbIO and parent
    to fix bug when you have auto updated fields (Date) that 
    need to be excluded from queries (cannot have empty string '')

*/
class DbIOFix extends DbIO
{
    function __construct( $TableName = false, $database = false )
    {
        parent::__construct( $TableName, $database ? $database : $this->_database );
    }

    // Overloads LoadTable method in dbIO parent class
    function LoadTable( $name = false )
    {
        if( !$this->_database ) return false;
        if( !$name && !$this->_name ) return false;
        else if( $name ) $this->_name = $name;
        
        if( method_exists( $this, 'OnLoad' ) )
            $this->OnLoad();
            
        if( $result = $this->_database->FetchArray( "DESCRIBE `{$this->_name}`" ) )
        {
            $this->_primarykeys = array();
            $this->_fieldnames = array();
            $this->_fieldtypes = array();
            $this->_autofields = array();
            foreach( $result as $row )
            {
                $this->_fieldnames[] = $row[ 'Field' ];
                $this->_fieldtypes[] = preg_replace( '/\(.*\)/', '', $row[ 'Type' ] );
                $this->{$row['Field']} = null;
                if( $row[ 'Key' ] == 'PRI' )
                {
                    if( $row['Extra'] == 'auto_increment' )
                        $this->_autofields[] = $row[ 'Field' ];
                    $this->_primarykeys[] = $row[ 'Field' ];
                }
                /* ******************* *
                *  Overloaded criteria: 
                *  if "DEFAULT_GENERATED" is part of the string add
                *  this field to _autofields
                */
                if( strpos($row['Extra'], 'DEFAULT_GENERATED') !== false)
                    $this->_autofields[] = $row[ 'Field' ];

            }
            if( method_exists( $this, 'OnLoaded' ) )
                $this->OnLoaded();
            return true;
        }
        return false;
    }

    // Overloads save method in dbIO class
    function Save()
    {
        global $Logger;
        
        if( !$this->_database )
        {
            $this->_lastError = 'No database connection.';
            return false;
        }
        if( !$this->_primarykeys )
        {
            $this->_lastError = 'No primary key(s).';
            return false;
        }
        // Hook
        if( method_exists( $this, 'OnSave' ) ) $this->OnSave();
        
        // Save mode
        $mode = 0;
        $query = '';
        
        // Check if keys == fields
        if( count( $this->_primarykeys ) == count( $this->_fieldnames ) )
        {
            $mode = 1;
        }
        else
        {
            // Needs all primary keys to update
            foreach( $this->_primarykeys as $k )
            {
                if( $this->$k == null )
                {
                    $mode = 1; break;
                }
            }
        }

        // Insert
        if( $mode == 1 )
        {
            $query .= 'INSERT INTO `' . $this->_name . '`( ';
            $filds = array(); $fildz = array();
            foreach( $this->_fieldnames as $f )
            {
                if( in_array( $f, $this->_autofields ) )
                    continue;
                $filds[] = "`$f`";
                $fildz[] = $f;
            }
            $query .= implode( ', ', $filds ) . ' ) VALUES( ';
            $vals = array();
            foreach( $fildz as $v )
            {
                $vals[] = $this->EncapsulateField( $v, $this->$v );
            }
            $query .= implode( ', ', $vals ) . ' )';
        }
        else
        {
            $query .= 'UPDATE `' . $this->_name . '`';
            $sets = array();
            foreach( $this->_fieldnames as $f )
            {
                if( in_array( $f, $this->_primarykeys ) )
                    continue;
                /* ******************* *
                *  Overloaded
                *  Add criteria to skip autofields for update 
                *  Possibly remove above statement as it has same
                *  function
                */
                if( in_array( $f, $this->_autofields ) )
                    continue;
                
                $sets[] = "`$f`=" . $this->EncapsulateField( $f, $this->$f );
            }
            $query .= ' SET ' . implode( ', ', $sets ) . ' WHERE ';
            $ands = array();
            foreach( $this->_primarykeys as $k )
            {
                $ands[] = "`$k`=" . $this->EncapsulateField( $k, $this->$k );
            }
            $query .= implode( ' AND ', $ands );
        }
    
        // Execute
        if( $result = $this->_database->Query( $query ) )
        {
            // Hook
            if( method_exists( $this, 'OnSaved' ) ) $this->OnSaved();
        }
        $this->_lastQuery = $query;
        
        // Update with right ID --------------------------------------------
        if( count( $this->_primarykeys ) == 1 )
        {
            $v = $this->_primarykeys[0];
            $id = $mode == 1 ? $this->GetLastInsertId() : $this->$v;
            $this->$v = $id;
            $this->Load();
        }
        // Support multiple primary keys
        else if( count( $this->_primarykeys ) > 1 )
        {
            $error = false;
            foreach( $this->_primarykeys as $k=>$v )
            {
                if( !isset( $this->$v ) )
                {
                    $this->_lastError = 'Failed to run query.';
                    $error = true;
                }
            }
            if( !$error )
                $this->Load();
        }
        else $this->_lastError = 'Failed to run query.';
        
        return $result;
    }

}

/* CourseDatabase IO methods
*
*
*/


class CourseDatabase
{
    public function __construct()
    {
        //die("hallo");
        global $SqlDatabase;
        
        $o = new dbIO( 'FSetting' );
        $o->Type = 'CourseCreator';
        $o->Key = 'Database';
        if( !$o->Load() ) {
            die( 'fail<!--separate-->{"message":"Could not read database setup."}' );
        }
        
        $data = json_decode( $o->Data );
        if( !$data )
            die( 'fail<!--separate-->{"message":"Could not read database specifics."}' );
        
        $db = new SqlDatabase();
        $db->Open( $data->Hostname, $data->Username, $data->Password ) or
            die( 'fail<!--separate-->{"message":"Could not connect to database."}' );
        $db->SelectDatabase( $data->Database ) or
            die( 'fail<!--separate-->{"message":"Could not select database."}' );
        
        $this->database =& $db;
        $this->data =& $data;
    }


    /*
        Update or Create record in table given by object 
        parameter $vars->table
        
        If primary keys are given in object parmeters 
        update is attempted. If primary key not given 
        then a new record is created.
    */
    public function updateTable( $vars )
    {
        global $User;

        $vars->OwnerID = $User->ID;
        $o = new dbIOFix(
            $vars->table, 
            $this->database 
        );

        $o->SetFromObject($vars);

        if ( $o->Save() ){
            return "ok<!--separate-->" . $o->ID;
        }
        
        return 'fail<!--separate-->{"message":"Could not update table","response":-1,"mysql_error":"' . mysqli_error( $this->database->_link ) . '"}';
    }


    /* 

        Update element state
        on UserClassroomId and ElementId

    */
    public function updateLoadTable( $vars )
    {
        global $User;

        $vars->OwnerID = $User->ID;
        $o = new dbIOFix(
            $vars->table, 
            $this->database 
        );

        // Set 'primary keys'
        $o->ElementID = $vars->ElementID;
        $o->UserClassroomID = $vars->UserClassroomID;       

        // Load the table to set primary key if exists
        $o->Load();

        // Set the rest of the properties
        $o->SetFromObject($vars);

        if ( $o->Save() ){
            return "ok<!--separate-->" . $o->ID;
        }
        return 'fail<!--separate-->{"message":"Could not update table","response":-1,"mysql_error":"' . mysqli_error( $this->database->_link ) . '"}';
    }

    // Get a class room list
    public function getClassroomList( $vars )
    {
        global $User;
        
        $query = '
            SELECT 
                c.Name as classroomName,
                c.CourseID as courseID
            FROM CC_Classroom c
            INNER JOIN CC_UserClassroom uc
            ON uc.classroomID = uc.ID
            WHERE uc.UserID = ' . $User->ID;

        if ($rows = $this->database->fetchObjects( $query ))
        {
            return "ok<!--separate-->" . json_encode($rows);
        }
        return 'fail<!--separate-->{"message":"Could not get classroom list","response":-1,"mysql_error":"' . mysqli_error( $this->database->_link ) . '"}';
    }

    // Get an element in a table
    public function getTable( $vars )
    {
        global $User;

        $o = new dbIOFix(
            $vars->table, 
            $this->database 
        );

        // Set 'primary keys'
        $o->ElementID = $vars->ElementID;
        $o->UserClassroomID = $vars->UserClassroomID;

        // If find in Load then return single
        if ( $o->Load() )
        {
            $r = new stdClass();
            foreach( $o->_fieldnames as $f)
            {
                $r->{$f} = $o->{$f};
            }
            return "ok<!--separate-->" . json_encode($r);
        }
        return 'fail<!--separate-->{"message":"Could not get table","response":-1,"mysql_error":"' . mysqli_error( $this->database->_link ) . '"}';
    }


    // Get a single classroom
    public function getClassroom( $vars )
    {
        global $User;
        
        $query = '
            SELECT 
                c.Name as classroomName,
                c.CourseID as courseID
            FROM CC_Classroom c
            INNER JOIN CC_UserClassroom uc
            ON uc.classroomID = uc.ID
            WHERE uc.UserID = ' . $User->ID;

        if ($rows = $this->database->fetchObjects( $query ))
        {
            return "ok<!--separate-->" . json_encode($rows);
        }
        return 'fail<!--separate-->{"message":"Could not get classroom list","response":-1,"mysql_error":"' . mysqli_error( $this->database->_link ) . '"}';
    }

    /* Update Element
    *
    */
    public function updateElement( $vars ){
        $query = '
            UPDATE CC_Element
            SET
                Name = ' . $vars->Name . ',
                DisplayID = ' . $vars->DisplayID .',
                Properties = ' . addslashes($vars->Properties) . '
                PageID = ' . $vars->PageID . '
            WHERE
                ID = ' . $vars->ID;
                

        //die("ok<!--separate-->" . var_dump($vars));
        if ($rows = $this->database->fetchObjects( $query ))
        {
            //die("ok<!--separate-->" . var_dump($rows));
            return "ok<!--separate-->" . json_encode($rows);
        }
        return 'fail<!--separate-->{"message":"Could not update element", "response":-1,"mysql_error":"' . mysqli_error( $this->database->_link ) . '"}';
    }


    public function deleteRow( $vars ){
        global $User;
        $vars->OwnerID = $User->ID;

        $o = new dbIOFix(
            $vars->table, 
            $this->database 
        );   

        $o->SetFromObject($vars);

       
        if ( $o->Delete() ){
            return "ok<!--separate-->" . $o->ID;
        }
        die(var_dump($o));
        return 'fail<!--separate-->{"message":"Could delete row","response":-1,"mysql_error":"' . mysqli_error( $this->database->_link ) . '"}';
    }

    public function getCourseList( $vars ){
        global $User;
        
        $query = '
            SELECT 
                c.ID as courseID,
                c.Name as courseName,
                c.DisplayID as courseDisplayID,
                s.ID as sectionID,
                s.Name as sectionName,
                s.DisplayID as sectionDisplayID,
                p.ID as pageID,
                p.DisplayID as pageDisplayID,
                p.Name as pageName
            FROM
                CC_Course as c
                LEFT JOIN CC_Section s
                ON c.ID = s.CourseID
                LEFT JOIN CC_Page p
                ON s.ID = p.SectionID
            WHERE
                c.OwnerID = \'' . $User->ID . '\'
            ORDER BY
                c.DisplayID,
                s.DisplayID,
                p.DisplayID
        ';
        //die("ok<!--separate-->" . var_dump($vars));
        if ($rows = $this->database->fetchObjects( $query ))
        {
            //die("ok<!--separate-->" . var_dump($rows));
            return "ok<!--separate-->" . json_encode($rows);
        }
        return 'fail<!--separate-->{"message":"Could not get CourseList","response":-1,"mysql_error":"' . mysqli_error( $this->database->_link ) . '"}';
    }

    public function getSectionData( $vars ){
        global $User;
        //die('in get section data ' . var_dump($vars));
        $query =  '
            SELECT
                s.ID as sectionID,
                s.Name as sectionName,
                s.DisplayID as sectionDisplayID,
                p.ID as pageID,
                p.Name as pageName,
                p.DisplayID as pageDisplayID,
                e.ID as elementID,
                e.DisplayID as elementDisplayID,
                e.Properties as elementProperties,
                t.Name as elementType
            FROM CC_Section s 
            INNER JOIN CC_Page p
            ON s.ID = p.SectionID
            INNER JOIN CC_Element e
            ON p.ID = e.PageID
            INNER JOIN CC_ElementType t
            ON e.ElementTypeID = t.ID
            WHERE s.OwnerID = \'' . $User->ID . '\' 
                AND s.ID = ' . $vars->sectionId . '
                AND p.ID = ' . $vars->pageId . '
            ORDER BY
                s.DisplayID,
                p.DisplayID,
                e.DisplayID
        ';
        //die("ok<!--separate-->" . var_dump($vars));
        if ($rows = $this->database->fetchObjects( $query ))
        {
            $rows = $this->_convertJsonColumns(
                $rows, 
                ['elementProperties'] 
            );
            return "ok<!--separate-->" . json_encode($rows);
        }

        return 'fail<!--separate-->{"message":"Could not get sectiondata","response":-1,"mysql_error":"' . mysqli_error( $this->database->_link ) . '"}';
    }

    public function _convertJsonColumns( $rows, $columns ){
        foreach( $columns as $c )
        {
            foreach( $rows as $i=>$r)
            {
                $rows[$i]->$c = json_decode($rows[$i]->$c);
            }
        }
        return $rows;
    }



    /*
    public function getRowOnId( $vars )
    {   
        $o = new dbIO( $vars->table, $this->database );
        $o->ID = $vars->id;
        $o->Load();
        $row = $this->_getRow($o);
        return json_encode($row);
    }

    public function getTable( $vars ){
        //die($vars->table);
        if ($rows = $this->database->fetchObjects(
            'SELECT * FROM ' . $vars->table
        ))
        {
            $rows = $this->_convertJsonTypes( $vars->table, $rows );
            return json_encode($rows);
        }
        return 'fail';
    }

   
   

    public function _getRow( $dbioo ){
        $row = array();
        foreach( $dbioo->_fieldnames as $k=>$v )
        {
            if( isset( $dbioo->$v ) )
            {
                $row[$v] = $dbioo->$v;
                // decode if the field is json
                if ( $dbioo->_fieldtypes[$k] == 'json' ){
                    $row[$v] = json_decode($row[$v]);
                }
            }
        }
        return $row;
    }
    */
    
    /*
        Gets a list of modules and their metadata in a json structure
    */
    public function modules( $args = false )
    {
        global $User;
        
        $dir = __DIR__ . '/../Submodules/';
        $modules = array();
        if( $d = opendir( $dir ) )
        {
            while( $f = readdir( $d ) )
            {
                if( substr( $f, 0, 1 ) == '.' ) continue;
                if( substr( $f, -4, 4 ) != '.php' ) continue;
                $spec = json_decode( file_get_contents( $dir . $f . '.json' ) );
                $modules[$spec->priority] = array(
                    'name' => substr( $f, 0, strlen( $f ) - 4 ),
                    'heading' => $spec->heading,
                    'payoff' => $spec->payoff
                );
            }
            closedir( $d );
            ksort( $modules );
            die( 'ok<!--separate-->' . json_encode( $modules ) );
        }   
        die( 'fail<!--separate-->{"message":"No such folder Submodules/"}' );
    }
    
    /*
        Manages different submodule command methods and returns the answer
    */
    public function submodule( $args )
    {
        $modPath = __DIR__ . '/../Submodules/';
        
        $module = $modPath . $args->submodule . '.php';
        if( file_exists( $module ) )
        {
            $courseDb =& $this->database;
            require( $module );
        }
        die( 'fail<!--separate-->{"message":"Could not find submodule ' . $args->submodule . '."}' );
    }
}

?>
