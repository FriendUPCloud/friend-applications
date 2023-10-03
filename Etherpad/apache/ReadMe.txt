Installing and configuring
--------------------------

When installing the Etherpad app on a server, start by making sure you have the
latest version of NodeJS:

Then, install Etherpad on your server as a regular user:

```
git clone --branch master https://github.com/ether/etherpad-lite.git && \
 cd etherpad-lite && \
 src/bin/run.sh
```

If you want to run Etherpad permanently as a service, just exit it from console.

```
nohup src/bin/run.sh > /dev/null &
```

You may want to edit the file settings.json before running Etherpad as a 
service. One thing you may want to do is to null out the welcome text:

```
  "defaultPadText" : "",
```

Configuring Apache2
-------------------

In order to use Etherpad in Friend OS, make sure you set up an Etherpad 
sub-domain on your server. E.g.: etherpad.example.com

The example.conf in this folder gives you an example vhost file for Apache2.

You need to enable mod_substitute and the proxy modules.

Make sure you only have three components of your domain name. 

etherpad.test.example.com will fail, and will cause the Friend OS app not to
work properly.

