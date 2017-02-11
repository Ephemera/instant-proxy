instant-proxy
=============

*Run HTTP proxy server on AWS EC2 Spot instance with tinyproxy*


Install
=======

```
$ npm install --global instant-proxy
```


Usage 
=====

```
$ instant-proxy --help

  Usage
    $ instant-proxy <command>

  Commands
    price   AWS EC2 spot price current history
    start   Launch spot instance with tinyproxy (port: 8888)
    finish  Terminate spot instance
    status  Describe spot instance request
    ip      Show the public ip address assigned to the instance

  Examples
    $ instant-proxy start
    $ instant-proxy ip
    '52.14.4.91'
```


License
=======

The MIT License (MIT)

Copyright (c) 2017 GyuYong Jung 
