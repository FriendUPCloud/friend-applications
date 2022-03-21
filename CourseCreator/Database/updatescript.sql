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
  `OriginalElementID` bigint NOT NULL,
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

/* Add to section */

ALTER TABLE CC_Section ADD FreeNavigation TINYINT(4) default 0 AFTER `OwnerID`;

/* Track if we have seen a page */
CREATE TABLE IF NOT EXISTS `CC_PageResult` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `CourseSessionID` bigint(20) NOT NULL,
  `Status` tinyint(4) NOT NULL DEFAULT '0',
  `DateCreated` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
);

ALTER TABLE CC_PageResult ADD PageID bigint(20) NOT NULL AFTER ID;

ALTER TABLE CC_CourseSession ADD CurrentPage bigint(20) default 0 AFTER Status;
ALTER TABLE CC_CourseSession ADD CurrentSection bigint(20) default 0 AFTER Status;

/* In case this is missing */
ALTER TABLE CC_ElementResult ADD OriginalElementID bigint(20) NOT NULL AFTER ElementID;

/* News bulletin */
CREATE TABLE IF NOT EXISTS `CC_NewsBulletin` (
  `ID` bigint NOT NULL AUTO_INCREMENT,
  `UserID` bigint NOT NULL,
  `Message` varchar(255) DEFAULT NULL,
  `ClassroomID` bigint NOT NULL,
  `DateCreated` datetime DEFAULT NULL,
  `DateUpdated` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
);

/* Active courses are children of template courses */
ALTER TABLE `CC_Course` ADD `ParentID` bigint DEFAULT 0 AFTER `ID`;
ALTER TABLE `CC_Course` ADD `Description` TEXT AFTER `Name`;
