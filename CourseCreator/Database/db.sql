/* 
* CourseCreator Database Table
*
*/

DROP TABLE IF EXISTS CC_Element;
DROP TABLE IF EXISTS CC_ElementType;
DROP TABLE IF EXISTS CC_Page;
DROP TABLE IF EXISTS CC_Section;
DROP TABLE IF EXISTS CC_CourseCollection;
DROP TABLE IF EXISTS CC_UserGroupClassroom;
DROP TABLE IF EXISTS CC_UserClassroom;
DROP TABLE IF EXISTS CC_Classroom;
DROP TABLE IF EXISTS CC_UserClassroomElement;
DROP TABLE IF EXISTS CC_ClassroomCategory;
DROP TABLE IF EXISTS CC_Course;
DROP TABLE IF EXISTS CC_Role;


select "CourseCollection Table" as "";
CREATE TABLE IF NOT EXISTS CC_CourseCollection(
    ID BIGINT(20) auto_increment NOT NULL,
    DisplayID BIGINT(20) NOT NULL,
    Name VARCHAR(60),
    OwnerID BIGINT(20),
    DateCreated DATETIME DEFAULT CURRENT_TIMESTAMP,
    DateUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(ID)
);
INSERT INTO CC_CourseCollection
(Name, DisplayID, OwnerID)
VALUES
("A Course Collection", 0, 1);


select "Course Table" as "";
CREATE TABLE IF NOT EXISTS CC_Course(
    ID BIGINT(20) auto_increment NOT NULL,
    DisplayID BIGINT(20) NOT NULL,
    Name VARCHAR(60),
    OwnerID BIGINT(20),
    CourseCollectionID BIGINT(20),
    Version VARCHAR(20),
    DateCreated DATETIME DEFAULT CURRENT_TIMESTAMP,
    DateUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(ID)
);
INSERT INTO CC_Course
(Name, DisplayID, OwnerID, CourseCollectionID )
VALUES
("Yatzy Course", 0, 1, 1 );

select "Section Table" as "";
CREATE TABLE IF NOT EXISTS CC_Section(
    ID BIGINT(20) auto_increment NOT NULL,
    DisplayID BIGINT(20) NOT NULL,
    Name VARCHAR(60),
    OwnerID BIGINT(20),
    CourseID BIGINT(20),
    SourceID BIGINT(20),
    DateCreated DATETIME DEFAULT CURRENT_TIMESTAMP,
    DateUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(ID)
);
INSERT INTO CC_Section
( DisplayID, Name, OwnerID, CourseID )
VALUES
( 0, "Yatzy Basics", 1, 1 );


select "Page Table" as "";
CREATE TABLE IF NOT EXISTS CC_Page(
    ID BIGINT(20) auto_increment NOT NULL,
    DisplayID BIGINT(20) NOT NULL,
    Name VARCHAR(60),
    SectionID BIGINT(20),
    DateCreated DATETIME DEFAULT CURRENT_TIMESTAMP,
    DateUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(ID)
);
INSERT INTO CC_Page
( DisplayID, Name, SectionID)
VALUES
( 0, "Yatzy Basic Rules", 1),
( 1, "Yatzy Basic Rules Quiz", 1);



select "ElementType Table" as "";
CREATE TABLE IF NOT EXISTS CC_ElementType(
    ID BIGINT(20) auto_increment NOT NULL,
    DisplayOrder BIGINT(20),
    Name VARCHAR(60),
    DateCreated DATETIME DEFAULT CURRENT_TIMESTAMP,
    DateUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Properties MEDIUMTEXT,
    IsQuestion VARCHAR(20) DEFAULT "0",
    PRIMARY KEY(ID)
);

INSERT INTO CC_ElementType
(DisplayOrder, Name, Properties, IsQuestion)
VALUES
(0, "checkBoxQuestion", "{}", TRUE),
(1, "textBox", "{}", FALSE),
(2, "image", "{}", FALSE);

select "Element Table" as "";
CREATE TABLE IF NOT EXISTS CC_Element(
    ID BIGINT(20) auto_increment NOT NULL,
    Name VARCHAR(60),
    DisplayID BIGINT(20) NOT NULL,
    PageID BIGINT(20),
    ElementTypeID BIGINT(20),
    DateCreated DATETIME DEFAULT CURRENT_TIMESTAMP,
    DateUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Properties MEDIUMTEXT,
    PRIMARY KEY(ID)
);

