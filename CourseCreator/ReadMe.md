CourseCreator
-------------

CourseCreator is a classroom and course creation application for e-learning in
FriendOS.


Install
-------

Create a CourseCreator package in Friend Create, or use the one provided. As
an Admin user in FriendOS, upload the package into your environment and right-
click and choose "Install package".

After this, create two new Type/Key in the "Server" app:

First:
    Type : CourseCreator
    Key  : Database

In this, add properties (examples given:

    Hostname -> localhost
    Database -> CourseCreator
    Username -> sqluser
    Password -> sqlpass
    Port     -> 3306
 
Second:
    Type : CourseCreator
    Key  : Storage
In this, add property path, the value will be the name of the folder where CourseCreator will store files
    path -> 

Now, you can execute "CourseCreator" from your GetStarted app in the "Work" 
section.


Technical setup for CourseCreator developers
--------------------------------------------

The ideal environment for developing CourseCreator is to connect a Server 
filesystem in your FriendOS environment, and connect that to the place where
you have placed your CourseCreator folder.

CourseCreator is using the "appmodule" facilities in FriendOS, and as such, is
hosting its own module for database and server interactions. To access this
appmodule when developing and testing the application, copy the CourseCreator
folder to:

* friend/build/repository/CourseCreator

Once this is done, you can access the application by double-clicking the .jsx
executable in the CourseCreator disk inside of FriendOS.
