/* Add flag to determine if the course is deleted */

ALTER TABLE CC_Course ADD IsDeleted tinyint(4) default 0 AFTER `Name`;

/* Make CC_Element sortable */

ALTER TABLE CC_Element ADD SortOrder int(11) default 0 AFTER ElementTypeID;

/* Add CC_Certificate table */

select "Certificate Table" as "";
CREATE TABLE IF NOT EXISTS CC_Certificate(
    ID BIGINT(20) auto_increment NOT NULL,
    UserID BIGINT(20) NOT NULL,
    ClassID BIGINT(20) NULL,
    DateAdded DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CertName VARCHAR(128) NOT NULL,
    FileName VARCHAR(32) NOT NULL,
    FileExt VARCHAR(5) NOT NULL,
    PRIMARY KEY(ID)
);

CREATE TABLE CC_ElementResult ( 
	ID bigint(20) NOT NULL auto_increment,
	ElementType varchar(255) default "", 
	ElementID varchar(255) default "",
	UserID bigint(20) NOT NULL,
	Data text, 
	DateCreated datetime, 
	DateUpdated datetime, 
	PRIMARY KEY (ID) 
);

