/* Add flag to determine if the course is deleted */

ALTER TABLE CC_Course ADD IsDeleted tinyint(4) default 0 AFTER `Name`;

/* Make CC_Element sortable */

ALTER TABLE CC_Element ADD SortOrder int(11) default 0 AFTER ElementTypeID;

/* Add CC_Certificate table */

select "Certificate Table" as "";
CREATE TABLE IF NOT EXISTS CC_Certificate(
    ID BIGINT(20) auto_increment NOT NULL,
    UserID BIGINT(20) NOT NULL,
    DateAdded DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CertName VARCHAR(128) NOT NULL,
    FileName VARCHAR(32) NOT NULL,
    FileExt VARCHAR(5) NOT NULL,
    PRIMARY KEY(ID)
);

ALTER TABLE CC_Certificate ADD ClassID BIGINT(20) AFTER UserID;

CREATE TABLE IF NOT EXISTS `CC_ElementResult` (
  `ID` bigint NOT NULL AUTO_INCREMENT,
  `CourseID` bigint NOT NULL,
  `CourseSessionID` bigint NOT NULL,
  `ElementID` varchar(255) DEFAULT '',
  `UserID` bigint NOT NULL,
  `Data` text,
  `DateCreated` datetime DEFAULT NULL,
  `DateUpdated` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
);

CREATE TABLE IF NOT EXISTS `CC_CourseSession` (
  `ID` bigint NOT NULL AUTO_INCREMENT,
  `UserID` bigint NOT NULL,
  `CourseID` bigint NOT NULL,
  `Status` tinyint NOT NULL DEFAULT '0',
  `DateCreated` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
);

CREATE TABLE IF NOT EXISTS `CC_File` (
  `ID` bigint NOT NULL AUTO_INCREMENT,
  `Filename` varchar(255) DEFAULT NULL,
  `OriginalFilename` varchar(255) DEFAULT NULL,
  `ElementID` bigint NOT NULL,
  `CourseID` bigint NOT NULL,
  `DateCreated` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
);

/* Add Status to classroom table */
ALTER TABLE CC_Classroom ADD Status INT DEFAULT 0 AFTER ClassRoomCategoryID;
ALTER TABLE CC_Course ADD Status INT DEFAULT 0 AFTER `Name`;

/* Radio box type */
INSERT INTO CC_ElementType ( ID, DisplayOrder, Name, DateCreated, DateUpdated, Properties, IsQuestion ) VALUES ( 4, 3, "radioBoxQuestion", NOW(), NOW(), '{}', 1 );
