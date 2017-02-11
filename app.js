#!/usr/bin/env node
const ec2 = require('./ec2');
const meow = require('meow');
const util = require('util');

const cli = meow(`
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
`);

const input = cli.input[0];

if (input === undefined) {
  cli.showHelp();
} else {
  ec2[input]({}, (data) => {
    console.log(util.inspect(data, { showHidden: true, depth: null }));
  });
}
