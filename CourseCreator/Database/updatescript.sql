/* Add flag to determine if the course is deleted */

ALTER TABLE CC_Course ADD IsDeleted tinyint(4) default 0 AFTER `Name`;

/* Make CC_Element sortable */

ALTER TABLE CC_Element ADD SortOrder int(11) default 0 AFTER ElementTypeID;

