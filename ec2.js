const fs = require('fs');
const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-2' });
const ec2 = new AWS.EC2();

function spotPriceHistory(params, callback) {
  const NOW = new Date();
  const instanceType = 'm4.xlarge';

  const spotParams = {
    StartTime: NOW,
    EndTime: NOW,
    ProductDescriptions: ['Linux/UNIX'],
    InstanceTypes: [instanceType],
  };

  ec2.describeSpotPriceHistory(spotParams, (err, data) => {
    if (err) console.error(err, err.stack);
    callback(data);
  });
}

function requestSpotInstance(params, callback) {
  const price = params['SpotPriceHistory'][0];
  const userData = new Buffer(fs.readFileSync('./user-data', 'utf8')).toString('base64');
  const spotParams = {
    InstanceCount: 1,
    LaunchSpecification: {
      ImageId: 'ami-fcc19b99',
      InstanceType: price['InstanceType'],
      KeyName: 'id_rsa',
      Placement: {
        AvailabilityZone: price['AvailabilityZone'],
      },
      SecurityGroupIds: [
        'sg-b88d3dd1',
      ],
      UserData: userData,
    },
    SpotPrice: price['SpotPrice'],
    Type: 'one-time',
  };

  ec2.requestSpotInstances(spotParams, (err, data) => {
    if (err) console.error(err, err.stack);
    fs.writeFileSync('./request-id', data['SpotInstanceRequests'][0]['SpotInstanceRequestId']);
    callback(data);
  });
}

function cancelSpotInstance(params, callback) {
  const requestId = fs.readFileSync('./request-id', 'utf8');
  const spotParams = {
    SpotInstanceRequestIds: [requestId],
  };
  ec2.cancelSpotInstanceRequests(spotParams, (err, data) => {
    if (err) console.error(err, err.stack);
    fs.unlinkSync('./request-id');
    callback(data);
  });
}

function describeSpotInstance(params, callback) {
  const requestId = fs.readFileSync('./request-id', 'utf8');
  const spotParams = {
    SpotInstanceRequestIds: [requestId],
  };
  ec2.describeSpotInstanceRequests(spotParams, (err, data) => {
    if (err) console.error(err, err.stack);
    callback(data);
  });
}

function describeInstances(params, callback) {
  const instanceParams = {
    InstanceIds: params['instance_ids'],
  };
  ec2.describeInstances(instanceParams, (err, data) => {
    if (err) console.error(err, err.stack);
    callback(data);
  });
}

function terminateInstances(params, callback) {
  const instanceParams = {
    InstanceIds: params['instance_ids'],
  };
  ec2.terminateInstances(instanceParams, (err, data) => {
    if (err) console.error(err, err.stack);
    fs.unlinkSync('./request-id');
    callback(data);
  });
}

function start(params, callback) {
  spotPriceHistory(params, (data) => {
    requestSpotInstance(data, callback);
  });
}

function finish(params, callback) {
  describeSpotInstance(params, (data) => {
    const instanceParams = {
      instance_ids: data['SpotInstanceRequests'].map(r => r['InstanceId']),
    };
    terminateInstances(instanceParams, callback);
  });
}

function ip(params, callback) {
  describeSpotInstance(params, (data) => {
    const instanceParams = {
      instance_ids: data['SpotInstanceRequests'].map(r => r['InstanceId']),
    };
    describeInstances(instanceParams, (_data) => {
      callback(_data['Reservations'][0]['Instances'][0]['PublicIpAddress']);
    });
  });
}

module.exports = {
  price: spotPriceHistory,
  status: describeSpotInstance,
  start,
  finish,
  ip,
};