INSERT INTO `CC_Element` 
VALUES 
(1,'Untitled Checkbox Question',1,2,1,'2021-12-15 08:31:38','2021-12-15 18:22:13','{\"question\":\"<p>How many dices in Yatzy</p>\",\"checkBoxes\":[{\"label\":\"<p>5</p>\",\"isAnswer\":true},{\"label\":\"<p>6</p>\",\"isAnswer\":false},{\"label\":\"<p>7</p>\",\"isCorrect\":false}]}'),
(14,'Untitled Checkbox Question',2,2,1,'2021-12-15 18:48:18','2021-12-16 09:29:52','{\"question\":\"<p><strong>How many dices are used in Yatzy?</strong></p>\",\"checkBoxes\":[{\"label\":\"<p>4 dices</p>\",\"isAnswer\":false},{\"label\":\"<p>5 dices</p>\",\"isAnswer\":true},{\"label\":\"<p>⁠⁠⁠⁠⁠⁠⁠or 6 dices</p>\",\"isCorrect\":false}]}'),
(15,'Untitled Checkbox Question',3,2,1,'2021-12-15 18:48:21','2021-12-16 09:29:52','{\"question\":\"<p><strong>What is the maximum number of points for full house?</strong></p>\",\"checkBoxes\":[{\"label\":\"<p>26</p>\",\"isAnswer\":false},{\"label\":\"<p>28</p>\",\"isAnswer\":true},{\"label\":\"<p>30</p>\",\"isCorrect\":false}]}'),
(16,'Untitled Checkbox Question',3,2,1,'2021-12-15 18:50:00','2021-12-16 09:29:52','{\"question\":\"<p><strong>How many points do you get for a “Yatzy” throw?</strong></p>\",\"checkBoxes\":[{\"label\":\"<p>75</p>\",\"isAnswer\":false},{\"label\":\"<p>50</p>\",\"isAnswer\":true},{\"label\":\"<p>100</p>\",\"isCorrect\":false}]}'),
(17,'Untitled TextBox',0,1,2,'2021-12-16 09:15:35','2021-12-16 09:16:24','{\"textBox\":{\"content\":\"<h2>The Rules of Yatzy</h2><h2>Standard Play</h2><h3>Objective of the Game</h3><p><strong>Yahtzee</strong> can be played in solitary or by a group. The group version simply consists of a number of players playing the solitary version simultaneously, with the highest score winning. I\'ll explain the solitary version, since that\'s what the applet lets you play (although you could use the \\\"Clone Window\\\" option to let multiple players play).</p><p>The game consists of 13 rounds. In each round, you <i>roll</i> the dice and then <i>score</i> the roll in one of 13 categories. You must score once in each category -- which means that towards the end of the game you may have to settle for scoring zero in some categories. The score is determined by a different rule for each category; see the section on <a href=\\\"http://grail.sourceforge.net/demo/yahtzee/rules.html#scoring\\\">Scoring</a> below.</p><p>The object of the game is to maximize your total score (of course :-). The game ends once all 13 categories have been scored.ing</p><p><br data-cke-filler=\\\"true\\\"></p><h3>Rolling the Dice</h3><p>You have five dice which you can roll, represented by the die faces at the top of the applet window. To start with, you roll all dice by clicking on the <i>Roll All</i> button. After you roll all dice, you can either <a href=\\\"http://grail.sourceforge.net/demo/yahtzee/rules.html#scoring\\\">score</a> the current roll, or re-roll any or all of the five dice.</p><p>To re-roll some of the dice, click on the toggle button underneath the die face you want to re-roll, then click on the <i>Re-roll</i> button. This will re-roll the selected dice, leaving the unselected ones unchanged.</p><p>You can roll the dice a total of three times -- the initial roll (in which you must roll all the dice), plus two re-rolls of any or all dice. After rolling three times, you must <a href=\\\"http://grail.sourceforge.net/demo/yahtzee/rules.html#scoring\\\">score the roll</a>.</p><p>Once you\'ve scored the roll, you roll all the dice again and repeat the process. You continue until all 13 categories have been filled, at which time the game is over.</p><p><br data-cke-filler=\\\"true\\\"></p><h2>Scoring</h2><p>Once you have the dice face combination you want to score, you score the roll in one of the 13 categories. You do this by clicking on one of the radio buttons in either the <i>Upper Scores</i> or <i>Lower Scores</i> box. Once a category has been scored, it is closed out for the rest of the game; you cannot change a category\'s score once it\'s been set. Each category defines its own scoring rules, as described below.</p><h3>Upper Scores</h3><p>In the upper scores, you total only the specified die face. So if you roll:<br><span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T3.gif\\\" alt=\\\"<3>\\\"></span>&nbsp;<span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T3.gif\\\" alt=\\\"<3>\\\"></span>&nbsp;<span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T4.gif\\\" alt=\\\"<4>\\\"></span>&nbsp;<span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T3.gif\\\" alt=\\\"<3>\\\"></span>&nbsp;<span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T6.gif\\\" alt=\\\"<6>\\\"></span><br>and score in the <i>Threes</i> category, your total for that entry would be 9. This same roll would yield zero points if you scored it in the <i>Aces</i> (Ones), <i>Twos</i>, or <i>Fives</i> category, four points if you scored it in the <i>Fours</i> category, or six points if you scored it in the <i>Sixes</i> category.</p><p>When the game is over, if you score 63 or more upper points (an average of 3 die faces per category), you will get an <i>upper bonus</i> of 35 points. Of course do don\'t need to score exactly three die faces in each upper category to get the bonus, as long as the upper total is at least 63.</p><p><br data-cke-filler=\\\"true\\\"></p><h3>Lower Scores</h3><p>In the lower scores, you score either a set amount (defined by the category), or zero if you don\'t satisfy the category requirements.</p><h4>3 and 4 of a Kind</h4><p>For <i>3 of a Kind</i>, you must have at least three of the same die faces. If so, you total all the die faces and score that total. Similarly for <i>4 of a Kind</i>, except that you must have 4 of the 5 die faces the same. So for example, if you rolled:<br><span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T5.gif\\\" alt=\\\"<5>\\\"></span>&nbsp;<span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T5.gif\\\" alt=\\\"<5>\\\"></span>&nbsp;<span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T3.gif\\\" alt=\\\"<3>\\\"></span>&nbsp;<span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T2.gif\\\" alt=\\\"<2>\\\"></span>&nbsp;<span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T5.gif\\\" alt=\\\"<5>\\\"></span><br>you would receive 20 points for 3 of a Kind, but zero points for 4 of a Kind.</p><p><br data-cke-filler=\\\"true\\\"></p><h4>Straights</h4><p>Like in poker, a <i>straight</i> is a sequence of consecutive die faces; a small straight is 4 consecutive faces, and a large straight is 5 consecutive faces. Small straights score 30 points and large straights score 40 points. Thus, if you rolled:<br><span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T5.gif\\\" alt=\\\"<5>\\\"></span>&nbsp;<span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T4.gif\\\" alt=\\\"<4>\\\"></span>&nbsp;<span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T3.gif\\\" alt=\\\"<3>\\\"></span>&nbsp;<span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T2.gif\\\" alt=\\\"<2>\\\"></span>&nbsp;<span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T6.gif\\\" alt=\\\"<6>\\\"></span><br>you could score either a small straight or a large straight, since this roll satisfies both.</p><p><br data-cke-filler=\\\"true\\\"></p><h4>Full House</h4><p>Again as in poker, a <i>Full House</i> is a roll where you have both a 3 of a kind, and a pair. Full houses score 25 points.</p><p><br data-cke-filler=\\\"true\\\"></p><h4>Yahtzee</h4><p>A <i>Yahtzee</i> is a 5 of a Kind (i.e. all the die faces are the same), and it scores 50 points. If you roll more than one <i>Yahtzee</i> in a single game, you will earn a 100 point bonus for each additional <i>Yahtzee</i> roll, provided that you have already scored a 50 in the <i>Yahtzee</i> category. If you have not scored in the <i>Yahtzee</i> category, you will not receive a bonus. If you have scored a zero in the <i>Yahtzee</i> category, you cannot receive any bonuses during the current game.</p><p>You can also use subsequent <i>Yahtzee</i>\'s as <strong>jokers</strong> in the lower scores section, provided the following criteria have been satisfied:</p><ol><li>You have scored a zero or 50 in the <i>Yahtzee</i> category.</li><li>You have filled the corresponding category in the upper scores section. For example, if you have rolled:<br><span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T5.gif\\\" alt=\\\"<5>\\\"></span>&nbsp;<span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T5.gif\\\" alt=\\\"<5>\\\"></span>&nbsp;<span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T5.gif\\\" alt=\\\"<5>\\\"></span>&nbsp;<span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T5.gif\\\" alt=\\\"<5>\\\"></span>&nbsp;<span class=\\\"image-inline ck-widget\\\" contenteditable=\\\"false\\\"><img src=\\\"http://grail.sourceforge.net/demo/images/dice/T5.gif\\\" alt=\\\"<5>\\\"></span><br>the <i>Fives</i> category must also be filled.</li></ol><p>If this is the case, you can use the <i>Yahtzee</i> as a joker to fill in any lower scores category. You score the category as normal. Thus for the <i>Small Straight</i>, <i>Large Straight</i>, and <i>Full House</i> categories, you would score 30, 40, and 25 points respectively. For the <i>3 of a Kind</i>, <i>4 of a Kind</i>, and <i>Chance</i> categories, you would score the total of the die face.</p><h4>Chance</h4><p><i>Chance</i> is the catch-all roll. You can roll anything and you simply total all the die faces values.</p>\"}}'),
(20,'Untitled TextBox',0,2,2,'2021-12-16 09:27:06','2021-12-16 09:29:52','{\"textBox\":{\"content\":\"<h2>The Yatzy Quiz</h2><p>Each question has only one correct answer</p>\"}}');



