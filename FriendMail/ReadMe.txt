Installation
------------

To give autologin to users, please look at the file: "jumpfile.php". Copy it  to
"cypht home" -> site/ and refer to it in friendmailhost.

Edit it for your preference. The top part (SITE_ID) etc needs to be  taken  from
Cypht's index.php

Make  sure to  also edit: modules/core/handler_modules.php  and comment  out the
line about X-Frame-Options. This way you can use Cypht in an iframe.


