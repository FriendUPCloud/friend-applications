/* Add flag to determine if the course is deleted */

ALTER TABLE CC_Course ADD IsDeleted tinyint(4) default 0 AFTER `Name`;