select "ClassroomCategory Table" as "";
CREATE TABLE IF NOT EXISTS CC_ClassroomCategory(
    ID BIGINT(20) auto_increment NOT NULL,
    Name VARCHAR(60),
    Type VARCHAR(20),
    DateCreated DATETIME,
    DateUpdated DATETIME,
    PRIMARY KEY(ID)
);
INSERT INTO CC_ClassroomCategory
( Name, Type)
VALUES
( "Game Course", "Course");

select "Classroom Table" as "";
CREATE TABLE IF NOT EXISTS CC_Classroom(
    ID BIGINT(20) auto_increment NOT NULL,
    CourseID BIGINT(20),
    OwnerID BIGINT(20),
    ClassRoomCategoryID BIGINT(20),
    Status INT DEFAULT 0,
    Name VARCHAR(60),
    DateCreated DATETIME DEFAULT CURRENT_TIMESTAMP,
    DateUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    StartDate DATETIME,
    EndDate DATETIME,
    Capacity INT,
    Price DOUBLE(10,2),
    PageScoreThreshold DOUBLE(10, 2),
    PRIMARY KEY(ID)
);
INSERT INTO CC_Classroom
( CourseID, OwnerID, ClassroomCategoryID, Name, StartDate, EndDate, Capacity, Price)
VALUES
( 1, 1, 1, "Yatzy Course Fall 2021", "2021-10-01", "2021-12-24", 10, 100.0);

select "UserGroupClassroom Table" as "";
CREATE TABLE IF NOT EXISTS CC_UserGroupClassroom(
    ID BIGINT(20) auto_increment NOT NULL,
    ClassroomID BIGINT(20),
    FUserGroupID BIGINT(20),
    DateCreated DATETIME DEFAULT CURRENT_TIMESTAMP,
    DateUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Rights VARCHAR(20),
    PRIMARY KEY(ID)
);

select "UserClassroom Table" as "";
CREATE TABLE IF NOT EXISTS CC_UserClassroom(
    ID BIGINT(20) auto_increment NOT NULL,
    ClassroomID BIGINT(20),
    UserID BIGINT(20),
    DateCreated DATETIME DEFAULT CURRENT_TIMESTAMP,
    DateUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PaymentStatus VARCHAR(20),
    Status VARCHAR(20),
    PRIMARY KEY(ID)
);
INSERT INTO CC_UserClassroom
( ClassroomID, UserID, State, PaymentStatus, Status)
VALUES
( 1, 1, null, "Paid", "started" );


select "UserClassroomElement Table" as "";
CREATE TABLE IF NOT EXISTS CC_UserClassroomElement(
    ID BIGINT(20) auto_increment NOT NULL,
    UserClassroomID BIGINT(20) NOT NULL,
    ElementID BIGINT(20) NOT NULL,
    ElementTypeID BIGINT(20) NOT NULL,
    DateCreated DATETIME DEFAULT CURRENT_TIMESTAMP,
    DateUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    State MEDIUMTEXT DEFAULT NULL,
    Points INT DEFAULT 0,
    PointsPossible INT DEFAULT 0,
    IsComplete VARCHAR(20) DEFAULT "0",
    PRIMARY KEY(ID)
);

select "Role Table" as "";
CREATE TABLE IF NOT EXISTS CC_Role(
    ID BIGINT(20) auto_increment NOT NULL,
    EntityID BIGINT(20),
    EntityType BIGINT(20),
    UserID BIGINT(20),
    Type VARCHAR(20),
    PRIMARY KEY(ID)
);

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

CREATE TABLE `CC_ElementResult` (
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

CREATE TABLE `CC_CourseSession` (
  `ID` bigint NOT NULL AUTO_INCREMENT,
  `UserID` bigint NOT NULL,
  `CourseID` bigint NOT NULL,
  `Status` tinyint NOT NULL DEFAULT '0',
  `DateCreated` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
);


/* Fill in some dummy values in the database
*
* no u 
*
*/
